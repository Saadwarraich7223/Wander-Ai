"""FastAPI router for crowdsourced corridor intelligence & live field telemetry."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy import distinct, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import OptionalUser
from app.models.intel import CorridorIntelReport
from app.models.place import Place
from app.schemas.intel import (
    CorridorIntelCreate,
    CorridorIntelListResponse,
    CorridorIntelResponse,
)

router = APIRouter(prefix="/corridor-intel", tags=["Corridor Intelligence"])


@router.get("", response_model=CorridorIntelListResponse)
async def list_corridor_intel(
    db: Annotated[AsyncSession, Depends(get_db)],
    place_id: uuid.UUID | None = Query(None, description="Filter by Place UUID"),
    place_slug: str | None = Query(None, description="Filter by Place slug"),
    place_name: str | None = Query(None, description="Filter by Place name (partial/fuzzy)"),
    city_id: uuid.UUID | None = Query(None, description="Filter by City UUID"),
    city_name: str | None = Query(None, description="Filter by City name"),
    corridor_name: str | None = Query(None, description="Filter by Corridor name"),
    trip_id: uuid.UUID | None = Query(None, description="Filter by Trip UUID"),
    limit: int = Query(50, ge=1, le=200, description="Max reports to return"),
) -> CorridorIntelListResponse:
    """
    Public endpoint: Retrieve live field reports and telemetry for any destination or corridor.
    Accessible to all users (logged-in, guest, mobile, desktop).
    """
    query = select(CorridorIntelReport)
    conditions = []

    if place_id:
        conditions.append(CorridorIntelReport.place_id == place_id)
    if place_slug:
        conditions.append(CorridorIntelReport.place_slug == place_slug.strip().lower())
    if place_name:
        clean_name = place_name.strip().lower()
        conditions.append(func.lower(CorridorIntelReport.place_name).contains(clean_name))
    if trip_id:
        conditions.append(CorridorIntelReport.trip_id == trip_id)
    if city_id:
        conditions.append(CorridorIntelReport.city_id == city_id)
    if city_name:
        conditions.append(func.lower(CorridorIntelReport.city_name).contains(city_name.strip().lower()))
    if corridor_name:
        conditions.append(func.lower(CorridorIntelReport.corridor_name).contains(corridor_name.strip().lower()))

    if conditions:
        query = query.where(or_(*conditions))

    query = query.order_by(CorridorIntelReport.created_at.desc()).limit(limit)
    result = await db.execute(query)
    reports = result.scalars().all()

    # Calculate distinct tourists attribution
    reporters = set()
    for r in reports:
        if r.user_id:
            reporters.add(str(r.user_id))
        elif r.reporter_name:
            reporters.add(r.reporter_name.strip().lower())
        else:
            reporters.add(str(r.id))

    response_items = []
    for r in reports:
        response_items.append(
            CorridorIntelResponse(
                id=r.id,
                place_id=r.place_id,
                place_slug=r.place_slug,
                place_name=r.place_name,
                corridor_name=r.corridor_name,
                city_id=r.city_id,
                city_name=r.city_name,
                trip_id=r.trip_id,
                user_id=r.user_id,
                reporter_name=r.reporter_name,
                verified_in_trip=r.verified_in_trip,
                road_condition=r.road_condition,
                fuel_status=r.fuel_status,
                atm_status=r.atm_status,
                note=r.note,
                created_at=r.created_at,
                timestamp=r.created_at.isoformat() if r.created_at else None,
            )
        )

    return CorridorIntelListResponse(
        reports=response_items,
        total_reports=len(response_items),
        unique_tourists_count=max(len(reporters), 1 if len(response_items) > 0 else 0),
    )


@router.post("", response_model=CorridorIntelResponse, status_code=status.HTTP_201_CREATED)
async def submit_corridor_intel(
    payload: CorridorIntelCreate,
    current_user: OptionalUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    request: Request,
) -> CorridorIntelResponse:
    """
    Submit a real-time field telemetry report for a destination or corridor.
    Persists universally to the database so all devices and travelers see updates immediately.
    """
    user_id = current_user.id if current_user else None
    reporter_name = payload.reporter_name or "Verified Explorer"
    if current_user and current_user.name:
        reporter_name = current_user.name

    place_id = payload.place_id
    place_slug = payload.place_slug
    city_id = payload.city_id
    city_name = payload.city_name

    # If place_id or place_name given, enrich missing metadata from Place table if available
    if place_id and (not place_slug or not city_id):
        place_res = await db.execute(select(Place).where(Place.id == place_id))
        place_obj = place_res.scalar_one_or_none()
        if place_obj:
            if not place_slug:
                place_slug = place_obj.slug
            if not city_id:
                city_id = place_obj.city_id
            if not city_name and place_obj.city:
                city_name = place_obj.city.name

    client_ip = request.client.host if request.client else None

    report = CorridorIntelReport(
        place_id=place_id,
        place_slug=place_slug.lower() if place_slug else None,
        place_name=payload.place_name,
        corridor_name=payload.corridor_name,
        city_id=city_id,
        city_name=city_name,
        trip_id=payload.trip_id,
        user_id=user_id,
        reporter_name=reporter_name,
        verified_in_trip=payload.verified_in_trip,
        road_condition=payload.road_condition,
        fuel_status=payload.fuel_status,
        atm_status=payload.atm_status,
        note=payload.note,
        reporter_ip=client_ip,
    )

    db.add(report)
    await db.commit()
    await db.refresh(report)

    return CorridorIntelResponse(
        id=report.id,
        place_id=report.place_id,
        place_slug=report.place_slug,
        place_name=report.place_name,
        corridor_name=report.corridor_name,
        city_id=report.city_id,
        city_name=report.city_name,
        trip_id=report.trip_id,
        user_id=report.user_id,
        reporter_name=report.reporter_name,
        verified_in_trip=report.verified_in_trip,
        road_condition=report.road_condition,
        fuel_status=report.fuel_status,
        atm_status=report.atm_status,
        note=report.note,
        created_at=report.created_at,
        timestamp=report.created_at.isoformat() if report.created_at else None,
    )
