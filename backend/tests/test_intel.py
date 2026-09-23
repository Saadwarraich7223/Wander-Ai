"""Tests for corridor intelligence and crowdsourced field reporting API."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_corridor_intel_lifecycle(async_client: AsyncClient) -> None:
    # 1. Initially, GET should return 0 reports
    res = await async_client.get("/api/v1/corridor-intel", params={"place_name": "Noor Mahal"})
    assert res.status_code == 200
    data = res.json()
    assert data["total_reports"] == 0
    assert data["unique_tourists_count"] == 0
    assert data["reports"] == []

    # 2. Submit a real-time report for Noor Mahal
    payload = {
        "place_name": "Noor Mahal",
        "place_slug": "noor-mahal",
        "corridor_name": "Bahawalpur & Cholistan Circuit",
        "city_name": "Bahawalpur",
        "reporter_name": "Traveler A",
        "verified_in_trip": True,
        "road_condition": "patchy_potholes",
        "fuel_status": "no_fuel",
        "atm_status": "atm_empty",
        "note": "no fuel , also atm is empty and there are pathholes",
    }
    create_res = await async_client.post("/api/v1/corridor-intel", json=payload)
    assert create_res.status_code == 201
    created = create_res.json()
    assert created["place_name"] == "Noor Mahal"
    assert created["road_condition"] == "patchy_potholes"
    assert created["fuel_status"] == "no_fuel"
    assert created["atm_status"] == "atm_empty"
    assert created["note"] == "no fuel , also atm is empty and there are pathholes"
    assert created["reporter_name"] == "Traveler A"

    # 3. Submit a second report from another traveler
    payload2 = {
        "place_name": "Noor Mahal",
        "place_slug": "noor-mahal",
        "corridor_name": "Bahawalpur & Cholistan Circuit",
        "city_name": "Bahawalpur",
        "reporter_name": "Traveler B",
        "verified_in_trip": True,
        "road_condition": "paved_clear",
        "fuel_status": "fuel_ok",
        "atm_status": "atm_ok",
        "note": "Road cleared today morning",
    }
    create_res2 = await async_client.post("/api/v1/corridor-intel", json=payload2)
    assert create_res2.status_code == 201

    # 4. Query reports by place_name
    query_res = await async_client.get("/api/v1/corridor-intel", params={"place_name": "Noor Mahal"})
    assert query_res.status_code == 200
    query_data = query_res.json()
    assert query_data["total_reports"] == 2
    assert query_data["unique_tourists_count"] == 2
    assert len(query_data["reports"]) == 2
    reporters = [r["reporter_name"] for r in query_data["reports"]]
    assert "Traveler A" in reporters
    assert "Traveler B" in reporters

    # 5. Query reports by place_slug
    slug_res = await async_client.get("/api/v1/corridor-intel", params={"place_slug": "noor-mahal"})
    assert slug_res.status_code == 200
    assert slug_res.json()["total_reports"] == 2
