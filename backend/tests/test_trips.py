"""Tests for Trip and Itinerary Optimizer API endpoints (/api/v1/trips)."""

import uuid
import pytest
from httpx import AsyncClient
from conftest import TestingSessionLocal
from app.models.place import City, Region


async def _get_auth_headers_and_city(async_client: AsyncClient) -> tuple[dict[str, str], str]:
    """Helper to register, login, and return headers + city_id."""
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


@pytest.mark.asyncio
async def test_add_and_remove_stop(async_client: AsyncClient) -> None:
    """Test adding a stop and removing a stop from an active trip itinerary."""
    headers, city_id = await _get_auth_headers_and_city(async_client)

    # 1. Create a trip
    create_res = await async_client.post(
        "/api/v1/trips",
        headers=headers,
        json={
            "city_id": city_id,
            "title": "Stop Management Expedition",
            "duration_days": 2,
            "total_budget": 30000,
            "pace": "moderate",
        },
    )
    assert create_res.status_code == 201
    trip_id = create_res.json()["id"]

    # 2. Get a place to add
    from app.models.place import Place, Category
    async with TestingSessionLocal() as db:
        cat = Category(name=f"Heritage-{uuid.uuid4().hex[:6]}", slug=f"heritage-{uuid.uuid4().hex[:6]}")
        db.add(cat)
        await db.flush()
        place = Place(
            city_id=uuid.UUID(city_id),
            category_id=cat.id,
            name=f"Royal Monument {uuid.uuid4().hex[:4]}",
            slug=f"royal-monument-{uuid.uuid4().hex[:4]}",
            latitude=31.55,
            longitude=74.35,
            estimated_cost_max=1500,
            popularity_score=0.9,
        )
        db.add(place)
        await db.commit()
        place_id = str(place.id)

    # 3. Add stop to Day 1
    add_res = await async_client.post(
        f"/api/v1/trips/{trip_id}/stops",
        headers=headers,
        json={
            "place_id": place_id,
            "preferred_day_number": 1,
        },
    )
    assert add_res.status_code == 200
    trip_data = add_res.json()
    day1 = next(d for d in trip_data["active_itinerary"]["days"] if d["day_number"] == 1)
    added_item = next(it for it in day1["items"] if it["place"]["id"] == place_id)
    assert added_item is not None
    item_id = added_item["id"]

    # 4. Remove stop from Day 1
    remove_res = await async_client.delete(
        f"/api/v1/trips/{trip_id}/stops/{item_id}",
        headers=headers,
    )
    assert remove_res.status_code == 200
    rem_trip_data = remove_res.json()
    day1_rem = next(d for d in rem_trip_data["active_itinerary"]["days"] if d["day_number"] == 1)
    assert not any(it["id"] == item_id for it in day1_rem["items"])


@pytest.mark.asyncio
async def test_trip_status_checkin_and_expenses(async_client: AsyncClient) -> None:
    """Test updating trip status, toggling stop check-in, and logging expenses."""
    headers, city_id = await _get_auth_headers_and_city(async_client)

    # 1. Create a trip
    create_res = await async_client.post(
        "/api/v1/trips",
        headers=headers,
        json={
            "city_id": city_id,
            "title": "Live Expedition Test",
            "duration_days": 2,
            "total_budget": 50000,
            "pace": "moderate",
        },
    )
    assert create_res.status_code == 201
    trip_data = create_res.json()
    trip_id = trip_data["id"]
    assert trip_data["status"] == "planning"

    # 2. Update status to active (Start Expedition)
    status_res = await async_client.patch(
        f"/api/v1/trips/{trip_id}/status",
        headers=headers,
        json={"status": "active"},
    )
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "active"

    # 3. Add a place to Day 1
    from app.models.place import Place, Category
    async with TestingSessionLocal() as db:
        cat = Category(name=f"Checkin-{uuid.uuid4().hex[:6]}", slug=f"checkin-{uuid.uuid4().hex[:6]}")
        db.add(cat)
        await db.flush()
        place = Place(
            city_id=uuid.UUID(city_id),
            category_id=cat.id,
            name=f"Scenic Spot {uuid.uuid4().hex[:4]}",
            slug=f"scenic-spot-{uuid.uuid4().hex[:4]}",
            latitude=31.55,
            longitude=74.35,
            estimated_cost_max=1200,
            popularity_score=0.9,
        )
        db.add(place)
        await db.commit()
        place_id = str(place.id)

    add_res = await async_client.post(
        f"/api/v1/trips/{trip_id}/stops",
        headers=headers,
        json={"place_id": place_id, "preferred_day_number": 1},
    )
    assert add_res.status_code == 200
    item_id = add_res.json()["active_itinerary"]["days"][0]["items"][0]["id"]

    # 4. Check-in stop
    checkin_res = await async_client.post(
        f"/api/v1/trips/{trip_id}/checkin",
        headers=headers,
        json={"item_id": item_id, "is_visited": True},
    )
    assert checkin_res.status_code == 200
    prefs = checkin_res.json()["preferences"]
    assert item_id in prefs.get("visited_stops", [])

    # 5. Log in-trip expense
    exp_res = await async_client.post(
        f"/api/v1/trips/{trip_id}/expenses",
        headers=headers,
        json={
            "category": "Fuel",
            "amount": 3500.0,
            "notes": "Highway fuel fill-up",
            "day_number": 1,
        },
    )
    assert exp_res.status_code == 200
    exp_prefs = exp_res.json()["preferences"]
    assert len(exp_prefs.get("expenses", [])) == 1
    expense_id = exp_prefs["expenses"][0]["id"]
    assert exp_prefs["expenses"][0]["amount"] == 3500.0

    # 6. Delete expense
    del_exp_res = await async_client.delete(
        f"/api/v1/trips/{trip_id}/expenses/{expense_id}",
        headers=headers,
    )
    assert del_exp_res.status_code == 200
    assert len(del_exp_res.json()["preferences"].get("expenses", [])) == 0


