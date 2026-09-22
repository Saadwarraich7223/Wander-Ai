"""Weather API Endpoint Router."""

import uuid
from typing import Any
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.weather_service import WeatherService

router = APIRouter(prefix="/weather", tags=["Weather"])


@router.get("/{city_id}", status_code=status.HTTP_200_OK)
async def get_weather_forecast(
    city_id: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Get live/forecast weather context and multipliers for a city."""
    service = WeatherService(db)
    return await service.get_city_weather(city_id)
