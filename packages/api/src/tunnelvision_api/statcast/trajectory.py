"""Lightweight trajectory dataclasses for Statcast reconstruction."""

from dataclasses import dataclass

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
