"""Session routes: upload, status, and pitch retrieval."""

from fastapi import APIRouter, UploadFile, File, HTTPException

from tunnelvision_api.models import Session, SessionCreate, SessionStatus, Pitch

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.post("/", response_model=SessionStatus)
async def create_session(body: SessionCreate):
    """Create a new analysis session."""
    # TODO: Create session in DB, return session ID
    raise HTTPException(status_code=501, detail="Not implemented")


@router.post("/{session_id}/upload")
async def upload_video(session_id: str, file: UploadFile = File(...)):
    """Upload a video file for a session and enqueue processing."""
    # TODO: Save file, enqueue CV processing job via Redis/ARQ
    raise HTTPException(status_code=501, detail="Not implemented")


@router.get("/{session_id}", response_model=Session)
async def get_session(session_id: str):
    """Get session details including all pitches."""
    # TODO: Fetch from DB
    raise HTTPException(status_code=501, detail="Not implemented")


@router.get("/{session_id}/status", response_model=SessionStatus)
async def get_session_status(session_id: str):
    """Get processing status for a session."""
    # TODO: Fetch status from DB
    raise HTTPException(status_code=501, detail="Not implemented")


@router.get("/{session_id}/pitches", response_model=list[Pitch])
async def get_pitches(session_id: str):
    """Get all pitch trajectories for a session."""
    # TODO: Fetch pitches from DB
    raise HTTPException(status_code=501, detail="Not implemented")
