"""Places API endpoints — list, search, nearby, detail, and admin CRUD."""

import math
import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import get_current_admin
from app.models.place import Category, City, Place, PlaceImage, PlaceTag, Tag
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.place import (
    CategoryResponse,
    NearbyPlacesParams,
    PlaceCreateRequest,
    PlaceUpdateRequest,
    PlaceDetailResponse,
    PlaceImageResponse,
    PlaceSearchParams,
    PlaceSummaryResponse,
    TagResponse,
)

router = APIRouter(prefix="/places", tags=["Places"])


def _format_primary_image(images: list[PlaceImage]) -> PlaceImageResponse | None:
    if not images:
        return None
    primary = next((img for img in images if img.is_primary), images[0])
    return PlaceImageResponse(
        id=primary.id,
        url=primary.url,
        caption=primary.caption,
        is_primary=primary.is_primary,
    )


def _format_place_summary(place: Place) -> PlaceSummaryResponse:
    category_res = CategoryResponse(
        id=place.category.id,
        name=place.category.name,
        slug=place.category.slug,
        icon=place.category.icon,
        description=place.category.description,
    )
    return PlaceSummaryResponse(
        id=place.id,
        name=place.name,
        slug=place.slug,
        city_id=place.city_id,
        category=category_res,
        estimated_cost_min=place.estimated_cost_min,
        estimated_cost_max=place.estimated_cost_max,
        average_visit_duration_minutes=place.average_visit_duration_minutes,
        popularity_score=place.popularity_score,
        indoor_outdoor=place.indoor_outdoor,
        family_suitable=place.family_suitable,
        activity_level=place.activity_level,
        latitude=place.latitude,
        longitude=place.longitude,
        primary_image=_format_primary_image(place.images),
    )


def _format_place_detail(place: Place) -> PlaceDetailResponse:
    summary = _format_place_summary(place)
    tag_responses = [
        TagResponse(id=pt.tag.id, name=pt.tag.name, slug=pt.tag.slug)
        for pt in place.tags
        if pt.tag
    ]
    image_responses = [
        PlaceImageResponse(
            id=img.id,
            url=img.url,
            caption=img.caption,
            is_primary=img.is_primary,
        )
        for img in place.images
    ]
    return PlaceDetailResponse(
        **summary.model_dump(),
        description=place.description,
        address=place.address,
        opening_hours=place.opening_hours,
        seasonality=place.seasonality,
        historical_significance=place.historical_significance,
        food_relevance=place.food_relevance,
        tags=tag_responses,
        images=image_responses,
        source=place.source,
        source_url=place.source_url,
        last_verified=place.last_verified,
        data_confidence=place.data_confidence,
    )


