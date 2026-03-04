"""Vercel serverless function entry point for the FastAPI backend."""

import os
import sys
from pathlib import Path

# Vercel serverless has a read-only filesystem except /tmp.
# pybaseball's CacheConfig.__init__ calls mkdir on its cache directory
# immediately on import, so this must be set before any pybaseball import.
os.environ.setdefault("PYBASEBALL_CACHE", "/tmp/pybaseball")

# Add the API package source to Python path so imports resolve
_api_src = str(Path(__file__).resolve().parent.parent / "packages" / "api" / "src")
if _api_src not in sys.path:
    sys.path.insert(0, _api_src)

# Vercel's Python runtime picks up the `app` ASGI object automatically
from main import app  # noqa: E402, F401
