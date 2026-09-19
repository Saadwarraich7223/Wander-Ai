"""Vercel Serverless Function entrypoint for FastAPI backend."""

import os
import sys
import traceback

# Ensure root backend directory is on sys.path for Vercel Serverless runtime
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

try:
    from mangum import Mangum
    from app.main import app

    # Mangum is the standard ASGI adapter for AWS Lambda & Vercel
    handler = Mangum(app, lifespan="off")
    app = app

except Exception as e:
    print("CRITICAL STARTUP ERROR IN VERCEL SERVERLESS FUNCTION:", flush=True)
    traceback.print_exc()
    raise
