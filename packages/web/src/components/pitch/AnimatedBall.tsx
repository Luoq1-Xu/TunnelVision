"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { TrajectoryPoint } from "@/types/pitch";

interface AnimatedBallProps {
  trajectory: TrajectoryPoint[];
  color: string;
  onComplete: () => void;
  showTrailAfter?: boolean; // if true, show static trajectory + ball at plate after animation
}

export default function AnimatedBall({
  trajectory,
  color,
  onComplete,
  showTrailAfter = false,
}: AnimatedBallProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const elapsed = useRef(0);
  const completed = useRef(false);
  const totalTime = trajectory[trajectory.length - 1].t;

  useFrame((_, delta) => {
    if (!meshRef.current || completed.current) return;

    elapsed.current += delta;

    if (elapsed.current >= totalTime) {
      if (showTrailAfter) {
        // Keep ball visible at plate position
        const plate = trajectory[trajectory.length - 1];
        meshRef.current.position.set(-plate.x, plate.z, plate.y);
      } else {
        meshRef.current.visible = false;
      }
      completed.current = true;
      onComplete();
      return;
    }

    // Find surrounding trajectory points by time
    let i = 0;
    while (i < trajectory.length - 1 && trajectory[i + 1].t < elapsed.current)
      i++;

    const p0 = trajectory[i];
    const p1 = trajectory[Math.min(i + 1, trajectory.length - 1)];
    const segDuration = p1.t - p0.t;
    const localT = segDuration > 0 ? (elapsed.current - p0.t) / segDuration : 0;

    // Interpolate in Statcast coords, then transform to Three.js
    const x = p0.x + (p1.x - p0.x) * localT;
    const y = p0.y + (p1.y - p0.y) * localT;
    const z = p0.z + (p1.z - p0.z) * localT;

    meshRef.current.position.set(-x, z, y);
  });

  // Initial position at release point
  const start = trajectory[0];

  return (
    <mesh ref={meshRef} position={[-start.x, start.z, start.y]}>
      <sphereGeometry args={[0.12, 16, 16]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}
