"""User-related SQLAlchemy models: User, UserProfile, UserPreference, RefreshToken."""

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class User(UUIDMixin, TimestampMixin, Base):
    """Core user account."""

    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    profile: Mapped["UserProfile | None"] = relationship(
        "UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    preferences: Mapped[list["UserPreference"]] = relationship(
        "UserPreference", back_populates="user", cascade="all, delete-orphan"
    )
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(
        "RefreshToken", back_populates="user", cascade="all, delete-orphan"
    )
    interactions: Mapped[list["UserInteraction"]] = relationship(  # type: ignore[name-defined]
        "UserInteraction", back_populates="user", cascade="all, delete-orphan"
    )
    trips: Mapped[list["Trip"]] = relationship(  # type: ignore[name-defined]
        "Trip", back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email}>"


class UserProfile(UUIDMixin, TimestampMixin, Base):
    """Extended traveler profile and preferences."""

    __tablename__ = "user_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True
    )

    # Budget preference: "budget" | "moderate" | "luxury"
    preferred_budget: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # Travel style: "cultural" | "adventure" | "relaxation" | "mixed"
    travel_style: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Activity level: "low" | "moderate" | "high"
    activity_level: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # Transport preference: "car" | "public" | "walking" | "mixed"
    transport_preference: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # Boolean flags
    family_friendly: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # JSONB for flexible food preferences (e.g., {"halal": true, "vegetarian": false})
    food_preferences: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Preferred trip duration in days
    preferred_trip_duration: Mapped[int | None] = mapped_column(nullable=True)

    # Relationship
    user: Mapped[User] = relationship("User", back_populates="profile")

    def __repr__(self) -> str:
        return f"<UserProfile user_id={self.user_id}>"


class UserPreference(Base):
    """Category-level preference score per user (drives content-based rec)."""

    __tablename__ = "user_preferences"
    __table_args__ = (
        UniqueConstraint("user_id", "category_id", name="uq_user_category_preference"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categories.id", ondelete="CASCADE"), primary_key=True
    )
    # Continuous score 0.0–1.0 (not just on/off)
    preference_score: Mapped[float] = mapped_column(Float, default=0.5, nullable=False)

    # Relationships
    user: Mapped[User] = relationship("User", back_populates="preferences")
    category: Mapped["Category"] = relationship("Category")  # type: ignore[name-defined]


class RefreshToken(UUIDMixin, Base):
    """Stored refresh tokens for revocation support."""

    __tablename__ = "refresh_tokens"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    token_hash: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped[User] = relationship("User", back_populates="refresh_tokens")
