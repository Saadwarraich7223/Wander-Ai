"""Cities API endpoints."""

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.cache import cities_cache
from app.core.database import get_db
from app.models.place import City
from app.schemas.place import CityResponse
from sqlalchemy.orm import joinedload

router = APIRouter(prefix="/cities", tags=["Cities"])


@router.get("", response_model=list[CityResponse])
@router.get("/", response_model=list[CityResponse], include_in_schema=False)
async def list_cities(
    db: AsyncSession = Depends(get_db),
) -> Any:
    """List all cities."""
    async def _fetch():
        query = select(City).options(joinedload(City.region)).order_by(City.name.asc())
        result = await db.execute(query)
        cities = result.scalars().all()
        # Pre-serialize to dict/models to be cache safe
        return [CityResponse.model_validate(c) for c in cities]

    return await cities_cache.get_or_set("all_cities", _fetch, ttl_seconds=1800)


@router.get("/{slug}", response_model=CityResponse)
async def get_city(
    slug: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Get a city by slug."""
    async def _fetch():
        query = (
            select(City)
            .options(joinedload(City.region))
            .filter(City.slug == slug)
        )
        result = await db.execute(query)
        city = result.scalar_one_or_none()
        if not city:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="City not found")
        return CityResponse.model_validate(city)

    return await cities_cache.get_or_set(f"city:{slug}", _fetch, ttl_seconds=1800)


@router.get("/{city_id}/weather", summary="Get city weather forecast")
async def get_city_weather_by_id(
    city_id: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Get weather context for a destination city."""
    from app.services.weather_service import WeatherService
    service = WeatherService(db)
    try:
        c_uuid = uuid.UUID(city_id)
        return await service.get_city_weather(c_uuid)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid city_id format")

