"""Cities API endpoints."""

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.place import City
from app.schemas.place import CityResponse

router = APIRouter(prefix="/cities", tags=["Cities"])


@router.get("", response_model=list[CityResponse])
async def list_cities(
    db: AsyncSession = Depends(get_db),
) -> Any:
    """List all cities."""
    query = select(City).options(selectinload(City.region)).order_by(City.name.asc())
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{slug}", response_model=CityResponse)
async def get_city(
    slug: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Get a city by slug."""
    query = (
        select(City)
        .options(selectinload(City.region))
        .filter(City.slug == slug)
    )
    result = await db.execute(query)
    city = result.scalar_one_or_none()
    return city


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

