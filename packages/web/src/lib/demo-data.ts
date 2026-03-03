import { Pitch, TrajectoryPoint } from "@/types/pitch";

function generateTrajectory(
  pitchType: string,
  velocityMph: number
): TrajectoryPoint[] {
  const points: TrajectoryPoint[] = [];
  const numPoints = 50;
  const velocityFtS = velocityMph * 1.467; // mph to ft/s
  const totalTime = 60.5 / velocityFtS; // time from rubber to plate

  for (let i = 0; i <= numPoints; i++) {
    const t = (i / numPoints) * totalTime;
    const y = 60.5 - velocityFtS * t; // distance from plate (decreasing)

    // Base trajectory (straight)
    let x = 0;
    let z = 5.5 - 0.5 * 32.174 * t * t; // gravity drop from ~5.5 ft release

    // Add pitch-specific movement (simplified)
    const progress = i / numPoints;
    const breakAmount = progress * progress; // movement increases quadratically

    // Demo models a RHP. Statcast convention: positive X = first base (catcher's right).
    // RHP arm-side = third base (negative X), glove-side = first base (positive X).
    switch (pitchType) {
      case "FF": // Four-seam: slight arm-side run, backspin lift
        x -= breakAmount * 0.3;
        z += breakAmount * 0.4; // backspin "rise" (less drop)
        break;
      case "SL": // Slider: glove-side break, slight drop
        x += breakAmount * 1.2;
        z -= breakAmount * 0.3;
        break;
      case "CU": // Curveball: big drop, slight glove-side
        x += breakAmount * 0.4;
        z -= breakAmount * 1.8;
        break;
      case "CH": // Changeup: arm-side run, drop
        x -= breakAmount * 0.8;
        z -= breakAmount * 0.6;
        break;
    }

    points.push({ x, y, z, t });
  }

  return points;
}

export const DEMO_PITCHES: Pitch[] = [
  {
    id: "demo-ff",
    session_id: "demo",
    pitch_type: "FF",
    velocity_mph: 95,
    trajectory: generateTrajectory("FF", 95),
    tunnel_metrics: null,
    confidence: 0.95,
  },
  {
    id: "demo-sl",
    session_id: "demo",
    pitch_type: "SL",
    velocity_mph: 87,
    trajectory: generateTrajectory("SL", 87),
    tunnel_metrics: {
      tunnel_differential_inches: 2.1,
      plate_differential_inches: 14.8,
      break_differential_inches: 12.7,
      release_point_1: [0, 5.5],
      release_point_2: [0, 5.5],
    },
    confidence: 0.92,
  },
  {
    id: "demo-cu",
    session_id: "demo",
    pitch_type: "CU",
    velocity_mph: 80,
    trajectory: generateTrajectory("CU", 80),
    tunnel_metrics: {
      tunnel_differential_inches: 3.4,
      plate_differential_inches: 22.1,
      break_differential_inches: 18.7,
      release_point_1: [0, 5.5],
      release_point_2: [0, 5.5],
    },
    confidence: 0.88,
  },
  {
    id: "demo-ch",
    session_id: "demo",
    pitch_type: "CH",
    velocity_mph: 85,
    trajectory: generateTrajectory("CH", 85),
    tunnel_metrics: {
      tunnel_differential_inches: 1.8,
      plate_differential_inches: 11.2,
      break_differential_inches: 9.4,
      release_point_1: [0, 5.5],
      release_point_2: [0, 5.5],
    },
    confidence: 0.91,
  },
];
