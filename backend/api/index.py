"""Vercel Serverless Function entrypoint for FastAPI backend."""

import os
import sys

# Ensure root backend directory is on sys.path for Vercel Serverless runtime
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from app.main import app

# Vercel ASGI Handler
app = app
