"""Unified Recommendation Service Layer for Models A, B, C, D, E."""

from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.interaction import UserInteraction
from app.models.place import Place, PlaceTag, Tag
from app.models.user import User, UserPreference
from app.services.rec_models import (
    ModelABaseline,
    ModelBContentBased,
    ModelCCollaborative,
    ModelDHybrid,
    ModelEContextAware,
    RecommendationResult,
)


class RecommendationService:
    """Service orchestrating candidate generation and scoring across Model A–E."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.model_a = ModelABaseline()
        self.model_b = ModelBContentBased()
        self.model_c = ModelCCollaborative()
        self.model_d = ModelDHybrid()
        self.model_e = ModelEContextAware()

    async def get_recommendations(
        self,
        user: User,
        model_name: str = "model_b",
        context: dict[str, Any] | None = None,
        limit: int = 10,
    ) -> list[RecommendationResult]:
        """
        Generate Top-K recommendations for a user.

        Args:
            user: Authenticated User object
            model_name: "model_a" | "model_b" | "model_c" | "model_d" | "model_e"
            context: Context dictionary (weather, month, destination)
            limit: Number of items to return
        """
        # Fetch candidate places with relationships pre-loaded
        places_res = await self.db.execute(
            select(Place).options(
                selectinload(Place.category),
                selectinload(Place.images),
                selectinload(Place.tags).selectinload(PlaceTag.tag),
            )
        )
        all_places = list(places_res.scalars().all())

        # Fetch user preferences
        pref_res = await self.db.execute(
            select(UserPreference).filter(UserPreference.user_id == user.id)
        )
        user_preferences = list(pref_res.scalars().all())

        # Model A
        if model_name == "model_a":
            return await self.model_a.recommend(
                user=user,
                all_places=all_places,
                user_preferences=user_preferences,
                limit=limit,
            )

        # User interactions & tags
        inter_res = await self.db.execute(
            select(UserInteraction)
            .filter(UserInteraction.user_id == user.id)
            .order_by(UserInteraction.created_at.desc())
            .limit(100)
        )
        user_interactions = list(inter_res.scalars().all())

        tag_res = await self.db.execute(select(Tag))
        all_tags = list(tag_res.scalars().all())

        # Model B
        b_results = await self.model_b.recommend(
            user=user,
            all_places=all_places,
            user_interactions=user_interactions,
            user_preferences=user_preferences,
            all_tags=all_tags,
            limit=limit,
        )
        if model_name == "model_b":
            return b_results

        # All interactions across all users for Collaborative Filtering
        all_inter_res = await self.db.execute(select(UserInteraction).limit(1000))
        all_interactions = list(all_inter_res.scalars().all())

        # Model C
        c_results = await self.model_c.recommend(
            user=user,
            all_places=all_places,
            all_interactions=all_interactions,
            model_b_fallback=self.model_b,
            user_interactions=user_interactions,
            user_preferences=user_preferences,
            all_tags=all_tags,
            limit=limit,
        )
        if model_name == "model_c":
            return c_results

        # Model D Hybrid
        d_results = await self.model_d.recommend(
            user=user,
            all_places=all_places,
            model_b_res=b_results,
            model_c_res=c_results,
            user_interactions=user_interactions,
            limit=limit,
        )
        if model_name == "model_d":
            return d_results

        # Model E Context-Aware
        return await self.model_e.recommend(
            user=user,
            all_places=all_places,
            model_d_res=d_results,
            context=context,
            limit=limit,
        )
