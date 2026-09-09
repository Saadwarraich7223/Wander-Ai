"""User interaction Pydantic schemas."""

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.models.interaction import VALID_INTERACTION_TYPES
from app.schemas.common import BaseResponse


class InteractionCreateRequest(BaseModel):
    """Payload to log a user interaction with a place."""

    place_id: uuid.UUID
    interaction_type: str = Field(
        ...,
        description=f"Must be one of: {', '.join(VALID_INTERACTION_TYPES)}",
    )
    rating: float | None = Field(None, ge=1.0, le=5.0)
    context: dict[str, Any] | None = Field(
        None,
        description="Optional contextual metadata e.g. trip_id, budget, weather",
    )


class InteractionResponse(BaseResponse):
    """Logged interaction details."""

    id: uuid.UUID
    user_id: uuid.UUID
    place_id: uuid.UUID
    interaction_type: str
    rating: float | None
    context: dict[str, Any] | None
    created_at: datetime
