"""Categories API endpoints."""

from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import categories_cache
from app.core.database import get_db
from app.models.place import Category
from app.schemas.place import CategoryResponse

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("", response_model=list[CategoryResponse])
@router.get("/", response_model=list[CategoryResponse], include_in_schema=False)
async def list_categories(
    db: AsyncSession = Depends(get_db),
) -> Any:
    """List all categories sorted by sort order (cached)."""
    async def fetch():
        query = select(Category).order_by(Category.sort_order.asc(), Category.name.asc())
        result = await db.execute(query)
        categories = result.scalars().all()
        return [
            CategoryResponse(
                id=c.id,
                name=c.name,
                slug=c.slug,
                icon=c.icon,
                description=c.description,
            )
            for c in categories
        ]

    return await categories_cache.get_or_set("categories:all", fetch, ttl_seconds=1800)
