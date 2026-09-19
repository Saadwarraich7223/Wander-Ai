"""Vercel Serverless Function entrypoint for FastAPI backend."""

import os
import sys
import traceback
import urllib.parse

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

    asgi_app = Mangum(app, lifespan="off")

    def vercel_handler(event, context):
        """Translate Vercel serverless request event into real FastAPI route path."""
        headers = event.get("headers") or {}

        # 1. Check Vercel regex rewrite capture group in x-now-route-matches
        route_matches = headers.get("x-now-route-matches") or headers.get("X-Now-Route-Matches")
        if route_matches:
            try:
                parsed = urllib.parse.parse_qs(route_matches)
                if "1" in parsed and parsed["1"]:
                    real_path = "/" + parsed["1"][0].lstrip("/")
                    event["path"] = real_path
                    event["rawPath"] = real_path
            except Exception:
                pass

        # 2. Check x-invoke-path / x-forwarded-uri headers
        elif headers.get("x-invoke-path") or headers.get("X-Invoke-Path"):
            p = headers.get("x-invoke-path") or headers.get("X-Invoke-Path")
            event["path"] = p
            event["rawPath"] = p
        elif headers.get("x-forwarded-uri") or headers.get("X-Forwarded-Uri"):
            p = (headers.get("x-forwarded-uri") or headers.get("X-Forwarded-Uri")).split("?")[0]
            event["path"] = p
            event["rawPath"] = p

        # 3. If path is still empty or literal /api/index, fallback to root /
        if event.get("path") in (None, "", "/api/index", "/api/index.py", "/api/index/"):
            event["path"] = "/"
            event["rawPath"] = "/"

        return asgi_app(event, context)

    handler = vercel_handler
    app = app

except Exception as e:
    print("CRITICAL STARTUP ERROR IN VERCEL SERVERLESS FUNCTION:", flush=True)
    traceback.print_exc()
    raise
