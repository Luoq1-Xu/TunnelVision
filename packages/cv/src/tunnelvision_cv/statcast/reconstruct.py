"""Reconstruct 3D pitch trajectories from Statcast 9-parameter data.

Statcast provides initial conditions at y=50ft from home plate:
  - Position: (release_pos_x, release_pos_y, release_pos_z)
  - Velocity: (vx0, vy0, vz0) in ft/s
  - Acceleration: (ax, ay, az) in ft/s^2 (constant-acceleration fit)

The constant-acceleration kinematic model:
  x(t) = x0 + vx0*t + 0.5*ax*t^2
  y(t) = y0 + vy0*t + 0.5*ay*t^2
  z(t) = z0 + vz0*t + 0.5*az*t^2

Coordinate system (catcher's perspective, home plate at origin):
  X: horizontal (positive = right from catcher)
  Y: toward pitcher (positive = toward mound)
  Z: vertical (positive = up)
"""

from __future__ import annotations

import numpy as np
import pandas as pd

from tunnelvision_cv.trajectory.reconstruct import Trajectory3D, TrajectoryPoint3D
from tunnelvision_cv.tunneling.metrics import compute_tunnel_metrics, TunnelMetrics


def statcast_to_trajectory(row: pd.Series, num_points: int = 50) -> Trajectory3D:
    """Reconstruct a full 3D trajectory from a single Statcast pitch row.

    Args:
        row: A pandas Series with Statcast columns (vx0, vy0, vz0, ax, ay, az,
             release_pos_x, release_pos_y, release_pos_z, release_speed)
        num_points: Number of trajectory points to generate

    Returns:
        Trajectory3D with evenly-spaced points from release to plate
    """
    x0 = float(row["release_pos_x"])
    y0 = float(row["release_pos_y"])
    z0 = float(row["release_pos_z"])
    vx0 = float(row["vx0"])
    vy0 = float(row["vy0"])
    vz0 = float(row["vz0"])
    ax = float(row["ax"])
    ay = float(row["ay"])
    az = float(row["az"])

    # Solve for time when ball crosses home plate (y = 0)
    # y(t) = y0 + vy0*t + 0.5*ay*t^2 = 0
    # Quadratic: 0.5*ay*t^2 + vy0*t + y0 = 0
    discriminant = vy0**2 - 2.0 * y0 * ay
    if discriminant < 0:
        raise ValueError("Cannot solve for plate crossing time (negative discriminant)")
    t_plate = (-vy0 - np.sqrt(discriminant)) / ay

    # Generate evenly-spaced time points
    times = np.linspace(0, t_plate, num_points)

    points = []
    for t in times:
        px = x0 + vx0 * t + 0.5 * ax * t**2
        py = y0 + vy0 * t + 0.5 * ay * t**2
        pz = z0 + vz0 * t + 0.5 * az * t**2
        points.append(TrajectoryPoint3D(x=px, y=py, z=pz, t=float(t)))

    velocity_mph = float(row.get("release_speed", 0.0))

    return Trajectory3D(
        points=points,
        velocity_mph=velocity_mph,
        release_point=(x0, y0, z0),
    )


def reconstruct_from_statcast(
    data: pd.DataFrame,
    num_points: int = 50,
) -> list[dict]:
    """Reconstruct trajectories for all pitches in a Statcast DataFrame.

    Returns a list of dicts matching the API Pitch schema, with tunnel metrics
    computed between consecutive pitches from the same pitcher in the same game.

    Args:
        data: DataFrame from fetch_pitcher_pitches or fetch_game_pitches
        num_points: Points per trajectory

    Returns:
        List of pitch dicts ready for the API
    """
    pitches = []
    prev_trajectory_raw: list[tuple[float, float, float, float]] | None = None
    prev_pitcher = None

    for idx, row in data.iterrows():
        try:
            traj = statcast_to_trajectory(row, num_points=num_points)
        except (ValueError, KeyError):
            continue

        trajectory_points = [
            {"x": p.x, "y": p.y, "z": p.z, "t": p.t}
            for p in traj.points
        ]

        # Raw tuples for tunnel metric computation
        trajectory_raw = [(p.x, p.y, p.z, p.t) for p in traj.points]

        # Compute tunnel metrics vs previous pitch from same pitcher
        tunnel_metrics = None
        current_pitcher = row.get("pitcher")
        if prev_trajectory_raw is not None and current_pitcher == prev_pitcher:
            try:
                tm = compute_tunnel_metrics(prev_trajectory_raw, trajectory_raw)
                tunnel_metrics = {
                    "tunnel_differential_inches": round(tm.tunnel_differential_inches, 2),
                    "plate_differential_inches": round(tm.plate_differential_inches, 2),
                    "break_differential_inches": round(tm.break_differential_inches, 2),
                    "release_point_1": list(tm.release_point_1),
                    "release_point_2": list(tm.release_point_2),
                }
            except Exception:
                pass

        pitch_type = str(row.get("pitch_type", "UN"))
        game_date = str(row.get("game_date", ""))
        ab_num = int(row.get("at_bat_number", 0))
        pitch_num = int(row.get("pitch_number", 0))

        pitches.append({
            "id": f"{game_date}-{ab_num}-{pitch_num}-{idx}",
            "session_id": f"statcast-{game_date}",
            "pitch_type": pitch_type,
            "velocity_mph": traj.velocity_mph,
            "trajectory": trajectory_points,
            "tunnel_metrics": tunnel_metrics,
            "confidence": 1.0,  # Statcast data is ground truth
        })

        prev_trajectory_raw = trajectory_raw
        prev_pitcher = current_pitcher

    return pitches
