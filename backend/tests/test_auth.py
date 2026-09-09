"""Tests for Authentication API endpoints (/api/v1/auth)."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_user_success(async_client: AsyncClient) -> None:
    """Test successful user registration."""
    response = await async_client.post(
        "/api/v1/auth/register",
        json={
            "name": "Ali Khan",
            "email": "traveler@example.com",
            "password": "SecurePassword123!",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_register_duplicate_email(async_client: AsyncClient) -> None:
    """Test duplicate email registration rejection."""
    payload = {
        "name": "User One",
        "email": "duplicate@example.com",
        "password": "Password123!",
    }
    res1 = await async_client.post("/api/v1/auth/register", json=payload)
    assert res1.status_code == 201

    res2 = await async_client.post("/api/v1/auth/register", json=payload)
    assert res2.status_code == 409
    assert "already exists" in res2.json()["detail"]


@pytest.mark.asyncio
async def test_login_success(async_client: AsyncClient) -> None:
    """Test login with correct credentials."""
    # Register first
    await async_client.post(
        "/api/v1/auth/register",
        json={
            "name": "Login User",
            "email": "login@example.com",
            "password": "CorrectPassword123!",
        },
    )

    # Login
    response = await async_client.post(
        "/api/v1/auth/login",
        json={
            "email": "login@example.com",
            "password": "CorrectPassword123!",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_invalid_password(async_client: AsyncClient) -> None:
    """Test login failure with wrong password."""
    await async_client.post(
        "/api/v1/auth/register",
        json={
            "name": "User",
            "email": "user@example.com",
            "password": "ValidPassword123!",
        },
    )

    response = await async_client.post(
        "/api/v1/auth/login",
        json={
            "email": "user@example.com",
            "password": "WrongPassword!",
        },
    )
    assert response.status_code == 401
