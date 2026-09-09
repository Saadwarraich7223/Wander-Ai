"""Tourism-domain SQLAlchemy models: Region, City, Category, Tag, Place, etc."""

import uuid

from geoalchemy2 import Geography
from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.config import settings
from app.models.base import Base, TimestampMixin, UUIDMixin


class Region(UUIDMixin, Base):
    """Top-level geographic region (Province)."""

    __tablename__ = "regions"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    cities: Mapped[list["City"]] = relationship("City", back_populates="region")


class City(UUIDMixin, Base):
    """City within a region."""

    __tablename__ = "cities"

    region_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("regions.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    slug: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    # PostGIS geography for spatial queries
    geom: Mapped[object | None] = mapped_column(
        Geography(geometry_type="POINT", srid=4326, spatial_index=False), nullable=True
    )
    image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    region: Mapped[Region] = relationship("Region", back_populates="cities")
    places: Mapped[list["Place"]] = relationship("Place", back_populates="city")


class Category(UUIDMixin, Base):
    """Place category (Historical, Nature, Food, etc.)."""

    __tablename__ = "categories"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    icon: Mapped[str | None] = mapped_column(String(50), nullable=True)  # e.g. lucide icon name
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)


class Tag(UUIDMixin, Base):
    """Fine-grained tag for places (e.g. 'Mughal', 'Trekking', 'Street Food')."""

    __tablename__ = "tags"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)


class Place(UUIDMixin, TimestampMixin, Base):
    """
    Core tourism place entity.

    Design principles:
    - Latitude/longitude for application logic
    - PostGIS GEOGRAPHY(POINT) for spatial queries (nearby, radius, routing)
    - pgvector embedding for RAG semantic search
    - All float scores are 0.0–1.0 normalized
    - Data provenance fields are mandatory for RAG reliability
    """

    __tablename__ = "places"
    __table_args__ = (
        CheckConstraint("estimated_cost_min >= 0", name="ck_cost_min_positive"),
        CheckConstraint(
            "estimated_cost_max IS NULL OR estimated_cost_max >= estimated_cost_min",
            name="ck_cost_max_gte_min",
        ),
        CheckConstraint("popularity_score BETWEEN 0 AND 1", name="ck_popularity_score_range"),
        CheckConstraint(
            "historical_significance IS NULL OR historical_significance BETWEEN 0 AND 1",
            name="ck_historical_significance_range",
        ),
        CheckConstraint(
            "food_relevance IS NULL OR food_relevance BETWEEN 0 AND 1",
            name="ck_food_relevance_range",
        ),
        CheckConstraint(
            "data_confidence IS NULL OR data_confidence BETWEEN 0 AND 1",
            name="ck_data_confidence_range",
        ),
    )

    # ── Core identity ────────────────────────────────────────
    city_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("cities.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    name_ur: Mapped[str | None] = mapped_column(String(255), nullable=True)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    wikidata_id: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── Location & Terrain ───────────────────────────────────
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    elevation_meters: Mapped[int | None] = mapped_column(Integer, nullable=True)
    vehicle_access: Mapped[str | None] = mapped_column(String(50), default="sedan", nullable=True)
    is_unesco_heritage: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # PostGIS: used for ST_DWithin, ST_Distance, spatial indices
    geom: Mapped[object | None] = mapped_column(
        Geography(geometry_type="POINT", srid=4326, spatial_index=False), nullable=True, index=True
    )

    # ── Cost (PKR) ───────────────────────────────────────────
    estimated_cost_min: Mapped[float | None] = mapped_column(Float, nullable=True)
    estimated_cost_max: Mapped[float | None] = mapped_column(Float, nullable=True)

    # ── Visit planning ───────────────────────────────────────
    average_visit_duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # Opening hours JSONB: {"mon": "09:00-17:00", "fri": "closed", ...}
    opening_hours: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # ── Attributes (used in recommendation feature vectors) ──
    popularity_score: Mapped[float] = mapped_column(Float, default=0.5, nullable=False)

    # "indoor" | "outdoor" | "both"
    indoor_outdoor: Mapped[str] = mapped_column(String(10), default="outdoor", nullable=False)
    family_suitable: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    # "low" | "moderate" | "high"
    activity_level: Mapped[str] = mapped_column(String(10), default="moderate", nullable=False)

    # 0.0–1.0 relevance scores for specific interest categories
    historical_significance: Mapped[float | None] = mapped_column(Float, nullable=True)
    food_relevance: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Seasonality JSONB: {"best_months": [10, 11, 3, 4], "note": "avoid July-August rains"}
    seasonality: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    extra_info: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # ── Data provenance (mandatory for RAG reliability) ──────
    source: Mapped[str | None] = mapped_column(String(255), nullable=True)
    source_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    last_verified: Mapped[str | None] = mapped_column(String(20), nullable=True)  # ISO date string
    data_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)

    # ── RAG embedding ────────────────────────────────────────
    # Dimension from settings to support both Gemini (768) and OpenAI (1536)
    embedding: Mapped[object | None] = mapped_column(
        Vector(settings.EMBEDDING_DIMENSION), nullable=True
    )

    # ── Relationships ────────────────────────────────────────
    city: Mapped[City] = relationship("City", back_populates="places")
    category: Mapped[Category] = relationship("Category")
    tags: Mapped[list["PlaceTag"]] = relationship(
        "PlaceTag", back_populates="place", cascade="all, delete-orphan"
    )
    images: Mapped[list["PlaceImage"]] = relationship(
        "PlaceImage", back_populates="place", cascade="all, delete-orphan"
    )
    interactions: Mapped[list["UserInteraction"]] = relationship(  # type: ignore[name-defined]
        "UserInteraction", back_populates="place"
    )

    def __repr__(self) -> str:
        return f"<Place id={self.id} name={self.name}>"


class PlaceTag(Base):
    """Many-to-many: places ↔ tags."""

    __tablename__ = "place_tags"
    __table_args__ = (
        UniqueConstraint("place_id", "tag_id", name="uq_place_tag"),
    )

    place_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("places.id", ondelete="CASCADE"), primary_key=True
    )
    tag_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True
    )

    place: Mapped[Place] = relationship("Place", back_populates="tags")
    tag: Mapped[Tag] = relationship("Tag")


class PlaceImage(UUIDMixin, Base):
    """Images associated with a place."""

    __tablename__ = "place_images"

    place_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("places.id", ondelete="CASCADE"), nullable=False, index=True
    )
    url: Mapped[str] = mapped_column(Text, nullable=False)
    caption: Mapped[str | None] = mapped_column(String(500), nullable=True)
    license: Mapped[str | None] = mapped_column(String(100), default="CC BY-SA 4.0", nullable=True)
    attribution: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    place: Mapped[Place] = relationship("Place", back_populates="images")
