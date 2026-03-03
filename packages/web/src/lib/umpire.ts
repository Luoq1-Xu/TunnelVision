import { TrajectoryPoint } from "@/types/pitch";

// Strike zone dimensions (matching BaseballField.tsx)
const ZONE_HALF_WIDTH = 1.42 / 2; // 0.71 ft
const ZONE_BOT = 1.5; // feet (2.5 - 1.0)
const ZONE_TOP = 3.5; // feet (2.5 + 1.0)
const BALL_RADIUS = 0.12; // feet (~1.45 inches)

export function classifyPitch(
  trajectory: TrajectoryPoint[]
): "ball" | "strike" {
  const plate = trajectory[trajectory.length - 1];
  const inX = Math.abs(plate.x) <= ZONE_HALF_WIDTH + BALL_RADIUS;
  const inZ =
    plate.z >= ZONE_BOT - BALL_RADIUS && plate.z <= ZONE_TOP + BALL_RADIUS;
  return inX && inZ ? "strike" : "ball";
}

export interface AccuracyStats {
  total: number;
  correct: number;
  percentage: number;
  strikeTotal: number;
  strikeCorrect: number;
  strikePercentage: number;
  ballTotal: number;
  ballCorrect: number;
  ballPercentage: number;
}

export function computeAccuracy(
  calls: { truth: "ball" | "strike"; correct: boolean }[]
): AccuracyStats {
  const total = calls.length;
  const correct = calls.filter((c) => c.correct).length;

  const strikes = calls.filter((c) => c.truth === "strike");
  const balls = calls.filter((c) => c.truth === "ball");

  return {
    total,
    correct,
    percentage: total > 0 ? (correct / total) * 100 : 0,
    strikeTotal: strikes.length,
    strikeCorrect: strikes.filter((c) => c.correct).length,
    strikePercentage:
      strikes.length > 0
        ? (strikes.filter((c) => c.correct).length / strikes.length) * 100
        : 0,
    ballTotal: balls.length,
    ballCorrect: balls.filter((c) => c.correct).length,
    ballPercentage:
      balls.length > 0
        ? (balls.filter((c) => c.correct).length / balls.length) * 100
        : 0,
  };
}
