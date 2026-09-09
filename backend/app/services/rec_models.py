"""Recommendation models: Model A (Baseline), Model B (Content-Based), Model C (Collaborative Filtering), Model D (Hybrid), and Model E (Context-Aware)."""

import math
from datetime import datetime, timezone
from typing import Any

import numpy as np
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.interaction import INTERACTION_TYPES, UserInteraction
from app.models.place import Category, Place, Tag
from app.models.user import User, UserPreference


class RecommendationResult:
    """Wrapper for a recommended place with score breakdown."""

    def __init__(
        self,
        place: Place,
        score: float,
        model_name: str,
        score_explanation: dict[str, Any] | None = None,
    ):
        self.place = place
        self.score = score
        self.model_name = model_name
        self.score_explanation = score_explanation or {}


# ── MODEL A: Popularity Baseline ──────────────────────────────

class ModelABaseline:
    """
    Model A: Popularity + Category Preference Match (Heuristic Baseline).

    Score(u, p) = w_pref * Preference(u, category_p) + w_pop * Popularity(p)
    """

    def __init__(
        self,
        w_pref: float = settings.REC_WEIGHT_INTEREST_MATCH,
        w_pop: float = settings.REC_WEIGHT_POPULARITY,
    ):
        self.w_pref = w_pref
        self.w_pop = w_pop

    async def recommend(
        self,
        user: User,
        all_places: list[Place],
        user_preferences: list[UserPreference],
        limit: int = 10,
    ) -> list[RecommendationResult]:
        pref_map = {p.category_id: p.preference_score for p in user_preferences}

        results: list[RecommendationResult] = []
        for place in all_places:
            category_pref = pref_map.get(place.category_id, 0.5)
            total_score = (self.w_pref * category_pref) + (self.w_pop * place.popularity_score)

            explanation = {
                "category_match_score": round(category_pref, 3),
                "popularity_score": round(place.popularity_score, 3),
            }

            results.append(
                RecommendationResult(
                    place=place,
                    score=round(total_score, 4),
                    model_name="model_a",
                    score_explanation=explanation,
                )
            )

        results.sort(key=lambda r: r.score, reverse=True)
        return results[:limit]


# ── MODEL B: Content-Based Filtering ─────────────────────────

class ModelBContentBased:
    """
    Model B: Content-Based Filtering with Cosine Similarity and Recency Decay.
    """

    def __init__(self, recency_half_life_days: float = 30.0):
        self.decay_lambda = math.log(2) / recency_half_life_days

    def _extract_place_feature_vector(
        self, place: Place, all_tag_slugs: list[str]
    ) -> np.ndarray:
        tag_slug_set = {pt.tag.slug for pt in place.tags if pt.tag}
        tag_vector = [1.0 if t in tag_slug_set else 0.0 for t in all_tag_slugs]

        indoor = 1.0 if place.indoor_outdoor in ("indoor", "both") else 0.0
        outdoor = 1.0 if place.indoor_outdoor in ("outdoor", "both") else 0.0

        activity_low = 1.0 if place.activity_level == "low" else 0.0
        activity_mod = 1.0 if place.activity_level == "moderate" else 0.0
        activity_high = 1.0 if place.activity_level == "high" else 0.0

        cost_val = (place.estimated_cost_max or 0.0) / 10000.0
        cost_norm = min(1.0, max(0.0, cost_val))

        features = tag_vector + [
            indoor,
            outdoor,
            activity_low,
            activity_mod,
            activity_high,
            cost_norm,
            place.popularity_score,
        ]
        return np.array(features, dtype=np.float32)

    async def recommend(
        self,
        user: User,
        all_places: list[Place],
        user_interactions: list[UserInteraction],
        user_preferences: list[UserPreference],
        all_tags: list[Tag],
        limit: int = 10,
    ) -> list[RecommendationResult]:
        all_tag_slugs = [t.slug for t in all_tags]
        if not all_places:
            return []

        place_vectors = {
            p.id: self._extract_place_feature_vector(p, all_tag_slugs)
            for p in all_places
        }

        dim = len(next(iter(place_vectors.values())))
        user_profile_vec = np.zeros(dim, dtype=np.float32)
        now = datetime.now(timezone.utc)

        interaction_count = 0
        for inter in user_interactions:
            p_vec = place_vectors.get(inter.place_id)
            if p_vec is None:
                continue

            base_weight = INTERACTION_TYPES.get(inter.interaction_type, 0.1)
            if inter.interaction_type == "rating" and inter.rating:
                base_weight = (inter.rating - 3.0) / 2.0

            created_at = inter.created_at
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)
            delta_days = (now - created_at).total_seconds() / 86400.0
            decay_weight = math.exp(-self.decay_lambda * max(0.0, delta_days))
            effective_weight = base_weight * decay_weight

            user_profile_vec += effective_weight * p_vec
            interaction_count += 1

        if interaction_count < 3 and user_preferences:
            pref_map = {p.category_id: p.preference_score for p in user_preferences}
            for p in all_places:
                weight = pref_map.get(p.category_id, 0.5)
                user_profile_vec += weight * place_vectors[p.id]

        user_norm = np.linalg.norm(user_profile_vec)
        if user_norm > 0:
            user_profile_vec = user_profile_vec / user_norm

        results: list[RecommendationResult] = []
        for place in all_places:
            p_vec = place_vectors[place.id]
            p_norm = np.linalg.norm(p_vec)

            if user_norm == 0 or p_norm == 0:
                similarity = place.popularity_score
            else:
                similarity = float(np.dot(user_profile_vec, p_vec) / (user_norm * p_norm))

            norm_sim = min(1.0, max(0.0, (similarity + 1.0) / 2.0))

            explanation = {
                "cosine_similarity": round(float(similarity), 3),
                "normalized_feature_score": round(float(norm_sim), 3),
                "interaction_signal_count": interaction_count,
            }

            results.append(
                RecommendationResult(
                    place=place,
                    score=round(norm_sim, 4),
                    model_name="model_b",
                    score_explanation=explanation,
                )
            )

        results.sort(key=lambda r: r.score, reverse=True)
        return results[:limit]


