"""TunnelVision API entrypoint."""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from tunnelvision_api.routes.sessions import router as sessions_router
from tunnelvision_api.routes.pitches import router as pitches_router
from tunnelvision_api.routes.statcast import router as statcast_router

app = FastAPI(
    title="TunnelVision API",
    description="Pitch tunneling analysis backend",
    version="0.1.0",
)

_default_origins = ["http://localhost:3000"]
_extra = os.environ.get("CORS_ORIGINS", "")
_origins = _default_origins + [o.strip() for o in _extra.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sessions_router)
app.include_router(pitches_router)
app.include_router(statcast_router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
