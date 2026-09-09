"""Common Pydantic schemas shared across the API."""

import uuid
from datetime import datetime

from pydantic import BaseModel


class BaseResponse(BaseModel):
    """Base for all API responses."""

    model_config = {"from_attributes": True}


class PaginationParams(BaseModel):
    """Standard pagination parameters."""

    page: int = 1
    limit: int = 20

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.limit


class PaginatedResponse[T](BaseModel):
    """Generic paginated response envelope."""

    items: list[T]
    total: int
    page: int
    limit: int
    pages: int

    @classmethod
    def create(cls, items: list[T], total: int, page: int, limit: int) -> "PaginatedResponse[T]":
        return cls(
            items=items,
            total=total,
            page=page,
            limit=limit,
            pages=(total + limit - 1) // limit if total > 0 else 0,
        )


class MessageResponse(BaseModel):
    """Simple message response."""

    message: str


class HealthResponse(BaseModel):
    """Health check response."""

    status: str
    version: str
    environment: str
