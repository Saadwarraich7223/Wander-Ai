"""Recommendation response Pydantic schemas."""

from typing import Any
from pydantic import BaseModel, Field

from app.schemas.place import PlaceSummaryResponse


class RecommendedPlaceItem(BaseModel):
    """Single item in recommendation feed."""

    place: PlaceSummaryResponse
    score: float = Field(..., ge=0.0, le=1.0)
    model_name: str
    score_explanation: dict[str, Any]


class RecommendationFeedResponse(BaseModel):
    """Recommendation feed API response."""

    model_used: str
    count: int
    execution_time_ms: float
    items: list[RecommendedPlaceItem]
