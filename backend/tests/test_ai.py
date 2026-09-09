"""Tests for AI Assistant and RAG API endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_ai_chat_unauthenticated(async_client: AsyncClient):
    """Test that unauthenticated requests to AI assistant are rejected."""
    res = await async_client.post("/api/v1/ai/chat", json={"message": "Recommend places in Lahore"})
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_ai_chat_recommendation_intent(async_client: AsyncClient):
    """Test AI chat response for place recommendations with citations."""
    # Register & Login
    auth_res = await async_client.post(
        "/api/v1/auth/register",
        json={"email": "ai_user@example.com", "password": "TestPassword123!", "name": "AI Tester"},
    )
    token = auth_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Ask AI Assistant
    res = await async_client.post(
        "/api/v1/ai/chat",
        headers=headers,
        json={"message": "Can you recommend top historical places in Lahore?"},
    )
    assert res.status_code == 200
    data = res.json()
    assert "response" in data
    assert isinstance(data["sources"], list)
    assert isinstance(data["suggested_actions"], list)


@pytest.mark.asyncio
async def test_ai_chat_budget_intent(async_client: AsyncClient):
    """Test AI chat response for budget optimization intent."""
    auth_res = await async_client.post(
        "/api/v1/auth/register",
        json={"email": "ai_budget@example.com", "password": "TestPassword123!", "name": "Budget Tester"},
    )
    token = auth_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = await async_client.post(
        "/api/v1/ai/chat",
        headers=headers,
        json={"message": "Can you optimize my travel budget?"},
    )
    assert res.status_code == 200
    data = res.json()
    assert len(data["response"]) > 0
