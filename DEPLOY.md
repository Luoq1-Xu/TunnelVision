# Deploying TunnelVision to Vercel

This guide walks through deploying the Next.js frontend and FastAPI backend to Vercel as a single project.

## Architecture Overview

| Component | Runtime | Vercel Feature |
|---|---|---|
| Frontend (`packages/web`) | Next.js 16 | Vercel Next.js integration |
| API (`packages/api`) | Python 3.11 / FastAPI | Vercel Python Serverless Functions |

The API runs as a serverless Python function at `/api/*`. The frontend is built and served as a standard Next.js app. Both live under the same domain — no cross-origin issues in production.

> **Note:** The CV pipeline (`packages/cv`) is NOT deployed. It requires PyTorch/GPU and exceeds Vercel's bundle limits. The API's Statcast routes (player search, pitch data, trajectory reconstruction) work independently using `pybaseball`, `numpy`, and `scipy`.

---

## How It Works

Understanding the deployment architecture helps when troubleshooting:

```
repo root/
├── package.json          ← Root package.json with "next" dependency (for Vercel framework detection)
├── vercel.json           ← Build/install commands, function config, rewrites
├── api/
│   ├── index.py          ← Python serverless function entrypoint (sets sys.path, env vars)
│   └── requirements.txt  ← Python deps installed by Vercel for the function
├── packages/
│   ├── web/              ← Next.js frontend (built via buildCommand)
│   │   ├── package.json  ← Has "next" + React deps
│   │   └── src/
│   │       └── lib/
│   │           └── api.ts  ← Frontend API client (uses relative paths in production)
│   └── api/
│       └── src/           ← FastAPI app code (bundled via includeFiles)
│           ├── main.py
│           └── tunnelvision_api/
```

**Key wiring:**

