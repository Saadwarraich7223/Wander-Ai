"""Place-related Pydantic schemas."""

import uuid
from typing import Any

from pydantic import BaseModel, Field

from app.schemas.common import BaseResponse


class RegionResponse(BaseResponse):
    id: uuid.UUID
    name: str
    slug: str
    description: str | None


class CityResponse(BaseResponse):
    id: uuid.UUID
    name: str
    slug: str
    description: str | None
    latitude: float
    longitude: float
    image_url: str | None
    is_featured: bool
    region: RegionResponse


class CategoryResponse(BaseResponse):
    id: uuid.UUID
    name: str
    slug: str
    icon: str | None
    description: str | None


class TagResponse(BaseResponse):
    id: uuid.UUID
    name: str
    slug: str


class PlaceImageResponse(BaseResponse):
    id: uuid.UUID
    url: str
    caption: str | None
    license: str | None = "CC BY-SA 4.0"
    attribution: str | None = None
    is_primary: bool


class PlaceSummaryResponse(BaseResponse):
    """Lightweight place card used in lists and recommendations."""

    id: uuid.UUID
    name: str
    name_ur: str | None = None
    slug: str
    wikidata_id: str | None = None
    city_id: uuid.UUID
    category: CategoryResponse
    estimated_cost_min: float | None
    estimated_cost_max: float | None
    average_visit_duration_minutes: int | None
    popularity_score: float
    indoor_outdoor: str
    family_suitable: bool
    activity_level: str
    latitude: float
    longitude: float
    elevation_meters: int | None = None
    vehicle_access: str | None = "sedan"
    is_unesco_heritage: bool = False
    primary_image: PlaceImageResponse | None


class PlaceDetailResponse(PlaceSummaryResponse):
    """Full place detail including tags, provenance, hours."""

    description: str | None
    address: str | None
    opening_hours: dict | None
    seasonality: dict | None
    extra_info: dict | None = None
    historical_significance: float | None
    food_relevance: float | None
    tags: list[TagResponse]
    images: list[PlaceImageResponse]
    # Data provenance (shown in RAG citations)
    source: str | None
    source_url: str | None
    last_verified: str | None
    data_confidence: float | None


class PlaceSearchParams(BaseModel):
    """Query parameters for place search/filtering."""

    q: str | None = None
    city_id: uuid.UUID | None = None
    region_id: uuid.UUID | None = None
    category_id: uuid.UUID | None = None
    tags: list[str] | None = None
    indoor_outdoor: str | None = Field(None, pattern=r"^(indoor|outdoor|both)$")
    family_suitable: bool | None = None
    activity_level: str | None = Field(None, pattern=r"^(low|moderate|high)$")
    cost_min: float | None = Field(None, ge=0)
    cost_max: float | None = Field(None, ge=0)
    page: int = Field(1, ge=1)
    limit: int = Field(20, ge=1, le=500)


class NearbyPlacesParams(BaseModel):
    """Parameters for nearby place search using PostGIS."""

    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    radius_km: float = Field(5.0, ge=0.1, le=100)
    category_id: uuid.UUID | None = None
    limit: int = Field(10, ge=1, le=50)


# ── Admin Create/Update ──────────────────────────────────────

class PlaceCreateRequest(BaseModel):
    """Admin: create a new place."""

    city_id: uuid.UUID
    category_id: uuid.UUID
    name: str = Field(..., min_length=2, max_length=255)
    description: str | None = None
    latitude: float = Field(..., ge=20.0, le=38.0)   # Pakistan lat range
    longitude: float = Field(..., ge=60.0, le=78.0)  # Pakistan lon range
    address: str | None = None
    estimated_cost_min: float | None = Field(None, ge=0)
    estimated_cost_max: float | None = Field(None, ge=0)
    average_visit_duration_minutes: int | None = Field(None, ge=10, le=480)
    indoor_outdoor: str = Field("outdoor", pattern=r"^(indoor|outdoor|both)$")
    family_suitable: bool = True
    activity_level: str = Field("moderate", pattern=r"^(low|moderate|high)$")
    historical_significance: float | None = Field(None, ge=0, le=1)
    food_relevance: float | None = Field(None, ge=0, le=1)
    opening_hours: dict[str, Any] | None = None
    seasonality: dict[str, Any] | None = None
    source: str | None = None
    source_url: str | None = None
    last_verified: str | None = None
    data_confidence: float | None = Field(None, ge=0, le=1)
    tag_ids: list[uuid.UUID] = []


class PlaceUpdateRequest(BaseModel):
    """Schema for updating an existing place entity and its primary image."""

    name: str | None = None
    description: str | None = None
    image_url: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    estimated_cost_min: float | None = None
    estimated_cost_max: float | None = None
    popularity_score: float | None = None
    indoor_outdoor: str | None = None
    family_suitable: bool | None = None
    activity_level: str | None = None