# ── MODEL C: Collaborative Filtering ─────────────────────────

class ModelCCollaborative:
    """
    Model C: Item-Based Collaborative Filtering using User Interaction Matrix.

    Builds Item-Item similarity matrix based on co-occurrence and implicit weights.
    Falls back gracefully to Model B if user interaction history is sparse (< CF_MIN_INTERACTIONS).
    """

    async def recommend(
        self,
        user: User,
        all_places: list[Place],
        all_interactions: list[UserInteraction],
        model_b_fallback: ModelBContentBased,
        user_interactions: list[UserInteraction],
        user_preferences: list[UserPreference],
        all_tags: list[Tag],
        limit: int = 10,
    ) -> list[RecommendationResult]:
        user_inter_set = {i.place_id for i in user_interactions}

        # Check cold-start threshold
        if len(user_inter_set) < settings.CF_MIN_INTERACTIONS:
            # Fallback to Model B content-based recommendation
            fallback_res = await model_b_fallback.recommend(
                user, all_places, user_interactions, user_preferences, all_tags, limit
            )
            for r in fallback_res:
                r.model_name = "model_c"
                r.score_explanation["cf_cold_start_fallback"] = True
            return fallback_res

        # Build User-Item interaction matrix
        place_ids = [p.id for p in all_places]
        place_idx_map = {p_id: idx for idx, p_id in enumerate(place_ids)}
        user_ids = list({i.user_id for i in all_interactions})
        user_idx_map = {u_id: idx for idx, u_id in enumerate(user_ids)}

        R = np.zeros((len(user_ids), len(place_ids)), dtype=np.float32)
        for inter in all_interactions:
            u_idx = user_idx_map.get(inter.user_id)
            p_idx = place_idx_map.get(inter.place_id)
            if u_idx is not None and p_idx is not None:
                w = INTERACTION_TYPES.get(inter.interaction_type, 0.1)
                if inter.interaction_type == "rating" and inter.rating:
                    w = (inter.rating - 3.0) / 2.0
                R[u_idx, p_idx] += w

        # Item-Item Cosine Similarity
        item_norms = np.linalg.norm(R, axis=0, keepdims=True)
        item_norms[item_norms == 0] = 1.0
        R_norm = R / item_norms
        item_sim_matrix = np.dot(R_norm.T, R_norm)

        target_u_idx = user_idx_map.get(user.id)
        if target_u_idx is None:
            user_ratings = np.zeros(len(place_ids))
        else:
            user_ratings = R[target_u_idx]

        predicted_scores = np.dot(item_sim_matrix, user_ratings)

        results: list[RecommendationResult] = []
        for p_idx, place in enumerate(all_places):
            raw_score = float(predicted_scores[p_idx])
            norm_score = min(1.0, max(0.0, 1.0 / (1.0 + math.exp(-raw_score))))

            explanation = {
                "cf_item_similarity_score": round(raw_score, 3),
                "cf_active_users_matrix_count": len(user_ids),
            }

            results.append(
                RecommendationResult(
                    place=place,
                    score=round(norm_score, 4),
                    model_name="model_c",
                    score_explanation=explanation,
                )
            )

        results.sort(key=lambda r: r.score, reverse=True)
        return results[:limit]


# ── MODEL D: Hybrid Recommendation ───────────────────────────

