const TUNNEL_POINT_DISTANCE_FT = 23.8;

export interface TunnelMetricsResult {
  tunnel_differential_inches: number;
  plate_differential_inches: number;
  break_differential_inches: number;
  release_point_1: [number, number];
  release_point_2: [number, number];
}

type Point4 = [number, number, number, number]; // x, y, z, t

export function computeTunnelMetrics(
  trajectory1: Point4[],
  trajectory2: Point4[]
): TunnelMetricsResult {
  const pos1Tunnel = interpolateAtY(trajectory1, TUNNEL_POINT_DISTANCE_FT);
  const pos2Tunnel = interpolateAtY(trajectory2, TUNNEL_POINT_DISTANCE_FT);

  const pos1Plate = interpolateAtY(trajectory1, 0.0);
  const pos2Plate = interpolateAtY(trajectory2, 0.0);

  const rp1: [number, number] = [trajectory1[0][0], trajectory1[0][2]];
  const rp2: [number, number] = [trajectory2[0][0], trajectory2[0][2]];

  const tunnelDiff = distanceXZ(pos1Tunnel, pos2Tunnel) * 12;
  const plateDiff = distanceXZ(pos1Plate, pos2Plate) * 12;

  return {
    tunnel_differential_inches: tunnelDiff,
    plate_differential_inches: plateDiff,
    break_differential_inches: plateDiff - tunnelDiff,
    release_point_1: rp1,
    release_point_2: rp2,
  };
}

function interpolateAtY(
  trajectory: Point4[],
  targetY: number
): [number, number, number] {
  for (let i = 0; i < trajectory.length - 1; i++) {
    const y0 = trajectory[i][1];
    const y1 = trajectory[i + 1][1];
    if ((y0 >= targetY && targetY >= y1) || (y0 <= targetY && targetY <= y1)) {
      const frac = (targetY - y0) / (y1 - y0);
      const x = trajectory[i][0] + frac * (trajectory[i + 1][0] - trajectory[i][0]);
      const z = trajectory[i][2] + frac * (trajectory[i + 1][2] - trajectory[i][2]);
      return [x, targetY, z];
    }
  }
  // Fallback: nearest point
  let minIdx = 0;
  let minDist = Math.abs(trajectory[0][1] - targetY);
  for (let i = 1; i < trajectory.length; i++) {
    const d = Math.abs(trajectory[i][1] - targetY);
    if (d < minDist) {
      minDist = d;
      minIdx = i;
    }
  }
  return [trajectory[minIdx][0], targetY, trajectory[minIdx][2]];
}

function distanceXZ(
  p1: [number, number, number],
  p2: [number, number, number]
): number {
  return Math.sqrt((p1[0] - p2[0]) ** 2 + (p1[2] - p2[2]) ** 2);
}
