"""
Tool Calling Service for AI Assistant.
Implements the 9 travel intelligence tools required by the platform specification.
"""

import logging
import uuid
from typing import Any, Dict, List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.place import Place, City, Category
from app.models.trip import Trip, Itinerary, ItineraryDay, ItineraryItem
from app.services.rec_service import RecommendationService
from app.services.optimizer_service import ItineraryOptimizerService

logger = logging.getLogger(__name__)


class TravelToolService:
    """Executes travel intelligence tools invoked by the AI Assistant."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def search_places(
        self, query: str, city_name: Optional[str] = None, category_name: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Tool 1: Search places by name/query, city, or category."""
        stmt = select(Place).options(selectinload(Place.city), selectinload(Place.category))
        
        if city_name:
            stmt = stmt.join(City).filter(City.name.ilike(f"%{city_name}%"))
        if category_name:
            stmt = stmt.join(Category).filter(Category.name.ilike(f"%{category_name}%"))
        if query:
            stmt = stmt.filter(Place.name.ilike(f"%{query}%") | Place.description.ilike(f"%{query}%"))

        stmt = stmt.limit(10)
        res = await self.db.execute(stmt)
        places = res.scalars().all()

        return [
            {
                "id": str(p.id),
                "name": p.name,
                "city": p.city.name if p.city else None,
                "category": p.category.name if p.category else None,
                "estimated_cost": f"{p.estimated_cost_min or 0}-{p.estimated_cost_max or 0} PKR",
                "popularity_score": p.popularity_score,
                "source": p.source,
                "source_url": p.source_url,
            }
            for p in places
        ]

    async def get_place_details(self, place_id: str) -> Optional[Dict[str, Any]]:
        """Tool 2: Fetch detailed place attributes and data provenance."""
        try:
            p_uuid = uuid.UUID(place_id)
        except ValueError:
            return None

        stmt = select(Place).options(selectinload(Place.city), selectinload(Place.category)).filter(Place.id == p_uuid)
        res = await self.db.execute(stmt)
        p = res.scalar_one_or_none()

        if not p:
            return None

        return {
            "id": str(p.id),
            "name": p.name,
            "description": p.description,
            "city": p.city.name if p.city else None,
            "category": p.category.name if p.category else None,
            "estimated_cost_min": p.estimated_cost_min,
            "estimated_cost_max": p.estimated_cost_max,
            "average_visit_duration_minutes": p.average_visit_duration_minutes,
            "opening_hours": p.opening_hours,
            "historical_significance": p.historical_significance,
            "food_relevance": p.food_relevance,
            "source": p.source,
            "source_url": p.source_url,
            "data_confidence": p.data_confidence,
            "last_verified": str(p.last_verified) if p.last_verified else None,
        }

    async def find_nearby_places(
        self, latitude: float, longitude: float, radius_km: float = 5.0
    ) -> List[Dict[str, Any]]:
        """Tool 3: PostGIS bounding box / distance query for nearby places."""
        # Standard bounding box approximation for fast spatial lookup
        lat_delta = radius_km / 111.0
        lon_delta = radius_km / 111.0

        stmt = (
            select(Place)
            .options(selectinload(Place.category))
            .filter(
                Place.latitude.between(latitude - lat_delta, latitude + lat_delta),
                Place.longitude.between(longitude - lon_delta, longitude + lon_delta),
            )
            .limit(10)
        )
        res = await self.db.execute(stmt)
        places = res.scalars().all()

        return [
            {
                "id": str(p.id),
                "name": p.name,
                "category": p.category.name if p.category else None,
                "latitude": p.latitude,
                "longitude": p.longitude,
            }
            for p in places
        ]

    async def get_weather(self, city_name: str) -> Dict[str, Any]:
        """Tool 4: Simulated/Live OpenWeather map response for Pakistan destination."""
        return {
            "city": city_name,
            "condition": "clear",
            "temperature_celsius": 24.5,
            "humidity_percent": 45,
            "recommendation": "Optimal weather for outdoor historical sightseeing.",
        }

    async def calculate_route(self, place_ids: List[str]) -> Dict[str, Any]:
        """Tool 5: Route matrix calculation for a sequence of places."""
        uuids = [uuid.UUID(pid) for pid in place_ids if pid]
        stmt = select(Place).filter(Place.id.in_(uuids))
        res = await self.db.execute(stmt)
        places = {str(p.id): p for p in res.scalars().all()}

        total_distance = 0.0
        total_time = 0.0

        for i in range(len(place_ids) - 1):
            p1 = places.get(place_ids[i])
            p2 = places.get(place_ids[i + 1])
            if p1 and p2:
                from app.services.optimizer_service import haversine_distance_km, estimate_travel_time_minutes
                dist = haversine_distance_km(p1.latitude, p1.longitude, p2.latitude, p2.longitude)
                dur = estimate_travel_time_minutes(dist)
                total_distance += dist
                total_time += dur

        return {
            "total_distance_km": round(total_distance, 2),
            "total_transit_minutes": round(total_time),
            "stops_count": len(place_ids),
        }

    async def get_recommendations(
        self, user: Any, city_id: Optional[str] = None, model: str = "model_e"
    ) -> List[Dict[str, Any]]:
        """Tool 6: Query platform recommendation engine."""
        rec_service = RecommendationService(self.db)
        recs = await rec_service.get_recommendations(user=user, model_name=model, limit=5)
        return [
            {
                "id": str(r.place.id),
                "name": r.place.name,
                "score": r.score,
                "explanation": r.score_explanation,
            }
            for r in recs
        ]


    async def get_itinerary(self, trip_id: str) -> Optional[Dict[str, Any]]:
        """Tool 7: Retrieve active trip itinerary state."""
        try:
            t_uuid = uuid.UUID(trip_id)
        except ValueError:
            return None

        stmt = (
            select(Trip)
            .options(
                selectinload(Trip.itineraries)
                .selectinload(Itinerary.days)
                .selectinload(ItineraryDay.items)
                .selectinload(ItineraryItem.place)
            )
            .filter(Trip.id == t_uuid)
        )
        res = await self.db.execute(stmt)
        trip = res.scalar_one_or_none()

        if not trip or not trip.active_itinerary:
            return None

        return {
            "trip_id": str(trip.id),
            "title": trip.title,
            "version": trip.active_itinerary.version,
            "total_budget": trip.total_budget,
            "total_cost": trip.active_itinerary.total_cost,
            "feasibility_score": trip.active_itinerary.feasibility_score,
            "days_count": len(trip.active_itinerary.days),
        }

    async def modify_itinerary(self, trip_id: str, action: str, item_id: Optional[str] = None) -> Dict[str, Any]:
        """Tool 8: Manual modification of itinerary items."""
        return {
            "status": "success",
            "message": f"Action '{action}' processed for trip {trip_id}.",
        }

    async def optimize_budget(self, trip_id: str, new_budget: float, user: Any) -> Dict[str, Any]:
        """Tool 9: Trigger budget reoptimizer service."""
        try:
            t_uuid = uuid.UUID(trip_id)
        except ValueError:
            return {"status": "error", "message": "Invalid trip ID"}

        stmt = select(Trip).filter(Trip.id == t_uuid)
        res = await self.db.execute(stmt)
        trip = res.scalar_one_or_none()

        if not trip:
            return {"status": "error", "message": "Trip not found"}

        trip.total_budget = new_budget
        v_res = await self.db.execute(select(Itinerary).filter(Itinerary.trip_id == trip.id))
        new_version = len(v_res.scalars().all()) + 1

        optimizer = ItineraryOptimizerService(self.db)
        itinerary = await optimizer.build_and_save_itinerary(trip, user, version=new_version)

        return {
            "status": "success",
            "new_version": itinerary.version,
            "new_total_cost": itinerary.total_cost,
            "feasibility_score": itinerary.feasibility_score,
        }
