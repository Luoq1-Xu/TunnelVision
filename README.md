# TunnelVision

Pitch tunneling computer vision pipeline. Takes pitching footage, tracks baseballs, reconstructs 3D trajectories, and visualizes the "tunnel point" where two pitches diverge.

## Architecture

- **packages/cv/** — Python: ball detection (YOLO11), tracking (ByteTrack), 3D trajectory reconstruction (not currently in use)
- **packages/api/** — Python: FastAPI backend serving processed pitch data
- **packages/web/** — TypeScript: Next.js + React Three Fiber 3D pitch visualization

## Quick Start

```bash
# Install all dependencies
make setup

# Start infrastructure (Postgres + Redis)
make infra-up

# Run API server
make dev-api

# Run web frontend (separate terminal)
make dev-web
```

## Tech Stack

| Component | Technology |
|---|---|
| Object detection | YOLO11 (Ultralytics) |
| Ball tracking | ByteTrack (supervision) |
| 3D reconstruction | Physics-based NLS (scipy) |
| Backend | FastAPI + SQLModel + ARQ |
| Database | PostgreSQL |
| Job queue | Redis |
| Frontend | Next.js 15 + React Three Fiber |
| Python tooling | uv |
