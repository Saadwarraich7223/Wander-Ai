"""Recommendations API endpoint supporting Models A, B, C, D, E."""

import time
from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.places import _format_place_summary
from app.core.database import get_db
from app.core.dependencies import get_optional_current_user
from app.models.user import User
from app.schemas.recommendation import RecommendationFeedResponse, RecommendedPlaceItem
from app.services.rec_service import RecommendationService

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.get("", response_model=RecommendationFeedResponse)
@router.get("/", response_model=RecommendationFeedResponse, include_in_schema=False)
async def get_recommendations(
    model: str = Query(
        "model_b",
        pattern=r"^(model_a|model_b|model_c|model_d|model_e)$",
        description="Recommendation algorithm (model_a..model_e)",
    ),
    weather: str | None = Query(
        None,
        description="Optional weather context e.g. clear, rain, snow, monsoon",
    ),
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
) -> Any:

    """
    Get personalized recommendations for the authenticated user.

    - **model_a**: Popularity + Category Preference Baseline
    - **model_b**: Content-Based Filtering with Recency Decay
    - **model_c**: Item-Based Collaborative Filtering
    - **model_d**: Hybrid Scoring (Model B + Model C + Popularity)
    - **model_e**: Context-Aware Engine (Hybrid + Weather/Seasonality/Budget Multipliers)
    """
    start_time = time.perf_counter()

    context = {}
    if weather:
        context["weather"] = weather

    rec_service = RecommendationService(db)
    results = await rec_service.get_recommendations(
        user=current_user,
        model_name=model,
        context=context,
        limit=limit,
    )

    elapsed_ms = (time.perf_counter() - start_time) * 1000.0

    items = [
        RecommendedPlaceItem(
            place=_format_place_summary(r.place),
            score=r.score,
            model_name=r.model_name,
            score_explanation=r.score_explanation,
        )
        for r in results
    ]

    return RecommendationFeedResponse(
        model_used=model,
        count=len(items),
        execution_time_ms=round(elapsed_ms, 2),
        items=items,
    )
