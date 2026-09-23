"""Corridor intelligence and crowdsourced field report schemas."""

import uuid
from datetime import datetime
from pydantic import BaseModel, Field

from app.schemas.common import BaseResponse


class CorridorIntelCreate(BaseModel):
    """Schema for submitting a real-time corridor intelligence report."""

    place_id: uuid.UUID | None = None
    place_slug: str | None = None
    place_name: str = Field(..., min_length=1, max_length=255)
    corridor_name: str = Field(..., min_length=1, max_length=255)
    city_id: uuid.UUID | None = None
    city_name: str | None = None
    trip_id: uuid.UUID | None = None
    reporter_name: str | None = Field(default="Verified Explorer", max_length=150)
    verified_in_trip: bool = True
    road_condition: str = Field(
        default="paved_clear",
        pattern=r"^(paved_clear|patchy_potholes|jeep_4x4_only|landslide_blockage|snow_chains_req)$",
    )
    fuel_status: str = Field(
        default="fuel_ok",
        pattern=r"^(fuel_ok|petrol_only|diesel_only|no_fuel)$",
    )
    atm_status: str = Field(
        default="atm_ok",
        pattern=r"^(atm_ok|atm_empty|cash_only)$",
    )
    note: str | None = Field(default=None, max_length=1000)


class CorridorIntelResponse(BaseResponse):
    """Schema for a single corridor intelligence report."""

    id: uuid.UUID
    place_id: uuid.UUID | None = None
    place_slug: str | None = None
    place_name: str
    corridor_name: str
    city_id: uuid.UUID | None = None
    city_name: str | None = None
    trip_id: uuid.UUID | None = None
    user_id: uuid.UUID | None = None
    reporter_name: str
    verified_in_trip: bool
    road_condition: str
    fuel_status: str
    atm_status: str
    note: str | None = None
    created_at: datetime
    timestamp: str | None = None


class CorridorIntelListResponse(BaseModel):
    """Aggregated list of reports with metadata."""

    reports: list[CorridorIntelResponse]
    total_reports: int
    unique_tourists_count: int
