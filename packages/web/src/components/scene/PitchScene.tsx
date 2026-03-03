"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import BaseballField from "./BaseballField";
import PitchTrajectory from "../pitch/PitchTrajectory";
import AnimatedBall from "../pitch/AnimatedBall";
import { Pitch, PITCH_COLORS, TUNNEL_POINT_Y } from "@/types/pitch";
import { usePitchStore, ViewMode } from "@/lib/store";

const VIEW_PRESETS: Record<
  ViewMode,
  { position: [number, number, number]; target: [number, number, number] }
> = {
  default: { position: [0, 5, -8], target: [0, 2.5, TUNNEL_POINT_Y] },
  catcher: { position: [0, 2.5, -4], target: [0, 2.5, 30] },
  umpire: { position: [0, 3, -6], target: [0, 2.5, 30] },
  lhb: { position: [-2.5, 5, -1], target: [0, 2.5, 25] },
  rhb: { position: [2.5, 5, -1], target: [0, 2.5, 25] },
  batter_lhb: { position: [-2.5, 5, -1], target: [0, 2.5, 25] },
  batter_rhb: { position: [2.5, 5, -1], target: [0, 2.5, 25] },
};

/** Mouse-driven first-person camera for batter mode playing phase.
 *
 *  Maps absolute mouse position to camera rotation so the batter can
 *  track the ball all the way from the pitcher to the plate.
 *
 *  Yaw:   ±80° (160° total horizontal sweep)
 *  Pitch: +20° (up) to −100° (down toward plate/feet) = 120° total
 *         Center of screen ≈ −40° (natural batting eye line)
 */
function BatterMouseLook({ hand }: { hand: "left" | "right" }) {
  const { camera, gl } = useThree();
  const mousePos = useRef({ x: 0, y: 0 });

  // Position the camera at the batter box
  useEffect(() => {
    const preset = hand === "left" ? VIEW_PRESETS.batter_lhb : VIEW_PRESETS.batter_rhb;
    camera.position.set(...preset.position);
  }, [hand, camera]);

  // Track mouse position on the canvas
  useEffect(() => {
    const canvas = gl.domElement;
    const handler = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      // Normalize to [-1, 1]
      mousePos.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mousePos.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };
    canvas.addEventListener("mousemove", handler);
    return () => canvas.removeEventListener("mousemove", handler);
  }, [gl]);

  // Every frame: convert mouse position to yaw/pitch rotation
  useFrame(() => {
    const { x: mx, y: my } = mousePos.current;
    const DEG = Math.PI / 180;

    // Horizontal: ±80° — negate so mouse-right = look-right
    const yaw = -mx * 80 * DEG;

    // Vertical: 120° range
    // top of screen (my=1) → +20° (up at pitcher)
    // bottom of screen (my=-1) → −100° (down at plate / feet)
    // center (my=0) → −40° (natural forward-down batting eye line)
    const pitch = (20 - (1 - my) * 60) * DEG;

    // Compute look direction from yaw/pitch (base direction = +Z toward pitcher)
    const cosPitch = Math.cos(pitch);
    const lookDir = new THREE.Vector3(
      Math.sin(yaw) * cosPitch,
      Math.sin(pitch),
      Math.cos(yaw) * cosPitch
    );

    camera.lookAt(
      camera.position.x + lookDir.x,
      camera.position.y + lookDir.y,
      camera.position.z + lookDir.z
    );
  });

  return null;
}

function CameraController() {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const viewMode = usePitchStore((s) => s.viewMode);
  const batterPhase = usePitchStore((s) => s.batter.phase);
  const batterHand = usePitchStore((s) => s.batter.hand);
  const prevMode = useRef<ViewMode>(viewMode);
  const isFixed = viewMode !== "default";

  // During batter playing phase, use mouse-look instead of OrbitControls
  const useBatterMouseLook = batterPhase === "playing";

  useEffect(() => {
    if (viewMode === prevMode.current) return;
    prevMode.current = viewMode;

    const preset = VIEW_PRESETS[viewMode];
    const startPos = camera.position.clone();
    const endPos = new THREE.Vector3(...preset.position);
    const startTarget = controlsRef.current
      ? controlsRef.current.target.clone()
      : new THREE.Vector3(0, 2.5, TUNNEL_POINT_Y);

    // For fixed modes, place the target a tiny distance from the camera
    // in the initial look direction. This makes OrbitControls act as a
    // first-person camera: the camera stays put and you rotate your view.
    const fixedMode = viewMode !== "default";
    const endTarget = fixedMode
      ? new THREE.Vector3(...preset.position).add(
          new THREE.Vector3(...preset.target)
            .sub(new THREE.Vector3(...preset.position))
            .normalize()
            .multiplyScalar(0.01)
        )
      : new THREE.Vector3(...preset.target);

    const duration = 600; // ms
    const startTime = performance.now();

    function animate() {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);

      camera.position.lerpVectors(startPos, endPos, ease);

      if (controlsRef.current) {
        controlsRef.current.target.lerpVectors(startTarget, endTarget, ease);
        controlsRef.current.update();
      }

      if (t < 1) {
        requestAnimationFrame(animate);
      } else if (fixedMode && controlsRef.current) {
        // Lock the orbit radius so rotation can't move the camera position
        controlsRef.current.minDistance = 0.01;
        controlsRef.current.maxDistance = 0.01;
        controlsRef.current.update();
      }
    }

    animate();
  }, [viewMode, camera]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    if (isFixed) {
      controls.enablePan = false;
      controls.enableZoom = false;
    } else {
      controls.enablePan = true;
      controls.enableZoom = true;
      controls.minDistance = 0;
      controls.maxDistance = Infinity;
    }
  }, [isFixed]);

  if (useBatterMouseLook) {
    return <BatterMouseLook hand={batterHand} />;
  }

  return (
    <OrbitControls
      ref={controlsRef}
      target={VIEW_PRESETS.default.target}
      enablePan={!isFixed}
      enableZoom={!isFixed}
    />
  );
}

