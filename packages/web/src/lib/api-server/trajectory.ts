export const GRAVITY_FT_S2 = -32.174;
export const MOUND_DISTANCE_FT = 60.5;

export interface TrajectoryPoint3D {
  x: number;
  y: number;
  z: number;
  t: number;
}

export interface Trajectory3D {
  points: TrajectoryPoint3D[];
  velocity_mph: number;
  release_point: [number, number, number];
}
