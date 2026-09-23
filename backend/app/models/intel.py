"""Corridor intelligence and live crowdsourced telemetry models."""

import uuid

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class CorridorIntelReport(UUIDMixin, TimestampMixin, Base):
    """
    Crowdsourced field intelligence and live telemetry reports submitted by active travelers.
    Universal persistence across all devices (mobile, laptop, desktop) and public accessibility.
    """

    __tablename__ = "corridor_intel_reports"

    # Associated entities
    place_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("places.id", ondelete="SET NULL"), nullable=True, index=True
    )
    place_slug: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    place_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    corridor_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    city_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("cities.id", ondelete="SET NULL"), nullable=True, index=True
    )
    city_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    trip_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("trips.id", ondelete="SET NULL"), nullable=True, index=True
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # Telemetry data
    reporter_name: Mapped[str] = mapped_column(String(150), default="Verified Explorer", nullable=False)
    verified_in_trip: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    road_condition: Mapped[str] = mapped_column(String(50), default="paved_clear", nullable=False)
    fuel_status: Mapped[str] = mapped_column(String(50), default="fuel_ok", nullable=False)
    atm_status: Mapped[str] = mapped_column(String(50), default="atm_ok", nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    reporter_ip: Mapped[str | None] = mapped_column(String(64), nullable=True)

    # Relationships
    place = relationship("Place", lazy="select")
    city = relationship("City", lazy="select")
    user = relationship("User", lazy="select")
    trip = relationship("Trip", lazy="select")

    def __repr__(self) -> str:
        return f"<CorridorIntelReport id={self.id} place={self.place_name} road={self.road_condition}>"
