"""User-related Pydantic schemas."""

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, EmailStr, Field

from app.schemas.common import BaseResponse


# ── User ─────────────────────────────────────────────────────

class UserResponse(BaseResponse):
    """Public user representation."""

    id: uuid.UUID
    email: str
    name: str
    avatar_url: str | None
    is_active: bool
    is_admin: bool
    created_at: datetime


class UserUpdateRequest(BaseModel):
    """Update user name or avatar."""

    name: str | None = Field(None, min_length=2, max_length=150)
    avatar_url: str | None = None


# ── User Profile ─────────────────────────────────────────────

class UserProfileResponse(BaseResponse):
    """User travel profile."""

    user_id: uuid.UUID
    preferred_budget: str | None
    travel_style: str | None
    activity_level: str | None
    transport_preference: str | None
    family_friendly: bool
    food_preferences: dict | None
    preferred_trip_duration: int | None


class UserProfileUpdateRequest(BaseModel):
    """Update travel profile fields."""

    preferred_budget: str | None = Field(None, pattern=r"^(budget|moderate|luxury)$")
    travel_style: str | None = Field(None, pattern=r"^(cultural|adventure|relaxation|mixed)$")
    activity_level: str | None = Field(None, pattern=r"^(low|moderate|high)$")
    transport_preference: str | None = Field(None, pattern=r"^(car|public|walking|mixed)$")
    family_friendly: bool | None = None
    food_preferences: dict[str, Any] | None = None
    preferred_trip_duration: int | None = Field(None, ge=1, le=30)


# ── User Preferences ─────────────────────────────────────────

class CategoryPreferenceItem(BaseModel):
    """Single category preference score."""

    category_id: uuid.UUID
    preference_score: float = Field(..., ge=0.0, le=1.0)


class UserPreferencesUpdateRequest(BaseModel):
    """Bulk update category preference scores."""

    preferences: list[CategoryPreferenceItem]


class UserPreferenceResponse(BaseResponse):
    """Category preference with category name."""

    user_id: uuid.UUID
    category_id: uuid.UUID
    preference_score: float


class MeResponse(BaseResponse):
    """Combined user + profile response."""

    id: uuid.UUID
    email: str
    name: str
    avatar_url: str | None
    is_active: bool
    is_admin: bool
    created_at: datetime
    profile: UserProfileResponse | None
    preference_count: int
    has_completed_onboarding: bool