1. `vercel.json` sets `framework: "nextjs"` — Vercel expects to find `next` in a `package.json`
2. The **root** `package.json` lists `next` as a dependency purely for Vercel's framework detection
3. `installCommand` runs `npm install` at root (satisfies detection), then `cd packages/web && npm install` (installs frontend deps)
4. `buildCommand` builds the Next.js app from `packages/web`
5. `functions."api/index.py".includeFiles` bundles `packages/api/src/**` into the serverless function so `api/index.py` can import from it via `sys.path`
6. `rewrites` routes all `/api/*` requests to the Python function
7. `api/index.py` sets `PYBASEBALL_CACHE=/tmp/pybaseball` before imports (Vercel's filesystem is read-only except `/tmp`)
8. `packages/web/src/lib/api.ts` uses `""` as the API base in the browser (relative `/api/...` paths), and `http://localhost:8000` for SSR/local dev

---

## Prerequisites

1. A [Vercel account](https://vercel.com/signup) (free Hobby tier works)
2. A [GitHub](https://github.com) account with your repo pushed
3. [Node.js 18+](https://nodejs.org/) installed locally (for testing)
4. [Python 3.11+](https://www.python.org/) installed locally (for testing)

---

## Step 1: Push Your Code to GitHub

If you haven't already:

```bash
git init
git add -A
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USER/TunnelVision.git
git push -u origin main
```

---

## Step 2: Import the Project into Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"** and select your TunnelVision repo
3. Vercel will auto-detect the project. You should see the configuration page.

### Configure Build Settings

Leave these at their defaults — `vercel.json` in the repo root handles the configuration:

| Setting | Value |
|---|---|
| Framework Preset | Next.js |
| Root Directory | `.` (repo root — NOT `packages/web`) |
| Build Command | Handled by `vercel.json` |
| Output Directory | Handled by `vercel.json` |

> **Important:** Do NOT set the root directory to `packages/web`. The `vercel.json` at the repo root tells Vercel how to build both the frontend and the API function. Setting a subdirectory root would hide the `api/` serverless function.

---

## Step 3: Configure Environment Variables

In the Vercel project dashboard, go to **Settings > Environment Variables** and add:

### Required

None — the defaults work out of the box.

### Optional

| Variable | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | *(leave empty or omit)* | When frontend and API share a domain, relative `/api/...` paths work automatically. Only set this if deploying the API separately. |
| `CORS_ORIGINS` | `https://your-custom-domain.com` | Comma-separated list of additional allowed origins. `http://localhost:3000` is always included for local dev. |

---

## Step 4: Deploy

Click **"Deploy"** in the Vercel dashboard. Vercel will:

1. Run `installCommand`: install root deps (for Next.js detection) + `packages/web` deps
2. Run `buildCommand`: build the Next.js app from `packages/web`
3. Bundle the Python serverless function from `api/index.py` with `api/requirements.txt`, including `packages/api/src/**` via `includeFiles`
4. Deploy both under your project URL (e.g., `https://tunnelvision-xxxxx.vercel.app`)

---

## Step 5: Verify the Deployment

Once deployed, test these URLs (replace with your actual Vercel URL):

### Health Check
```
https://your-app.vercel.app/api/health
```
Expected response: `{"status": "ok"}`

### Player Search
```
https://your-app.vercel.app/api/statcast/players/search?q=cole
```
Should return a JSON array of matching MLB players.

### Frontend
```
https://your-app.vercel.app
```
Should load the TunnelVision 3D pitch visualization UI.

---

## Step 6: Custom Domain (Optional)

1. In the Vercel dashboard, go to **Settings > Domains**
2. Add your custom domain (e.g., `tunnelvision.yourdomain.com`)
3. Follow Vercel's DNS instructions (add a CNAME record)
4. If using a custom domain, add it to the `CORS_ORIGINS` environment variable

---

## Redeployments

After the initial setup, Vercel automatically redeploys on every push to `main`. You can also:

- **Manual redeploy:** Vercel dashboard > Deployments > "Redeploy"
- **Preview deployments:** Every PR gets its own preview URL automatically
- **Rollback:** Click any previous deployment and promote it

---

## Local Development

To test locally before deploying:

```bash
# Terminal 1: API
cd packages/api
uv sync
uv run uvicorn src.main:app --reload --port 8000

# Terminal 2: Frontend
cd packages/web
npm install
npm run dev
```

The frontend at `http://localhost:3000` will call the API at `http://localhost:8000` (configured via `NEXT_PUBLIC_API_URL` default in `packages/web/src/lib/api.ts`).

---

## Known Limitations

### Serverless Function Timeout
- **Hobby plan:** 10-second timeout per request
- **Pro plan:** 60-second timeout
- PyBaseball's Statcast data fetches can be slow (5-15 seconds), especially for large date ranges. On the Hobby plan, consider using narrow date ranges and small `limit` values.

### Cold Starts
Python serverless functions have ~1-3 second cold starts. The first request after a period of inactivity will be slower. The Chadwick player registry (used by player search) is downloaded on first call and cached in `/tmp` — but `/tmp` is ephemeral and resets on cold start.

### Read-Only Filesystem
Vercel serverless functions have a read-only filesystem except `/tmp` (512 MB limit). The `api/index.py` entrypoint sets `PYBASEBALL_CACHE=/tmp/pybaseball` to redirect pybaseball's cache writes. If you add other Python libraries that write to disk, ensure they also write to `/tmp`.

### Bundle Size
The Python function with `pybaseball`, `pandas`, `numpy`, and `scipy` uses a significant portion of Vercel's 250MB bundle limit. Avoid adding heavy dependencies to `api/requirements.txt`.

### No CV Pipeline
The computer vision pipeline (`packages/cv`) is not deployed. Pitch data comes exclusively from MLB Statcast via `pybaseball`. Video upload and processing features (the `/api/sessions` routes) return 501 Not Implemented.

### No Database
The session and pitch database routes (`/api/sessions/*`, `/api/pitches/*`) are stubs. To add persistence, consider [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) (powered by Neon) and add the connection string as an environment variable.

---

## Troubleshooting

### "No Next.js version detected" error
Vercel's framework detection checks for `next` in the root `package.json` before running any build commands. The root `package.json` must list `next` as a dependency (matching the version in `packages/web/package.json`). The `installCommand` in `vercel.json` must also run `npm install` at the root level first.

### "Read-only file system" errors in API function
A Python library is trying to write outside `/tmp`. Check which library is writing and configure it to use `/tmp` instead. For pybaseball, set `PYBASEBALL_CACHE=/tmp/pybaseball` (already handled in `api/index.py`).

### "Module not found" errors in the API function
- Ensure `api/requirements.txt` includes all Python dependencies. Vercel installs these automatically during build.
- If importing from `packages/api/src/`, ensure `vercel.json` has `includeFiles: "packages/api/src/**"` in the function config.

### API returns 502 Bad Gateway
Check the Vercel function logs (Dashboard > Deployments > Functions tab). Common causes:
- Import errors (missing dependency or missing `includeFiles`)
- Filesystem write errors (library trying to write outside `/tmp`)
- The response body in the browser often contains the specific error message

### API returns 504 Gateway Timeout
The Statcast fetch exceeded the function timeout. Try:
- Use a narrower date range (`start_dt` closer to `end_dt`)
- Reduce the `limit` parameter
- Upgrade to Vercel Pro for 60-second timeouts

### Frontend can't reach the API
- If both are on the same Vercel deployment, ensure the frontend uses relative paths (`/api/...`) not an absolute URL
- Check that `NEXT_PUBLIC_API_URL` is empty or unset in Vercel environment variables
- Check browser dev tools Network tab for the actual request URL

### CORS errors
Add your frontend domain to the `CORS_ORIGINS` environment variable. This is only needed if the frontend and API are on different domains.
