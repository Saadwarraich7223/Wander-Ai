"""Categories API endpoints."""

from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.place import Category
from app.schemas.place import CategoryResponse

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("", response_model=list[CategoryResponse])
@router.get("/", response_model=list[CategoryResponse], include_in_schema=False)
async def list_categories(
    db: AsyncSession = Depends(get_db),
) -> Any:
    """List all categories sorted by sort order."""
    query = select(Category).order_by(Category.sort_order.asc(), Category.name.asc())
    result = await db.execute(query)
    return result.scalars().all()
