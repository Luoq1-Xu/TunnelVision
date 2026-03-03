"""Pitch tunneling metrics computation."""

from dataclasses import dataclass

import numpy as np

TUNNEL_POINT_DISTANCE_FT = 23.8  # feet from home plate


@dataclass
class TunnelMetrics:
    """Tunneling metrics between two pitches."""

    tunnel_differential_inches: float  # separation at tunnel point
    plate_differential_inches: float  # separation at home plate
    break_differential_inches: float  # plate_diff - tunnel_diff
    release_point_1: tuple[float, float]  # (x, z) at release
    release_point_2: tuple[float, float]  # (x, z) at release


def compute_tunnel_metrics(
    trajectory_1: list[tuple[float, float, float, float]],  # [(x, y, z, t), ...]
    trajectory_2: list[tuple[float, float, float, float]],
) -> TunnelMetrics:
    """Compute tunneling metrics between two pitch trajectories.

    Args:
        trajectory_1: First pitch trajectory as list of (x, y, z, t) points
        trajectory_2: Second pitch trajectory as list of (x, y, z, t) points

    Returns:
        TunnelMetrics with tunnel differential, plate differential, etc.
    """
    t1 = np.array(trajectory_1)
    t2 = np.array(trajectory_2)

    # Interpolate both trajectories at the tunnel point (y = 23.8 ft)
    pos1_tunnel = _interpolate_at_y(t1, TUNNEL_POINT_DISTANCE_FT)
    pos2_tunnel = _interpolate_at_y(t2, TUNNEL_POINT_DISTANCE_FT)

    # Interpolate at home plate (y = 0)
    pos1_plate = _interpolate_at_y(t1, 0.0)
    pos2_plate = _interpolate_at_y(t2, 0.0)

    # Release points (y ≈ 60.5)
    rp1 = (float(t1[0, 0]), float(t1[0, 2]))
    rp2 = (float(t2[0, 0]), float(t2[0, 2]))

    tunnel_diff = _distance_xz(pos1_tunnel, pos2_tunnel) * 12  # feet to inches
    plate_diff = _distance_xz(pos1_plate, pos2_plate) * 12

    return TunnelMetrics(
        tunnel_differential_inches=tunnel_diff,
        plate_differential_inches=plate_diff,
        break_differential_inches=plate_diff - tunnel_diff,
        release_point_1=rp1,
        release_point_2=rp2,
    )


def _interpolate_at_y(
    trajectory: np.ndarray, target_y: float
) -> tuple[float, float, float]:
    """Linearly interpolate trajectory position at a given y distance."""
    ys = trajectory[:, 1]
    # Find the two points bracketing target_y (y decreases from rubber to plate)
    for i in range(len(ys) - 1):
        if (ys[i] >= target_y >= ys[i + 1]) or (ys[i] <= target_y <= ys[i + 1]):
            t_frac = (target_y - ys[i]) / (ys[i + 1] - ys[i])
            x = trajectory[i, 0] + t_frac * (trajectory[i + 1, 0] - trajectory[i, 0])
            z = trajectory[i, 2] + t_frac * (trajectory[i + 1, 2] - trajectory[i, 2])
            return (x, target_y, z)
    # Fallback: use nearest point
    idx = np.argmin(np.abs(ys - target_y))
    return (float(trajectory[idx, 0]), target_y, float(trajectory[idx, 2]))


def _distance_xz(
    p1: tuple[float, float, float], p2: tuple[float, float, float]
) -> float:
    """Euclidean distance in the x-z plane (horizontal + vertical)."""
    return float(np.sqrt((p1[0] - p2[0]) ** 2 + (p1[2] - p2[2]) ** 2))