function SceneContent({ pitches }: { pitches: Pitch[] }) {
  const umpire = usePitchStore((s) => s.umpire);
  const batter = usePitchStore((s) => s.batter);
  const allPitches = usePitchStore((s) => s.pitches);
  const setAwaitingCall = usePitchStore((s) => s.setAwaitingCall);
  const setBatterAwaitingCall = usePitchStore((s) => s.setBatterAwaitingCall);
  const [umpireReplayCounter, setUmpireReplayCounter] = useState(0);
  const [batterReplayCounter, setBatterReplayCounter] = useState(0);

  // --- Umpire state ---
  const umpirePlaying =
    umpire.phase === "playing" &&
    umpire.currentIndex < umpire.pitchQueue.length;
  const umpireReviewing = umpire.phase === "reviewing";

  const umpireCurrentPitch = umpirePlaying
    ? allPitches.find((p) => p.id === umpire.pitchQueue[umpire.currentIndex])
    : null;
  const umpireReviewPitch = umpireReviewing
    ? allPitches.find((p) => p.id === umpire.pitchQueue[umpire.reviewIndex])
    : null;

  // --- Batter state ---
  const batterPlaying =
    batter.phase === "playing" &&
    batter.currentIndex < batter.pitchQueue.length;
  const batterReviewing = batter.phase === "reviewing";

  const batterCurrentPitch = batterPlaying
    ? allPitches.find((p) => p.id === batter.pitchQueue[batter.currentIndex])
    : null;
  const batterReviewPitch = batterReviewing
    ? allPitches.find((p) => p.id === batter.pitchQueue[batter.reviewIndex])
    : null;

  const isIdle = umpire.phase === "idle" && batter.phase === "idle";
  const hideZone = umpire.phase === "playing" || batter.phase === "playing";

  const handleUmpireComplete = useCallback(() => {
    setAwaitingCall(true);
  }, [setAwaitingCall]);

  const handleBatterComplete = useCallback(() => {
    setBatterAwaitingCall(true);
  }, [setBatterAwaitingCall]);

  // Replay counters: bumped via custom events from review HUD replay buttons
  useEffect(() => {
    const handler = () => setUmpireReplayCounter((k) => k + 1);
    window.addEventListener("umpire-replay", handler);
    return () => window.removeEventListener("umpire-replay", handler);
  }, []);

  useEffect(() => {
    const handler = () => setBatterReplayCounter((k) => k + 1);
    window.addEventListener("batter-replay", handler);
    return () => window.removeEventListener("batter-replay", handler);
  }, []);

  return (
    <>
      <BaseballField hideStrikeZone={hideZone} />

      {/* Normal mode: static trajectories */}
      {isIdle &&
        pitches.map((pitch) => (
          <PitchTrajectory
            key={pitch.id}
            points={pitch.trajectory}
            color={PITCH_COLORS[pitch.pitch_type] ?? "#888888"}
          />
        ))}

      {/* Umpire play mode: animated ball only */}
      {umpirePlaying && umpireCurrentPitch && (
        <AnimatedBall
          key={`ump-play-${umpireCurrentPitch.id}`}
          trajectory={umpireCurrentPitch.trajectory}
          color="#ffffff"
          onComplete={handleUmpireComplete}
        />
      )}

      {/* Umpire review mode: animated ball that stays at plate */}
      {umpireReviewing && umpireReviewPitch && (
        <AnimatedBall
          key={`ump-review-${umpireReviewPitch.id}-${umpire.reviewIndex}-${umpireReplayCounter}`}
          trajectory={umpireReviewPitch.trajectory}
          color={PITCH_COLORS[umpireReviewPitch.pitch_type] ?? "#888888"}
          onComplete={() => {}}
          showTrailAfter
        />
      )}

      {/* Batter play mode: animated ball only */}
      {batterPlaying && batterCurrentPitch && (
        <AnimatedBall
          key={`bat-play-${batterCurrentPitch.id}`}
          trajectory={batterCurrentPitch.trajectory}
          color="#ffffff"
          onComplete={handleBatterComplete}
        />
      )}

      {/* Batter review mode: animated ball that stays at plate */}
      {batterReviewing && batterReviewPitch && (
        <AnimatedBall
          key={`bat-review-${batterReviewPitch.id}-${batter.reviewIndex}-${batterReplayCounter}`}
          trajectory={batterReviewPitch.trajectory}
          color={PITCH_COLORS[batterReviewPitch.pitch_type] ?? "#888888"}
          onComplete={() => {}}
          showTrailAfter
        />
      )}
    </>
  );
}

interface PitchSceneProps {
  pitches: Pitch[];
}

export default function PitchScene({ pitches }: PitchSceneProps) {
  return (
    <Canvas style={{ width: "100%", height: "100%" }}>
      <PerspectiveCamera makeDefault position={[0, 5, -8]} fov={45} />
      <CameraController />

      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 20, 10]} intensity={0.8} />

      <SceneContent pitches={pitches} />
    </Canvas>
  );
}
