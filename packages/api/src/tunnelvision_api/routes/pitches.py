"""Pitch routes: individual pitch details and tunnel metrics."""

from fastapi import APIRouter, HTTPException

from tunnelvision_api.models import Pitch, TunnelMetrics

router = APIRouter(prefix="/api/pitches", tags=["pitches"])


@router.get("/{pitch_id}", response_model=Pitch)
async def get_pitch(pitch_id: str):
    """Get a single pitch with full 3D trajectory."""
    # TODO: Fetch from DB
    raise HTTPException(status_code=501, detail="Not implemented")


@router.get("/{pitch_id}/tunnel", response_model=TunnelMetrics)
async def get_tunnel_metrics(pitch_id: str):
    """Get tunnel metrics for a pitch vs. the preceding pitch."""
    # TODO: Compute or fetch cached tunnel metrics
    raise HTTPException(status_code=501, detail="Not implemented")
