"""Vercel Serverless Function entrypoint for FastAPI backend."""

from app.main import app

# Vercel looks for the ASGI `app` object in this file
