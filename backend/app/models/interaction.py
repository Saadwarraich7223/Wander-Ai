"""User interaction model — drives collaborative filtering and personalization."""

import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, Float, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


# Interaction type constants — exported for use in services
INTERACTION_TYPES = {
    "view": 0.1,           # low signal
    "click": 0.2,          # low-medium signal
    "save": 0.6,           # medium-high signal
    "skip": -0.3,          # negative signal
    "rating": 0.9,         # high signal (value from rating field)
    "share": 0.5,          # medium signal
    "itinerary_add": 0.8,  # high signal
    "visit": 1.0,          # very high signal
}

VALID_INTERACTION_TYPES = tuple(INTERACTION_TYPES.keys())


class UserInteraction(Base):
    """
    Records every user interaction with a place.

    Used for:
    - Collaborative filtering (user-item matrix)
    - Implicit feedback signal for recommendation
    - Tracking user engagement for UX analytics

    NOTE: Do not treat every interaction equally.
    Use INTERACTION_TYPES weights when building the interaction matrix.
    """

    __tablename__ = "user_interactions"
    __table_args__ = (
        CheckConstraint(
            f"interaction_type IN {VALID_INTERACTION_TYPES}",
            name="ck_valid_interaction_type",
        ),
        CheckConstraint(
            "rating IS NULL OR (rating >= 1.0 AND rating <= 5.0)",
            name="ck_rating_range",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    place_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("places.id", ondelete="CASCADE"), nullable=False, index=True
    )
    interaction_type: Mapped[str] = mapped_column(String(30), nullable=False, index=True)

    # Only non-null for type='rating'; range 1.0–5.0
    rating: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Contextual snapshot at time of interaction for research reproducibility
    # e.g., {"destination": "Lahore", "budget": 30000, "trip_id": "...", "weather": "sunny"}
    context: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="interactions")  # type: ignore[name-defined]
    place: Mapped["Place"] = relationship("Place", back_populates="interactions")  # type: ignore[name-defined]

    def __repr__(self) -> str:
        return f"<UserInteraction user={self.user_id} place={self.place_id} type={self.interaction_type}>"
