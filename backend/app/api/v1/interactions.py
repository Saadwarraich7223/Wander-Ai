"""Interactions API endpoints — record implicit and explicit feedback signals."""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.interaction import INTERACTION_TYPES, UserInteraction
from app.models.place import Place
from app.models.user import User
from app.schemas.interaction import InteractionCreateRequest, InteractionResponse

router = APIRouter(prefix="/interactions", tags=["Interactions"])


@router.post("", response_model=InteractionResponse, status_code=status.HTTP_201_CREATED)
async def log_interaction(
    payload: InteractionCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Record a user interaction with a place.
    Used to update collaborative filtering matrix and user preference profiles.
    """
    if payload.interaction_type not in INTERACTION_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid interaction_type '{payload.interaction_type}'. Valid options: {list(INTERACTION_TYPES.keys())}",
        )

    if payload.interaction_type == "rating" and payload.rating is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rating value (1.0 - 5.0) is required when interaction_type is 'rating'",
        )

    # Verify place exists
    place_check = await db.execute(select(Place.id).filter(Place.id == payload.place_id))
    if not place_check.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Place not found",
        )

    interaction = UserInteraction(
        user_id=current_user.id,
        place_id=payload.place_id,
        interaction_type=payload.interaction_type,
        rating=payload.rating,
        context=payload.context,
    )
    db.add(interaction)

    # Optional: Update place popularity score slightly if rating or visit
    if payload.interaction_type in ("rating", "visit", "save"):
        place_res = await db.execute(select(Place).filter(Place.id == payload.place_id))
        place = place_res.scalar_one()
        # Small incremental update, clamped to [0.0, 1.0]
        increment = 0.01 if payload.interaction_type != "rating" else ((payload.rating or 3.0) - 3.0) * 0.02
        place.popularity_score = min(1.0, max(0.0, place.popularity_score + increment))

    await db.commit()
    await db.refresh(interaction)
    return interaction


@router.get("/me", response_model=list[InteractionResponse])
async def get_my_interactions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Fetch interaction history for the current authenticated user."""
    query = (
        select(UserInteraction)
        .filter(UserInteraction.user_id == current_user.id)
        .order_by(UserInteraction.created_at.desc())
        .limit(100)
    )
    result = await db.execute(query)
    return result.scalars().all()
