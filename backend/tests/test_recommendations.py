"""Tests for Recommendation API (/api/v1/recommendations) and Models A–E."""

import pytest
from httpx import AsyncClient


async def _get_auth_headers(async_client: AsyncClient, email: str = "recuser@example.com") -> dict[str, str]:
    """Helper to register and login a test user."""
    await async_client.post(
        "/api/v1/auth/register",
        json={
            "name": "Rec User",
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
async def test_get_recommendations_model_a(async_client: AsyncClient) -> None:
    headers = await _get_auth_headers(async_client, "modela@example.com")
    response = await async_client.get("/api/v1/recommendations?model=model_a", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["model_used"] == "model_a"


@pytest.mark.asyncio
async def test_get_recommendations_model_b(async_client: AsyncClient) -> None:
    headers = await _get_auth_headers(async_client, "modelb@example.com")
    response = await async_client.get("/api/v1/recommendations?model=model_b", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["model_used"] == "model_b"


@pytest.mark.asyncio
async def test_get_recommendations_model_c(async_client: AsyncClient) -> None:
    headers = await _get_auth_headers(async_client, "modelc@example.com")
    response = await async_client.get("/api/v1/recommendations?model=model_c", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["model_used"] == "model_c"


@pytest.mark.asyncio
async def test_get_recommendations_model_d(async_client: AsyncClient) -> None:
    headers = await _get_auth_headers(async_client, "modeld@example.com")
    response = await async_client.get("/api/v1/recommendations?model=model_d", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["model_used"] == "model_d"


@pytest.mark.asyncio
async def test_get_recommendations_model_e(async_client: AsyncClient) -> None:
    headers = await _get_auth_headers(async_client, "modele@example.com")
    response = await async_client.get("/api/v1/recommendations?model=model_e&weather=rain", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["model_used"] == "model_e"


@pytest.mark.asyncio
async def test_get_recommendations_guest(async_client: AsyncClient) -> None:
    response = await async_client.get("/api/v1/recommendations?model=model_a")
    assert response.status_code == 200
    data = response.json()
    assert data["model_used"] == "model_a"

