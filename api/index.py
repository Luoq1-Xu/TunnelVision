"""Vercel serverless function entry point for the FastAPI backend."""

import sys
from pathlib import Path

# Add the API package source to Python path so imports resolve
_api_src = str(Path(__file__).resolve().parent.parent / "packages" / "api" / "src")
if _api_src not in sys.path:
    sys.path.insert(0, _api_src)

# Vercel's Python runtime picks up the `app` ASGI object automatically
from main import app  # noqa: E402, F401
