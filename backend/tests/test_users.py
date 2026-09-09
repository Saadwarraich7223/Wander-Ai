"""Tests for Users API endpoints (/api/v1/users)."""

import uuid
import pytest
from httpx import AsyncClient


async def _get_auth_headers(async_client: AsyncClient, email: str = "testuser@example.com") -> dict[str, str]:
    """Helper to register and login a test user, returning Authorization headers."""
    await async_client.post(
        "/api/v1/auth/register",
        json={
            "name": "Test User",
            "email": email,
            "password": "TestPassword123!",
        },
    )
    login_res = await async_client.post(
        "/api/v1/auth/login",
        json={
            "email": email,
            "password": "TestPassword123!",
        },
    )
    token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_get_current_user_me(async_client: AsyncClient) -> None:
    """Test retrieving authenticated user profile."""
    headers = await _get_auth_headers(async_client, "me@example.com")
    response = await async_client.get("/api/v1/users/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "me@example.com"
    assert "profile" in data
    assert "has_completed_onboarding" in data


@pytest.mark.asyncio
async def test_update_profile(async_client: AsyncClient) -> None:
    """Test updating user profile fields."""
    headers = await _get_auth_headers(async_client, "profile@example.com")
    response = await async_client.put(
        "/api/v1/users/me/profile",
        headers=headers,
        json={
            "preferred_budget": "moderate",
            "travel_style": "adventure",
            "activity_level": "high",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["preferred_budget"] == "moderate"
    assert data["travel_style"] == "adventure"
    assert data["activity_level"] == "high"


@pytest.mark.asyncio
async def test_upsert_preferences(async_client: AsyncClient) -> None:
    """Test bulk updating user category preferences."""
    headers = await _get_auth_headers(async_client, "prefs@example.com")
    cat_id = str(uuid.uuid4())
    response = await async_client.put(
        "/api/v1/users/me/preferences",
        headers=headers,
        json={
            "preferences": [
                {"category_id": cat_id, "preference_score": 0.9},
            ]
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["category_id"] == cat_id
    assert data[0]["preference_score"] == 0.9
