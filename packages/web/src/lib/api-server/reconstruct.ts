import { Trajectory3D, TrajectoryPoint3D } from "./trajectory";
import { computeTunnelMetrics } from "./metrics";

export interface StatcastRow {
  pitch_type: string;
  release_speed: number;
  release_pos_x: number;
  release_pos_y: number;
  release_pos_z: number;
  vx0: number;
  vy0: number;
  vz0: number;
  ax: number;
  ay: number;
  az: number;
  pitcher: number;
  game_date: string;
  at_bat_number: number;
  pitch_number: number;
  [key: string]: string | number | null | undefined;
}

function statcastToTrajectory(row: StatcastRow, numPoints = 50): Trajectory3D {
  const { release_pos_x: x0, release_pos_y: y0, release_pos_z: z0 } = row;
  const { vx0, vy0, vz0, ax, ay, az } = row;

  const discriminant = vy0 ** 2 - 2.0 * y0 * ay;
  if (discriminant < 0) {
    throw new Error("Cannot solve for plate crossing time (negative discriminant)");
  }
  const tPlate = (-vy0 - Math.sqrt(discriminant)) / ay;

  const points: TrajectoryPoint3D[] = [];
  for (let i = 0; i < numPoints; i++) {
    const t = (tPlate * i) / (numPoints - 1);
    points.push({
      x: x0 + vx0 * t + 0.5 * ax * t ** 2,
      y: y0 + vy0 * t + 0.5 * ay * t ** 2,
      z: z0 + vz0 * t + 0.5 * az * t ** 2,
      t,
    });
  }

  return {
    points,
    velocity_mph: row.release_speed || 0,
    release_point: [x0, y0, z0],
  };
}

export function reconstructFromStatcast(data: StatcastRow[], numPoints = 50) {
  const pitches: Record<string, unknown>[] = [];
  let prevTrajectoryRaw: [number, number, number, number][] | null = null;
  let prevPitcher: number | null = null;

  for (let idx = 0; idx < data.length; idx++) {
    const row = data[idx];
    let traj: Trajectory3D;
    try {
      traj = statcastToTrajectory(row, numPoints);
    } catch {
      continue;
    }

    const trajectoryPoints = traj.points.map((p) => ({
      x: p.x, y: p.y, z: p.z, t: p.t,
    }));

    const trajectoryRaw: [number, number, number, number][] = traj.points.map(
      (p) => [p.x, p.y, p.z, p.t]
    );

    let tunnelMetrics: Record<string, unknown> | null = null;
    const currentPitcher = row.pitcher;
    if (prevTrajectoryRaw && currentPitcher === prevPitcher) {
      try {
        const tm = computeTunnelMetrics(prevTrajectoryRaw, trajectoryRaw);
        tunnelMetrics = {
          tunnel_differential_inches: Math.round(tm.tunnel_differential_inches * 100) / 100,
          plate_differential_inches: Math.round(tm.plate_differential_inches * 100) / 100,
          break_differential_inches: Math.round(tm.break_differential_inches * 100) / 100,
          release_point_1: tm.release_point_1,
          release_point_2: tm.release_point_2,
        };
      } catch {
        // skip
      }
    }

    const pitchType = String(row.pitch_type || "UN");
    const gameDate = String(row.game_date || "");
    const abNum = Number(row.at_bat_number || 0);
    const pitchNum = Number(row.pitch_number || 0);

    pitches.push({
      id: `${gameDate}-${abNum}-${pitchNum}-${idx}`,
      session_id: `statcast-${gameDate}`,
      pitch_type: pitchType,
      velocity_mph: traj.velocity_mph,
      trajectory: trajectoryPoints,
      tunnel_metrics: tunnelMetrics,
      confidence: 1.0,
    });

    prevTrajectoryRaw = trajectoryRaw;
    prevPitcher = currentPitcher;
  }

  return pitches;
}
