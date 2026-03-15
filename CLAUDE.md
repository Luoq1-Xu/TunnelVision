# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TunnelVision is a pitch tunneling visualization tool. It fetches MLB Statcast data, reconstructs 3D pitch trajectories, and visualizes the "tunnel point" where pitches diverge. Monorepo with two packages: CV (computer vision, not deployed) and Web (Next.js + React Three Fiber with built-in API routes).

## Commands

```bash
# Setup
make setup              # Install all deps (cv + web)
make web-setup          # cd packages/web && npm install

# Dev server
make dev                # next dev on :3000

# Infrastructure (Postgres + Redis via Docker)
make infra-up / make infra-down

# Tests
cd packages/cv && uv run pytest

# Lint
cd packages/web && npm run lint  # ESLint
```

## Architecture

### `packages/web/` — Next.js 16 + React Three Fiber (npm)
- App Router at `src/app/`, path alias `@/` → `src/`
- **API routes** at `src/app/api/statcast/` — fully server-side, no separate backend
- Server-side API logic in `src/lib/api-server/`:
  - `statcast-loader.ts` — Fetches CSV from Baseball Savant, parses to typed objects
  - `player-search.ts` — Player search via MLB Stats API
  - `reconstruct.ts` — 3D trajectory reconstruction from Statcast 9-parameter data
  - `trajectory.ts` — TypeScript types for trajectory points
  - `metrics.ts` — Tunnel metrics computation (interpolation + distance)
- API client: `src/lib/api.ts` — all requests go to same-origin `/api/...`
- 3D scene: `src/components/scene/` (PitchScene, BaseballField)
- State: Zustand store (`usePitchStore`) in `src/lib/store.ts`
- View modes: `default`, `lhb`, `rhb`, `umpire`, `catcher`, `batter_lhb`, `batter_rhb`

### `packages/cv/` — CV Pipeline (Python 3.11+, uv, NOT deployed)
- Module: `src/tunnelvision_cv/`
- YOLO11 detection → ByteTrack tracking → 3D trajectory reconstruction → tunnel metrics
- Requires PyTorch/GPU; exceeds Vercel bundle limits

### Key Domain Constants
- Trajectory coords: `x` (horizontal ft), `y` (distance from plate, 0=plate, 60.5=rubber), `z` (vertical ft), `t` (seconds from release)
- `TUNNEL_POINT_Y = 23.8 ft` from plate, `MOUND_DISTANCE = 60.5 ft`
- Pitch type colors: FF=red, SI=orange, FC=yellow, SL=green, CU=blue, CH=purple

## Deployment (Vercel)

- Unified Next.js deployment — API routes and frontend in one app
- `vercel.json` builds `packages/web`
- CV pipeline is not deployed
- Hobby plan: 10s function timeout — use narrow date ranges for Statcast queries

## Local Infrastructure

- PostgreSQL 16: port 5432, db/user/pass: `tunnelvision`/`tunnelvision`/`tunnelvision_dev`
- Redis 7: port 6379
