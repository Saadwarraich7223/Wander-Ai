"""Tests for Weather API endpoints."""

import uuid
import pytest
from httpx import AsyncClient


from conftest import TestingSessionLocal
from app.models.place import City, Region


@pytest.mark.asyncio
async def test_get_weather_forecast(async_client: AsyncClient):
    """Test retrieving weather forecast for a destination city."""
    async with TestingSessionLocal() as db:
        region = Region(name=f"WeatherRegion-{uuid.uuid4().hex[:6]}", slug=f"weather-reg-{uuid.uuid4().hex[:6]}")
        db.add(region)
        await db.flush()

        city = City(
            region_id=region.id,
            name="Lahore Weather Test",
            slug=f"lahore-w-{uuid.uuid4().hex[:6]}",
            latitude=31.5204,
            longitude=74.3587,
        )
        db.add(city)
        await db.commit()
        city_id = str(city.id)

    res = await async_client.get(f"/api/v1/cities/{city_id}/weather")
    assert res.status_code == 200
    data = res.json()
    assert "condition" in data
    assert "temperature_celsius" in data
    assert "outdoor_multiplier" in data

