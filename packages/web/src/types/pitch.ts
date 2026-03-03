export interface TrajectoryPoint {
  x: number; // feet, horizontal
  y: number; // feet, distance from plate (0=plate, 60.5=rubber)
  z: number; // feet, vertical
  t: number; // seconds from release
}

export interface TunnelMetrics {
  tunnel_differential_inches: number;
  plate_differential_inches: number;
  break_differential_inches: number;
  release_point_1: [number, number]; // [x, z]
  release_point_2: [number, number]; // [x, z]
}

export interface Pitch {
  id: string;
  session_id: string;
  pitch_type: string; // FF, SL, CU, CH, SI, FC
  velocity_mph: number;
  trajectory: TrajectoryPoint[];
  tunnel_metrics: TunnelMetrics | null;
  confidence: number;
}

export interface Session {
  id: string;
  status: "queued" | "extracting" | "tracking" | "reconstructing" | "done" | "error";
  video_filename: string;
  pitcher_name?: string;
  pitches: Pitch[];
}

export const PITCH_COLORS: Record<string, string> = {
  FF: "#e74c3c", // Four-seam fastball - red
  SI: "#e67e22", // Sinker - orange
  FC: "#f39c12", // Cutter - yellow
  SL: "#2ecc71", // Slider - green
  CU: "#3498db", // Curveball - blue
  CH: "#9b59b6", // Changeup - purple
};

export interface UmpireCall {
  pitchId: string;
  userCall: "ball" | "strike";
  truth: "ball" | "strike";
  correct: boolean;
}

export const TUNNEL_POINT_Y = 23.8; // feet from home plate
export const MOUND_DISTANCE = 60.5; // feet, rubber to plate
