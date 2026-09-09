"""AI Assistant and RAG API Schemas."""

import uuid
from typing import Any, List, Optional
from pydantic import BaseModel, Field


class AIChatRequest(BaseModel):
    message: str = Field(..., description="User prompt or question")
    trip_id: Optional[str] = Field(None, description="Optional active trip ID")
    city_id: Optional[str] = Field(None, description="Optional destination city ID")


class RAGSourceSchema(BaseModel):
    title: str
    source: str
    source_url: Optional[str] = None
    confidence: float
    last_verified: Optional[str] = None


class SuggestedActionSchema(BaseModel):
    label: str
    action: str
    payload: Optional[Any] = None


class AIChatResponse(BaseModel):
    response: str
    sources: List[RAGSourceSchema] = []
    suggested_actions: List[SuggestedActionSchema] = []
