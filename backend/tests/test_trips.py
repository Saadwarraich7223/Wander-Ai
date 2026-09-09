"""Tests for Trip and Itinerary Optimizer API endpoints (/api/v1/trips)."""

import uuid
import pytest
from httpx import AsyncClient
from conftest import TestingSessionLocal
from app.models.place import City, Region


async def _get_auth_headers_and_city(async_client: AsyncClient) -> tuple[dict[str, str], str]:
    """Helper to register, login, and return headers + city_id."""
    await async_client.post(
        "/api/v1/auth/register",
        json={
            "name": "Trip Planner",
            "email": f"planner_{uuid.uuid4().hex[:6]}@example.com",
            "password": "TestPassword123!",
        },
    )
    login_res = await async_client.post(
        "/api/v1/auth/login",
        json={
            "email": f"planner_{uuid.uuid4().hex[:6]}@example.com",
            "password": "TestPassword123!",
        },
    )

    # Register & login new clean user
    user_email = f"user_{uuid.uuid4().hex[:6]}@example.com"
    await async_client.post(
        "/api/v1/auth/register",
        json={
            "name": "Planner User",
            "email": user_email,
            "password": "TestPassword123!",
        },
    )
    login_res = await async_client.post(
        "/api/v1/auth/login",
        json={
            "email": user_email,
            "password": "TestPassword123!",
        },
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Ensure a city exists in test DB session
    async with TestingSessionLocal() as db:
        region = Region(name=f"Region-{uuid.uuid4().hex[:6]}", slug=f"region-{uuid.uuid4().hex[:6]}")
        db.add(region)
        await db.flush()

        city = City(
            region_id=region.id,
            name="Lahore",
            slug=f"lahore-{uuid.uuid4().hex[:6]}",
            latitude=31.5204,
            longitude=74.3587,
        )
        db.add(city)
        await db.commit()
        city_id = str(city.id)

    return headers, city_id


@pytest.mark.asyncio
async def test_create_and_optimize_trip(async_client: AsyncClient) -> None:
    """Test creating a new trip and generating initial itinerary v1."""
    headers, city_id = await _get_auth_headers_and_city(async_client)

    response = await async_client.post(
        "/api/v1/trips",
        headers=headers,
        json={
            "city_id": city_id,
            "title": "3 Days in Lahore Heritage & Food",
            "duration_days": 3,
            "total_budget": 35000,
            "pace": "balanced",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "3 Days in Lahore Heritage & Food"
    assert data["duration_days"] == 3
    assert data["active_itinerary"] is not None
    assert data["active_itinerary"]["version"] == 1
    assert "days" in data["active_itinerary"]


@pytest.mark.asyncio
async def test_reoptimize_trip_versioning(async_client: AsyncClient) -> None:
    """Test reoptimizing a trip to generate itinerary v2."""
    headers, city_id = await _get_auth_headers_and_city(async_client)

    # 1. Create trip v1
    create_res = await async_client.post(
        "/api/v1/trips",
        headers=headers,
        json={
            "city_id": city_id,
            "title": "Weekend Gateway",
            "duration_days": 2,
            "total_budget": 20000,
            "pace": "relaxed",
        },
    )
    assert create_res.status_code == 201
    trip_id = create_res.json()["id"]

    # 2. Reoptimize with updated budget and pace
    reopt_res = await async_client.post(
        f"/api/v1/trips/{trip_id}/reoptimize",
        headers=headers,
        json={
            "new_total_budget": 40000,
            "new_pace": "packed",
        },
    )
    assert reopt_res.status_code == 200
    data = reopt_res.json()
    assert data["active_itinerary"]["version"] == 2
    assert data["total_budget"] == 40000
    assert data["pace"] == "packed"