@router.get("", response_model=PaginatedResponse[PlaceSummaryResponse])
@router.get("/", response_model=PaginatedResponse[PlaceSummaryResponse], include_in_schema=False)
async def list_places(
    params: PlaceSearchParams = Depends(),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """List places with filtering and pagination."""
    query = (
        select(Place)
        .options(
            selectinload(Place.category),
            selectinload(Place.images),
        )
    )

    if params.q:
        pattern = f"%{params.q}%"
        query = query.filter(
            or_(
                Place.name.ilike(pattern),
                Place.description.ilike(pattern),
                Place.address.ilike(pattern),
            )
        )
    if params.city_id:
        query = query.filter(Place.city_id == params.city_id)
    if params.category_id:
        query = query.filter(Place.category_id == params.category_id)
    if params.indoor_outdoor:
        query = query.filter(Place.indoor_outdoor == params.indoor_outdoor)
    if params.family_suitable is not None:
        query = query.filter(Place.family_suitable == params.family_suitable)
    if params.activity_level:
        query = query.filter(Place.activity_level == params.activity_level)
    if params.cost_min is not None:
        query = query.filter(Place.estimated_cost_min >= params.cost_min)
    if params.cost_max is not None:
        query = query.filter(Place.estimated_cost_max <= params.cost_max)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_res = await db.execute(count_query)
    total = total_res.scalar_one()

    # Paginate and order by popularity
    offset = (params.page - 1) * params.limit
    query = query.order_by(Place.popularity_score.desc()).offset(offset).limit(params.limit)
    result = await db.execute(query)
    places = result.scalars().all()

    items = [_format_place_summary(p) for p in places]
    return PaginatedResponse(
        items=items,
        total=total,
        page=params.page,
        limit=params.limit,
        pages=math.ceil(total / params.limit) if total > 0 else 0,
    )


@router.get("/nearby", response_model=list[PlaceSummaryResponse])
async def get_nearby_places(
    params: NearbyPlacesParams = Depends(),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Get places near a latitude/longitude point within radius_km using PostGIS ST_DWithin
    (or Euclidean spherical approximation fallback).
    """
    # Using PostGIS ST_DWithin on geom column (distance in meters)
    radius_meters = params.radius_km * 1000.0
    point_wkt = f"SRID=4326;POINT({params.lon} {params.lat})"

    try:
        query = (
            select(Place)
            .options(
                selectinload(Place.category),
                selectinload(Place.images),
            )
            .filter(
                func.ST_DWithin(
                    Place.geom,
                    func.ST_GeogFromText(point_wkt),
                    radius_meters,
                )
            )
        )
        if params.category_id:
            query = query.filter(Place.category_id == params.category_id)

        query = query.order_by(
            func.ST_Distance(Place.geom, func.ST_GeogFromText(point_wkt))
        ).limit(params.limit)

        result = await db.execute(query)
        places = result.scalars().all()
    except Exception:
        # Fallback bounding-box filter if PostGIS extension functions are not loaded in SQLite/mock
        lat_delta = params.radius_km / 111.0
        lon_delta = params.radius_km / (111.0 * math.cos(math.radians(params.lat)))
        query = (
            select(Place)
            .options(
                selectinload(Place.category),
                selectinload(Place.images),
            )
            .filter(
                Place.latitude.between(params.lat - lat_delta, params.lat + lat_delta),
                Place.longitude.between(params.lon - lon_delta, params.lon + lon_delta),
            )
        )
        if params.category_id:
            query = query.filter(Place.category_id == params.category_id)
        query = query.limit(params.limit)

        result = await db.execute(query)
        places = result.scalars().all()

    return [_format_place_summary(p) for p in places]


@router.get("/{place_id}", response_model=PlaceDetailResponse)
async def get_place_detail(
    place_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Get full details of a specific place including tags and images."""
    query = (
        select(Place)
        .options(
            selectinload(Place.category),
            selectinload(Place.images),
            selectinload(Place.tags).selectinload(PlaceTag.tag),
        )
        .filter(Place.id == place_id)
    )
    result = await db.execute(query)
    place = result.scalar_one_or_none()

    if not place:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Place not found",
        )

    return _format_place_detail(place)


@router.post("", response_model=PlaceDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_place(
    payload: PlaceCreateRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> Any:
    """Admin: create a new place."""
    # Verify city exists
    city_res = await db.execute(select(City).filter(City.id == payload.city_id))
    if not city_res.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Invalid city_id")

    # Verify category exists
    cat_res = await db.execute(select(Category).filter(Category.id == payload.category_id))
    if not cat_res.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Invalid category_id")

    slug = payload.name.lower().replace(" ", "-")
    # Handle duplicate slug suffix if needed
    slug_check = await db.execute(select(Place).filter(Place.slug == slug))
    if slug_check.scalar_one_or_none():
        slug = f"{slug}-{uuid.uuid4().hex[:6]}"

    point_wkt = f"SRID=4326;POINT({payload.longitude} {payload.latitude})"
    place = Place(
        city_id=payload.city_id,
        category_id=payload.category_id,
        name=payload.name,
        slug=slug,
        description=payload.description,
        latitude=payload.latitude,
        longitude=payload.longitude,
        geom=func.ST_GeogFromText(point_wkt),
        address=payload.address,
        estimated_cost_min=payload.estimated_cost_min,
        estimated_cost_max=payload.estimated_cost_max,
        average_visit_duration_minutes=payload.average_visit_duration_minutes,
        indoor_outdoor=payload.indoor_outdoor,
        family_suitable=payload.family_suitable,
        activity_level=payload.activity_level,
        historical_significance=payload.historical_significance,
        food_relevance=payload.food_relevance,
        opening_hours=payload.opening_hours,
        seasonality=payload.seasonality,
        source=payload.source,
        source_url=payload.source_url,
        last_verified=payload.last_verified,
        data_confidence=payload.data_confidence,
    )
    db.add(place)
    await db.flush()

    # Link tags
    if payload.tag_ids:
        for tag_id in payload.tag_ids:
            pt = PlaceTag(place_id=place.id, tag_id=tag_id)
            db.add(pt)

    await db.commit()

    # Refetch full place with relationships
    return await get_place_detail(place.id, db)


@router.put("/{place_id}", response_model=PlaceDetailResponse)
async def update_place(
    place_id: uuid.UUID,
    payload: PlaceUpdateRequest,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Update a place entity and its primary image URL."""
    stmt = (
        select(Place)
        .options(
            selectinload(Place.category),
            selectinload(Place.images),
        )
        .filter(Place.id == place_id)
    )
    res = await db.execute(stmt)
    place = res.scalar_one_or_none()
    if not place:
        raise HTTPException(status_code=404, detail="Place not found")

    if payload.name is not None:
        place.name = payload.name
    if payload.description is not None:
        place.description = payload.description
    if payload.latitude is not None:
        place.latitude = payload.latitude
    if payload.longitude is not None:
        place.longitude = payload.longitude
    if payload.estimated_cost_min is not None:
        place.estimated_cost_min = payload.estimated_cost_min
    if payload.estimated_cost_max is not None:
        place.estimated_cost_max = payload.estimated_cost_max
    if payload.popularity_score is not None:
        place.popularity_score = payload.popularity_score
    if payload.indoor_outdoor is not None:
        place.indoor_outdoor = payload.indoor_outdoor
    if payload.family_suitable is not None:
        place.family_suitable = payload.family_suitable
    if payload.activity_level is not None:
        place.activity_level = payload.activity_level

    # Update primary image URL if provided
    if payload.image_url:
        img_stmt = select(PlaceImage).where(PlaceImage.place_id == place.id)
        img_res = await db.execute(img_stmt)
        existing_imgs = img_res.scalars().all()
        if existing_imgs:
            primary = next((i for i in existing_imgs if i.is_primary), existing_imgs[0])
            primary.url = payload.image_url
            primary.is_primary = True
        else:
            new_img = PlaceImage(
                id=uuid.uuid4(),
                place_id=place.id,
                url=payload.image_url,
                caption=f"{place.name} Image",
                is_primary=True,
            )
            db.add(new_img)

    await db.commit()
    return await get_place_detail(place.id, db)


@router.delete("/{place_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_place(
    place_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> None:
    """Admin: delete a place."""
    res = await db.execute(select(Place).filter(Place.id == place_id))
    place = res.scalar_one_or_none()
    if not place:
        raise HTTPException(status_code=404, detail="Place not found")
    await db.delete(place)
    await db.commit()
