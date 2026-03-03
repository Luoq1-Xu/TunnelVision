"use client";

import { useMemo } from "react";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import { TrajectoryPoint } from "@/types/pitch";

interface PitchTrajectoryProps {
  points: TrajectoryPoint[];
  color: string;
  lineWidth?: number;
  showBall?: boolean;
}

export default function PitchTrajectory({
  points,
  color,
  lineWidth = 3,
  showBall = true,
}: PitchTrajectoryProps) {
  const linePoints = useMemo(() => {
    return points.map(
      (p) => new THREE.Vector3(-p.x, p.z, p.y) // negate X: Statcast positive X = catcher's right (1B), but Three.js +X renders LEFT when camera looks in +Z
    );
  }, [points]);

  if (linePoints.length < 2) return null;

  const lastPoint = linePoints[linePoints.length - 1];

  return (
    <group>
      <Line points={linePoints} color={color} lineWidth={lineWidth} />
      {showBall && (
        <mesh position={lastPoint}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color={color} />
        </mesh>
      )}
    </group>
  );
}
