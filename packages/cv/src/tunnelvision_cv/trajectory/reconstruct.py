"""Physics-based 3D trajectory reconstruction from 2D observations."""

from dataclasses import dataclass

import numpy as np
from scipy.optimize import least_squares

# Physical constants
GRAVITY_FT_S2 = -32.174  # ft/s^2
MOUND_DISTANCE_FT = 60.5  # pitcher's rubber to home plate


@dataclass
class TrajectoryPoint3D:
    """A point on the 3D trajectory."""

    x: float  # feet, horizontal
    y: float  # feet, distance from plate (0=plate, 60.5=rubber)
    z: float  # feet, vertical
    t: float  # seconds from release


@dataclass
class Trajectory3D:
    """Complete 3D pitch trajectory."""

    points: list[TrajectoryPoint3D]
    velocity_mph: float
    release_point: tuple[float, float, float]  # (x, y, z) in feet


def reconstruct_trajectory(
    pixel_positions: np.ndarray,
    frame_times: np.ndarray,
    camera_matrix: np.ndarray | None = None,
) -> Trajectory3D:
    """Reconstruct 3D trajectory from 2D pixel observations.

    Uses non-linear least squares with baseball physics constraints
    (gravity + drag + Magnus effect) to estimate the 3D path.

    Args:
        pixel_positions: (N, 2) array of (x, y) pixel coordinates per frame
        frame_times: (N,) array of timestamps in seconds
        camera_matrix: Optional 3x3 intrinsic camera matrix

    Returns:
        Reconstructed 3D trajectory
    """
    # TODO: Implement full physics-based reconstruction
    # 1. Initial estimate from 2D positions + assumed camera geometry
    # 2. Parameterize as: release_pos (3), release_vel (3), spin_vector (3)
    # 3. Forward model: integrate equations of motion with gravity + drag + Magnus
    # 4. Minimize reprojection error via least_squares
    raise NotImplementedError("3D reconstruction not yet implemented")


def baseball_physics_model(
    t: float,
    pos0: np.ndarray,
    vel0: np.ndarray,
    drag_coeff: float = 0.3,
) -> np.ndarray:
    """Simple ballistic model with gravity and constant drag.

    Args:
        t: Time since release (seconds)
        pos0: Initial position [x, y, z] in feet
        vel0: Initial velocity [vx, vy, vz] in ft/s
        drag_coeff: Drag deceleration factor

    Returns:
        Position [x, y, z] at time t
    """
    gravity = np.array([0, 0, GRAVITY_FT_S2])
    drag = -drag_coeff * vel0  # simplified linear drag

    pos = pos0 + vel0 * t + 0.5 * (gravity + drag) * t**2
    return pos
