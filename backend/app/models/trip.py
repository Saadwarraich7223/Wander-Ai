"""Trip, Itinerary, ItineraryDay, ItineraryItem — the itinerary domain models."""

import uuid
from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    SmallInteger,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class Trip(UUIDMixin, TimestampMixin, Base):
    """
    A user's planned trip to a destination.

    One trip can have multiple itinerary versions (e.g., after budget reoptimization).
    The active itinerary is the latest version.
    """

    __tablename__ = "trips"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    destination_city_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("cities.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    total_days: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    total_budget: Mapped[float] = mapped_column(Float, nullable=False)

    # "planning" | "active" | "completed" | "cancelled"
    status: Mapped[str] = mapped_column(String(20), default="planning", nullable=False)

    # User preferences snapshot at trip creation time
    # Preserves the context so itinerary evaluation remains reproducible
    preferences: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="trips")  # type: ignore[name-defined]
    destination_city: Mapped["City"] = relationship("City")  # type: ignore[name-defined]
    itineraries: Mapped[list["Itinerary"]] = relationship(
        "Itinerary",
        back_populates="trip",
        order_by="Itinerary.version",
        cascade="all, delete-orphan",
    )

    @property
    def active_itinerary(self) -> "Itinerary | None":
        """Return the latest itinerary version."""
        if self.itineraries:
            return max(self.itineraries, key=lambda i: i.version)
        return None

    @property
    def city_id(self) -> uuid.UUID:
        """Alias for destination_city_id for backward compatibility."""
        return self.destination_city_id

    @property
    def duration_days(self) -> int:
        """Alias for total_days for backward compatibility."""
        return self.total_days

    @property
    def pace(self) -> str:
        """Read travel pace preference or fallback to moderate."""
        if self.preferences and isinstance(self.preferences, dict):
            return self.preferences.get("pace", "moderate")
        return "moderate"




class Itinerary(UUIDMixin, Base):
    """
    A versioned itinerary for a trip.

    Versioning supports:
    - Showing diff between original and reoptimized
    - Never destroying previous plans
    - Research: comparing optimizer outputs
    """

    __tablename__ = "itineraries"
    __table_args__ = (
        CheckConstraint("version >= 1", name="ck_version_positive"),
        CheckConstraint(
            "feasibility_score IS NULL OR feasibility_score BETWEEN 0 AND 1",
            name="ck_feasibility_range",
        ),
    )

    trip_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("trips.id", ondelete="CASCADE"), nullable=False, index=True
    )
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    # Optimizer outputs (for research metrics)
    total_cost: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_travel_time_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    total_travel_distance_km: Mapped[float | None] = mapped_column(Float, nullable=True)
    feasibility_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    preference_satisfaction_score: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Which algorithm generated this itinerary (for research comparison)
    algorithm: Mapped[str] = mapped_column(String(50), default="greedy_v1", nullable=False)

    # LLM-generated narrative summary
    narrative: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Change summary (shown in diff UI after reoptimization)
    change_summary: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    trip: Mapped[Trip] = relationship("Trip", back_populates="itineraries")
    days: Mapped[list["ItineraryDay"]] = relationship(
        "ItineraryDay",
        back_populates="itinerary",
        order_by="ItineraryDay.day_number",
        cascade="all, delete-orphan",
    )


class ItineraryDay(UUIDMixin, Base):
    """A single day within an itinerary."""

    __tablename__ = "itinerary_days"

    itinerary_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("itineraries.id", ondelete="CASCADE"), nullable=False, index=True
    )
    day_number: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    date: Mapped[date | None] = mapped_column(Date, nullable=True)
    weather_context: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    itinerary: Mapped[Itinerary] = relationship("Itinerary", back_populates="days")
    items: Mapped[list["ItineraryItem"]] = relationship(
        "ItineraryItem",
        back_populates="day",
        order_by="ItineraryItem.item_order",
        cascade="all, delete-orphan",
    )


class ItineraryItem(UUIDMixin, Base):
    """
    A single place visit within an itinerary day.

    Contains full visit metadata for research metrics:
    - Timing (start/end times, visit duration)
    - Travel from previous (time, distance)
    - Cost
    - Ordering
    """

    __tablename__ = "itinerary_items"
    __table_args__ = (
        CheckConstraint("item_order >= 0", name="ck_item_order_positive"),
        CheckConstraint("estimated_cost >= 0", name="ck_item_cost_positive"),
    )

    day_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("itinerary_days.id", ondelete="CASCADE"), nullable=False, index=True
    )
    place_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("places.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    item_order: Mapped[int] = mapped_column(Integer, nullable=False)

    # Timing
    start_time: Mapped[str | None] = mapped_column(String(5), nullable=True)   # "HH:MM"
    end_time: Mapped[str | None] = mapped_column(String(5), nullable=True)     # "HH:MM"
    visit_duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Travel from previous item
    travel_time_from_prev_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    travel_distance_from_prev_km: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Cost
    estimated_cost: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    # Notes (AI-generated or user-added)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    day: Mapped[ItineraryDay] = relationship("ItineraryDay", back_populates="items")
    place: Mapped["Place"] = relationship("Place")  # type: ignore[name-defined]
