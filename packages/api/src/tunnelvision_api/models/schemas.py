"""Pydantic models for API request/response schemas."""

from pydantic import BaseModel


class TrajectoryPoint(BaseModel):
    x: float  # feet, horizontal
    y: float  # feet, distance from plate (0=plate, 60.5=rubber)
    z: float  # feet, vertical
    t: float  # seconds from release


class TunnelMetrics(BaseModel):
    tunnel_differential_inches: float
    plate_differential_inches: float
    break_differential_inches: float
    release_point_1: tuple[float, float]  # (x, z)
    release_point_2: tuple[float, float]  # (x, z)


class Pitch(BaseModel):
    id: str
    session_id: str
    pitch_type: str  # FF, SL, CU, CH, SI, FC, etc.
    velocity_mph: float
    trajectory: list[TrajectoryPoint]
    tunnel_metrics: TunnelMetrics | None = None
    confidence: float


class Session(BaseModel):
    id: str
    status: str  # queued | extracting | tracking | reconstructing | done | error
    video_filename: str
    pitcher_name: str | None = None
    pitches: list[Pitch] = []


class SessionCreate(BaseModel):
    pitcher_name: str | None = None


class SessionStatus(BaseModel):
    id: str
    status: str
    pitch_count: int = 0
