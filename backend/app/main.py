"""FastAPI application entrypoint."""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.database import engine
from app.models.base import Base


import asyncio
import logging

async def _warmup_caches() -> None:
    """Preload hot read endpoints into in-memory cache to ensure sub-millisecond response times."""
    try:
        from app.core.database import AsyncSessionLocal
        from app.api.v1.places import list_places
        from app.api.v1.cities import list_cities
        from app.api.v1.categories import list_categories
        from app.schemas.place import PlaceSearchParams

        async with AsyncSessionLocal() as db:
            # Warm up categories and cities
            await list_categories(db=db)
            await list_cities(db=db)
            # Warm up default places queries (all 300 places, page 1)
            await list_places(params=PlaceSearchParams(limit=300, page=1), db=db)
            await list_places(params=PlaceSearchParams(limit=50, page=1), db=db)
            await list_places(params=PlaceSearchParams(limit=10, page=1), db=db)
        logging.info("🚀 [Cache Warmup] Hot endpoints preloaded successfully into MemoryCache.")
    except Exception as e:
        logging.warning(f"⚠️ [Cache Warmup] Cache warmup background task encountered notice: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Lifespan context manager for startup and shutdown events."""
    # Startup actions: guarantee DB tables are created
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as e:
        logging.warning(f"Database initialization warning on startup: {e}")

    # Launch cache pre-warming in background task
    asyncio.create_task(_warmup_caches())

    yield
    # Shutdown actions (e.g. close client pools)


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-Powered Personalized Tourism & Travel Intelligence Platform API",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# CORS middleware configuration
origins = settings.cors_origins_list
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins and "*" not in origins else [],
    allow_origin_regex=r".*" if "*" in origins or not origins else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Root"])
@app.get("/api", tags=["Root"])
@app.get("/api/index", tags=["Root"], include_in_schema=False)
@app.get("/api/index.py", tags=["Root"], include_in_schema=False)
async def root_endpoint() -> dict[str, str]:
    """Root status endpoint."""
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "online",
        "docs_url": "/docs",
        "health_url": "/health",
        "api_v1_url": "/api/v1",
    }


@app.get("/health", tags=["Health"])
@app.get("/api/v1/health", tags=["Health"])
async def health_check() -> dict[str, str]:
    """Health check endpoint for Docker and monitoring load balancers."""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Fallback handler for unhandled exceptions."""
    import logging
    logging.exception(f"Unhandled server exception on {request.method} {request.url.path}: {exc}")
    origin = request.headers.get("origin", "*")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "InternalServerError",
            "message": str(exc) if settings.DEBUG else "An unexpected error occurred. Please try again later.",
        },
        headers={
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Methods": "*",
        },
    )


# Include API v1 routes under /api
app.include_router(api_router, prefix="/api")
