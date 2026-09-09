"""Constraint-Based Itinerary Optimizer & Geospatial TSP Route Solver."""

import math
from datetime import date, timedelta
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.models.place import Place, PlaceTag
from app.models.trip import Itinerary, ItineraryDay, ItineraryItem, Trip
from app.models.user import User
from app.services.rec_service import RecommendationService


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate Great Circle distance in km between two lat/lon points."""
    r = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return r * c


def estimate_travel_time_minutes(distance_km: float, avg_speed_kmh: float = 25.0) -> int:
    """Estimate urban driving travel time in minutes."""
    if distance_km <= 0.1:
        return 5
    return max(5, int(round((distance_km / avg_speed_kmh) * 60.0)))


def solve_tsp_greedy(places: list[Place]) -> list[Place]:
    """Order places using Greedy Nearest-Neighbor TSP optimization."""
    if len(places) <= 2:
        return places

    unvisited = places.copy()
    route = [unvisited.pop(0)]

    while unvisited:
        current = route[-1]
        nearest_idx = 0
        min_dist = float("inf")

        for idx, p in enumerate(unvisited):
            dist = haversine_distance_km(
                current.latitude, current.longitude, p.latitude, p.longitude
            )
            if dist < min_dist:
                min_dist = dist
                nearest_idx = idx

        route.append(unvisited.pop(nearest_idx))

    return route


def format_time(total_minutes: int) -> str:
    """Format minutes-since-midnight as HH:MM, capped at 23:59."""
    total_minutes = min(total_minutes, 23 * 60 + 59)  # Hard cap at 23:59
    h = total_minutes // 60
    m = total_minutes % 60
    return f"{h:02d}:{m:02d}"


class ItineraryOptimizerService:
    """Service orchestrating candidate selection, TSP route optimization, and time-slot scheduling."""

    # Day boundaries — configurable
    DAY_START_MINUTE = 9 * 60    # 09:00
    DAY_END_MINUTE   = 21 * 60   # 21:00 — hard stop, no more items after this

    def __init__(self, db: AsyncSession):
        self.db = db
        self.rec_service = RecommendationService(db)

    async def build_and_save_itinerary(
        self,
        trip: Trip,
        user: User,
        version: int = 1,
    ) -> Itinerary:
        """
        Generate and persist an optimized itinerary version for a trip.
        """
        # ── 1. Fetch candidate places strictly in the trip's target city ──────
        places_res = await self.db.execute(
            select(Place)
            .options(
                selectinload(Place.category),
                selectinload(Place.images),
                selectinload(Place.tags).selectinload(PlaceTag.tag),
            )
            .filter(Place.city_id == trip.city_id)
            .order_by(Place.popularity_score.desc())   # Prefer highest-ranked first
        )
        candidate_places = list(places_res.scalars().all())

        if not candidate_places:
            # Fallback: all places if city has no entries yet
            all_res = await self.db.execute(
                select(Place)
                .options(
                    selectinload(Place.category),
                    selectinload(Place.images),
                    selectinload(Place.tags).selectinload(PlaceTag.tag),
                )
                .order_by(Place.popularity_score.desc())
            )
            candidate_places = list(all_res.scalars().all())

        # ── 2. Score candidates using Model B — but filter to city-level places only ──
        scored_results = await self.rec_service.get_recommendations(
            user=user, model_name="model_b", limit=200  # Large limit to cover all city places
        )

        # Build a city-scoped scored ranking: only include places from this city
        city_place_ids = {p.id for p in candidate_places}
        city_place_map = {p.id: p for p in candidate_places}

        # Re-rank: scored items first (if in city), then remaining city places by popularity
        scored_in_city = [r.place for r in scored_results if r.place.id in city_place_ids]
        scored_in_city_ids = {p.id for p in scored_in_city}
        remaining_city_places = [p for p in candidate_places if p.id not in scored_in_city_ids]

        # Final ordered candidate list: scored city places first, then unscored city places
        ordered_candidates = scored_in_city + remaining_city_places

        # ── 3. Determine per-day slot limits based on pace ────────────────────
        items_per_day = 3          # moderate (default)
        if trip.pace == "relaxed":
            items_per_day = 2
        elif trip.pace == "packed":
            items_per_day = 4

        # Distribute unique places across days — NO cycling of duplicates
        # If we don't have enough, reduce days' content rather than repeat
        total_available = len(ordered_candidates)
        total_needed = trip.duration_days * items_per_day

        # Slice to what's available without repeating
        selected_candidates = ordered_candidates[:min(total_available, total_needed)]

        # ── 4. Create Itinerary Container ─────────────────────────────────────
        itinerary = Itinerary(
            trip_id=trip.id,
            version=version,
            algorithm="greedy_tsp_v1",
            total_cost=0.0,
            total_travel_time_minutes=0,
            total_travel_distance_km=0.0,
            feasibility_score=1.0,
            preference_satisfaction_score=0.9,
            narrative=f"{trip.duration_days}-day optimized route for {trip.title}. "
                      f"Covering {len(selected_candidates)} curated stops with geospatial TSP routing.",
        )
        self.db.add(itinerary)
        await self.db.flush()

        total_cost = 0.0
        total_travel_time = 0
        total_travel_distance = 0.0

        start_date = trip.start_date or date.today()

        # ── 5. Distribute places across days (even spread, no repetition) ─────
        n_days = trip.duration_days
        day_buckets: list[list] = [[] for _ in range(n_days)]

        for i, place in enumerate(selected_candidates):
            # Round-robin: assign place to next day that still has room
            day_idx = i % n_days
            day_buckets[day_idx].append(place)

        for day_num in range(1, trip.duration_days + 1):
            day_date = start_date + timedelta(days=day_num - 1)
            day_places = day_buckets[day_num - 1]

            # Skip day if no places assigned
            if not day_places:
                continue

            # Apply TSP nearest-neighbor ordering on this day's places
            ordered_day_places = solve_tsp_greedy(day_places)

            itinerary_day = ItineraryDay(
                itinerary_id=itinerary.id,
                day_number=day_num,
                date=day_date,
                weather_context={"condition": "clear", "forecast": "pleasant"},
            )
            self.db.add(itinerary_day)
            await self.db.flush()

            # ── 6. Schedule time slots with day boundary enforcement ──────────
            current_minute = self.DAY_START_MINUTE  # Reset to 09:00 for every day
            prev_place: Place | None = None

            for order_idx, place in enumerate(ordered_day_places):
                travel_time = 0
                dist_km = 0.0

                if prev_place:
                    dist_km = haversine_distance_km(
                        prev_place.latitude, prev_place.longitude,
                        place.latitude, place.longitude,
                    )
                    travel_time = estimate_travel_time_minutes(dist_km)
                    current_minute += travel_time

                # Hard stop — don't schedule past end of day
                if current_minute >= self.DAY_END_MINUTE:
                    break

                start_str = format_time(current_minute)

                visit_duration = min(
                    place.average_visit_duration_minutes or 90,
                    self.DAY_END_MINUTE - current_minute,  # Clip to remaining day time
                )
                current_minute += visit_duration

                end_str = format_time(current_minute)

                place_cost = place.estimated_cost_max or 500.0
                total_cost += place_cost
                total_travel_time += travel_time
                total_travel_distance += dist_km

                item = ItineraryItem(
                    day_id=itinerary_day.id,
                    place_id=place.id,
                    item_order=order_idx,
                    start_time=start_str,
                    end_time=end_str,
                    visit_duration_minutes=visit_duration,
                    travel_time_from_prev_minutes=travel_time if prev_place else None,
                    travel_distance_from_prev_km=round(dist_km, 2) if prev_place else None,
                    estimated_cost=place_cost,
                    notes=f"Scheduled stop at {place.name}",
                )
                self.db.add(item)
                prev_place = place

        # ── 7. Finalize scores ────────────────────────────────────────────────
        feasibility = 1.0
        if total_cost > trip.total_budget and trip.total_budget > 0:
            feasibility = max(0.0, round(1.0 - ((total_cost - trip.total_budget) / trip.total_budget), 2))

        itinerary.total_cost = round(total_cost, 2)
        itinerary.total_travel_time_minutes = total_travel_time
        itinerary.total_travel_distance_km = round(total_travel_distance, 2)
        itinerary.feasibility_score = feasibility

        await self.db.flush()
        await self.db.commit()

        return itinerary