class ModelDHybrid:
    """
    Model D: Weighted Ensemble of Content-Based (Model B) + Collaborative (Model C) + Popularity.

    Score_D(u, p) = w_content * Score_B + w_cf * Score_C + w_pop * Popularity(p)
    Dynamic weighting: Increases CF weight as user interaction history grows.
    """

    async def recommend(
        self,
        user: User,
        all_places: list[Place],
        model_b_res: list[RecommendationResult],
        model_c_res: list[RecommendationResult],
        user_interactions: list[UserInteraction],
        limit: int = 10,
    ) -> list[RecommendationResult]:
        b_map = {r.place.id: r.score for r in model_b_res}
        c_map = {r.place.id: r.score for r in model_c_res}

        # Dynamic weighting based on interaction count
        n_interactions = len(user_interactions)
        w_cf = min(0.40, n_interactions * 0.05)
        w_content = 0.50 - (w_cf / 2.0)
        w_pop = 0.50 - (w_cf / 2.0)

        results: list[RecommendationResult] = []
        for place in all_places:
            score_b = b_map.get(place.id, 0.5)
            score_c = c_map.get(place.id, 0.5)
            score_pop = place.popularity_score

            hybrid_score = (w_content * score_b) + (w_cf * score_c) + (w_pop * score_pop)

            explanation = {
                "content_score_contrib": round(w_content * score_b, 3),
                "cf_score_contrib": round(w_cf * score_c, 3),
                "popularity_score_contrib": round(w_pop * score_pop, 3),
                "dynamic_w_cf": round(w_cf, 2),
            }

            results.append(
                RecommendationResult(
                    place=place,
                    score=round(hybrid_score, 4),
                    model_name="model_d",
                    score_explanation=explanation,
                )
            )

        results.sort(key=lambda r: r.score, reverse=True)
        return results[:limit]


# ── MODEL E: Context-Aware Recommendation Engine ──────────────

class ModelEContextAware:
    """
    Model E: Context-Aware Recommendation Engine.

    Extends Model D hybrid scores with real-time situational multipliers:
    1. Weather Fit (indoor vs outdoor adjustments for rain/sunny/snow)
    2. Seasonality Fit (current month matching best_months)
    3. Budget Fit (user preferred budget vs place estimated max cost)
    """

    async def recommend(
        self,
        user: User,
        all_places: list[Place],
        model_d_res: list[RecommendationResult],
        context: dict[str, Any] | None = None,
        limit: int = 10,
    ) -> list[RecommendationResult]:
        context = context or {}
        weather_condition = context.get("weather", "clear").lower()  # clear | rain | snow | monsoon
        current_month = context.get("month", datetime.now().month)

        d_map = {r.place.id: r.score for r in model_d_res}

        results: list[RecommendationResult] = []
        for place in all_places:
            base_score = d_map.get(place.id, 0.5)

            # 1. Weather Multiplier with Geographical & Alpine Realism
            weather_mult = 1.0

            # Define snowy alpine cities and regions in Pakistan
            SNOW_CITIES = {"skardu", "gilgit", "hunza", "swat", "chitral", "abbottabad", "mansehra", "dir", "astoer", "ghizer", "hunza-nagar"}

            if weather_condition == "snow":
                city_id_lower = (place.city_id or "").lower()
                city_name_lower = (place.city.name if place.city else "").lower()

                # Check if place is in a genuine snow-prone alpine region
                is_alpine_snow_region = (
                    city_id_lower in SNOW_CITIES
                    or any(sc in city_name_lower for sc in ("skardu", "hunza", "gilgit", "swat", "kalam", "malam", "deosai", "chitral", "naran", "kaghan", "murree"))
                    or (place.latitude and place.latitude > 34.0)
                )

                if is_alpine_snow_region:
                    # Snow cap rule: Reward high-altitude alpine snow destinations
                    weather_mult = 1.45
                else:
                    # Deep Snow in plains (Lahore, Karachi, Multan) is impossible -> heavy penalty
                    weather_mult = 0.05

            elif weather_condition in ("rain", "monsoon"):
                if place.indoor_outdoor == "indoor":
                    weather_mult = 1.30
                elif place.indoor_outdoor == "outdoor":
                    weather_mult = 0.65
            elif weather_condition == "clear":
                if place.indoor_outdoor == "outdoor":
                    weather_mult = 1.20

            # 2. Seasonality Multiplier
            seasonality_mult = 1.0
            if place.seasonality and "best_months" in place.seasonality:
                best_months = place.seasonality.get("best_months", [])
                if current_month in best_months:
                    seasonality_mult = 1.20
                else:
                    seasonality_mult = 0.85

            # 3. Budget Fit Multiplier
            budget_mult = 1.0
            user_budget = "moderate"
            try:
                if user.profile and getattr(user.profile, "preferred_budget", None):
                    user_budget = user.profile.preferred_budget
            except Exception:
                user_budget = "moderate"
            place_cost = place.estimated_cost_max or 0.0

            if user_budget == "budget" and place_cost > 3000:
                budget_mult = 0.75
            elif user_budget == "luxury" and place_cost > 2000:
                budget_mult = 1.15

            context_score = base_score * weather_mult * seasonality_mult * budget_mult
            final_score = min(1.0, max(0.0, context_score))

            explanation = {
                "base_hybrid_score": round(base_score, 3),
                "weather_multiplier": round(weather_mult, 2),
                "seasonality_multiplier": round(seasonality_mult, 2),
                "budget_multiplier": round(budget_mult, 2),
                "active_weather_context": weather_condition,
            }

            results.append(
                RecommendationResult(
                    place=place,
                    score=round(final_score, 4),
                    model_name="model_e",
                    score_explanation=explanation,
                )
            )

        results.sort(key=lambda r: r.score, reverse=True)
        return results[:limit]
