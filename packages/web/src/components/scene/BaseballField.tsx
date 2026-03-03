"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { MOUND_DISTANCE, TUNNEL_POINT_Y } from "@/types/pitch";

interface BaseballFieldProps {
  hideStrikeZone?: boolean;
}

export default function BaseballField({ hideStrikeZone = false }: BaseballFieldProps) {
  const homePlateShape = useMemo(() => {
    // MLB home plate: 17" wide, 8.5" side edges, 12" angled edges to point
    const W = 17 / 24; // half-width in feet
    const S = 8.5 / 12; // side edge height in feet
    const P = Math.sqrt(12 * 12 - 8.5 * 8.5) / 12; // triangle height in feet
    const cy = (S + P) / 2; // center offset

    const shape = new THREE.Shape();
    shape.moveTo(-W, -cy); // front-left (faces pitcher)
    shape.lineTo(W, -cy); // front-right
    shape.lineTo(W, S - cy); // side-right
    shape.lineTo(0, S + P - cy); // point (faces catcher)
    shape.lineTo(-W, S - cy); // side-left
    shape.closePath();
    return shape;
  }, []);

  return (
    <group>
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[20, MOUND_DISTANCE + 10]} />
        <meshStandardMaterial color="#2d5a27" transparent opacity={0.3} />
      </mesh>

      {/* Pitcher's rubber */}
      <mesh position={[0, 0.85, MOUND_DISTANCE]}>
        <boxGeometry args={[2, 0.1, 0.5]} />
        <meshStandardMaterial color="#f5f5dc" />
      </mesh>

      {/* Home plate */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <shapeGeometry args={[homePlateShape]} />
        <meshStandardMaterial color="#f5f5dc" />
      </mesh>

      {/* Strike zone (transparent box) */}
      {!hideStrikeZone && (
        <mesh position={[0, 2.5, 0]}>
          <boxGeometry args={[1.42, 2.0, 0.01]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.15} wireframe />
        </mesh>
      )}

      {/* Tunnel point plane (semi-transparent) */}
      <mesh position={[0, 2.5, TUNNEL_POINT_Y]}>
        <planeGeometry args={[6, 6]} />
        <meshStandardMaterial color="#ffaa00" transparent opacity={0.08} side={2} />
      </mesh>

      {/* Tunnel point label distance marker line on ground */}
      <mesh position={[0, 0.02, TUNNEL_POINT_Y]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 0.05]} />
        <meshStandardMaterial color="#ffaa00" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}
