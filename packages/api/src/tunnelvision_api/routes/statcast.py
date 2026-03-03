"""Statcast routes: fetch real MLB pitch data and reconstruct trajectories."""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from tunnelvision_api.models import Pitch

router = APIRouter(prefix="/api/statcast", tags=["statcast"])


class PlayerSearchResult(BaseModel):
    mlbam_id: int
    first_name: str
    last_name: str
    played_first: int | None = None
    played_last: int | None = None


@router.get("/players/search", response_model=list[PlayerSearchResult])
async def search_players(
    q: str = Query(..., min_length=2, description="Search query (name or partial name)"),
    limit: int = Query(10, ge=1, le=25, description="Max results"),
):
    """Fuzzy-search MLB players by name. Handles diacritics automatically."""
    try:
        from tunnelvision_api.statcast import search_players as do_search

        results = do_search(q, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Player search failed: {e}")
    return results


@router.get("/pitcher/{mlbam_id}", response_model=list[Pitch])
async def get_pitcher_pitches_by_id(
    mlbam_id: int,
    start_dt: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_dt: str = Query(..., description="End date (YYYY-MM-DD)"),
    limit: int = Query(20, ge=1, le=200, description="Max pitches to return"),
):
    """Fetch pitches by MLB AM player ID (skips name lookup)."""
    try:
        from tunnelvision_api.statcast import fetch_pitcher_pitches_by_id, reconstruct_from_statcast

        data = fetch_pitcher_pitches_by_id(mlbam_id, start_dt, end_dt)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch Statcast data: {e}")

    if data.empty:
        return []

    data = data.head(limit)
    pitches = reconstruct_from_statcast(data)
    return pitches


@router.get("/pitcher", response_model=list[Pitch])
async def get_pitcher_pitches(
    first_name: str = Query(..., description="Pitcher first name"),
    last_name: str = Query(..., description="Pitcher last name"),
    start_dt: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_dt: str = Query(..., description="End date (YYYY-MM-DD)"),
    limit: int = Query(20, ge=1, le=200, description="Max pitches to return"),
):
    """Fetch a pitcher's pitches from Statcast and return reconstructed 3D trajectories."""
    try:
        from tunnelvision_api.statcast import fetch_pitcher_pitches, reconstruct_from_statcast

        data = fetch_pitcher_pitches(first_name, last_name, start_dt, end_dt)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch Statcast data: {e}")

    if data.empty:
        return []

    data = data.head(limit)
    pitches = reconstruct_from_statcast(data)
    return pitches


@router.get("/game", response_model=list[Pitch])
async def get_game_pitches(
    date: str = Query(..., description="Game date (YYYY-MM-DD)"),
    limit: int = Query(50, ge=1, le=500, description="Max pitches to return"),
):
    """Fetch all pitches for a game date and return reconstructed 3D trajectories."""
    try:
        from tunnelvision_api.statcast import fetch_game_pitches, reconstruct_from_statcast

        data = fetch_game_pitches(start_dt=date, end_dt=date)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch Statcast data: {e}")

    if data.empty:
        return []

    data = data.head(limit)
    pitches = reconstruct_from_statcast(data)
    return pitches
