"""Trip and Itinerary Pydantic schemas."""

import uuid
from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, Field

from app.schemas.common import BaseResponse
from app.schemas.place import PlaceSummaryResponse


class TripCreateRequest(BaseModel):
    """Payload to create and optimize a new trip."""

    city_id: uuid.UUID
    title: str = Field(..., min_length=3, max_length=200)
    duration_days: int = Field(..., ge=1, le=14)
    total_budget: float = Field(..., ge=1000.0)
    pace: str = Field("moderate", pattern=r"^(relaxed|moderate|balanced|packed)$")
    start_date: date | None = None
    group_size: int = Field(1, ge=1, le=20)
    context: dict[str, Any] | None = None


class ItineraryItemResponse(BaseResponse):
    """Single item / stop in a daily itinerary."""

    id: uuid.UUID
    day_id: uuid.UUID
    place: PlaceSummaryResponse
    item_order: int
    start_time: str  # "09:00"
    end_time: str    # "10:30"
    visit_duration_minutes: int
    travel_time_from_prev_minutes: int | None
    travel_distance_from_prev_km: float | None
    estimated_cost: float
    notes: str | None


class ItineraryDayResponse(BaseResponse):
    """Single day in an itinerary containing scheduled items."""

    id: uuid.UUID
    itinerary_id: uuid.UUID
    day_number: int
    date: date | None
    weather_context: dict[str, Any] | None
    items: list[ItineraryItemResponse]


class ItineraryResponse(BaseResponse):
    """Full itinerary version response."""

    id: uuid.UUID
    trip_id: uuid.UUID
    version: int
    total_cost: float | None
    total_travel_time_minutes: int | None
    total_travel_distance_km: float | None
    feasibility_score: float | None
    preference_satisfaction_score: float | None
    algorithm: str
    narrative: str | None
    generated_at: datetime
    days: list[ItineraryDayResponse]


class TripResponse(BaseResponse):
    """Trip container response including active itinerary."""

    id: uuid.UUID
    user_id: uuid.UUID
    city_id: uuid.UUID
    title: str
    duration_days: int
    total_budget: float
    pace: str
    status: str = "planning"
    start_date: date | None
    preferences: dict[str, Any] | None = None
    active_itinerary: ItineraryResponse | None
    created_at: datetime


class ReoptimizeRequest(BaseModel):
    """Payload to trigger itinerary reoptimization."""

    new_total_budget: float | None = Field(None, ge=1000.0)
    new_duration_days: int | None = Field(None, ge=1, le=14)
    new_pace: str | None = Field(None, pattern=r"^(relaxed|moderate|balanced|packed)$")
    new_preferences: dict[str, Any] | None = None


class AddStopRequest(BaseModel):
    """Payload to append a place as a stop on a trip's active itinerary."""

    place_id: uuid.UUID
    preferred_day_number: int | None = Field(None, ge=1, le=14)


class TripStatusUpdateRequest(BaseModel):
    """Payload to update trip status lifecycle."""

    status: str = Field(..., pattern=r"^(planning|active|completed|cancelled)$")


class TripCheckInRequest(BaseModel):
    """Payload to toggle visited status of an itinerary stop."""

    item_id: uuid.UUID
    is_visited: bool = True


class TripExpenseLogRequest(BaseModel):
    """Payload to record an in-trip actual expense."""

    category: str = Field("General", min_length=1, max_length=50)
    amount: float = Field(..., ge=0.0)
    notes: str = Field("", max_length=255)
    day_number: int | None = None

