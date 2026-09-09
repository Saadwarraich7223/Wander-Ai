"""AI Assistant and RAG API Router."""

from typing import Any
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.ai import AIChatRequest, AIChatResponse
from app.services.rag_service import RAGAssistantService

router = APIRouter(prefix="/ai", tags=["AI Assistant & RAG"])


@router.post("/chat", response_model=AIChatResponse, status_code=status.HTTP_200_OK)
async def chat_with_assistant(
    payload: AIChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Conversational AI Assistant with RAG retrieval, data provenance citations,
    and automated tool execution.
    """
    service = RAGAssistantService(db)
    result = await service.answer_query(
        message=payload.message,
        current_user=current_user,
        trip_id=payload.trip_id,
        city_id=payload.city_id,
    )
    return AIChatResponse(
        response=result["response"],
        sources=result["sources"],
        suggested_actions=result["suggested_actions"],
    )
