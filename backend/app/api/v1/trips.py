"""Trips and Itinerary API endpoints."""

import uuid
from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.v1.places import _format_place_summary
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.place import City, Place
from app.models.trip import Itinerary, ItineraryDay, ItineraryItem, Trip
from app.models.user import User
from app.schemas.trip import (
    AddStopRequest,
    ItineraryDayResponse,
    ItineraryItemResponse,
    ItineraryResponse,
    ReoptimizeRequest,
    TripCreateRequest,
    TripResponse,
)
from app.services.optimizer_service import ItineraryOptimizerService, format_time

router = APIRouter(prefix="/trips", tags=["Trips & Itineraries"])


def _format_itinerary_response(itinerary: Itinerary) -> ItineraryResponse:
    day_responses: list[ItineraryDayResponse] = []
    for day in itinerary.days:
        item_responses: list[ItineraryItemResponse] = [
            ItineraryItemResponse(
                id=item.id,
                day_id=item.day_id,
                place=_format_place_summary(item.place),
                item_order=item.item_order,
                start_time=item.start_time or "09:00",
                end_time=item.end_time or "10:30",
                visit_duration_minutes=item.visit_duration_minutes or 90,
                travel_time_from_prev_minutes=item.travel_time_from_prev_minutes,
                travel_distance_from_prev_km=item.travel_distance_from_prev_km,
                estimated_cost=item.estimated_cost,
                notes=item.notes,
            )
            for item in sorted(day.items, key=lambda i: i.item_order)
        ]
        day_responses.append(
            ItineraryDayResponse(
                id=day.id,
                itinerary_id=day.itinerary_id,
                day_number=day.day_number,
                date=day.date,
                weather_context=day.weather_context,
                items=item_responses,
            )
        )

    day_responses.sort(key=lambda d: d.day_number)

    return ItineraryResponse(
        id=itinerary.id,
        trip_id=itinerary.trip_id,
        version=itinerary.version,
        total_cost=itinerary.total_cost,
        total_travel_time_minutes=itinerary.total_travel_time_minutes,
        total_travel_distance_km=itinerary.total_travel_distance_km,
        feasibility_score=itinerary.feasibility_score,
        preference_satisfaction_score=itinerary.preference_satisfaction_score,
        algorithm=itinerary.algorithm,
        narrative=itinerary.narrative,
        generated_at=itinerary.generated_at,
        days=day_responses,
    )


def _format_trip_response(trip: Trip) -> TripResponse:
    active_itin_res = _format_itinerary_response(trip.active_itinerary) if trip.active_itinerary else None
    return TripResponse(
        id=trip.id,
        user_id=trip.user_id,
        city_id=trip.destination_city_id,
        title=trip.title,
        duration_days=trip.total_days,
        total_budget=trip.total_budget,
        pace=getattr(trip, "pace", "moderate"),
        start_date=trip.start_date,
        preferences=trip.preferences,
        active_itinerary=active_itin_res,
        created_at=trip.created_at,
    )


async def _load_trip_with_itinerary(
    trip_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession,
) -> Trip:
    query = (
        select(Trip)
        .options(
            selectinload(Trip.itineraries)
            .selectinload(Itinerary.days)
            .selectinload(ItineraryDay.items)
            .selectinload(ItineraryItem.place)
            .selectinload(Place.category),
            selectinload(Trip.itineraries)
            .selectinload(Itinerary.days)
            .selectinload(ItineraryDay.items)
            .selectinload(ItineraryItem.place)
            .selectinload(Place.images),
        )
        .filter(Trip.id == trip_id, Trip.user_id == user_id)
    )
    res = await db.execute(query)
    trip = res.scalar_one_or_none()

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    return trip


@router.post("", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=TripResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
async def create_trip(
    payload: TripCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Create a new trip and run initial constraint-based itinerary optimization."""
    city_res = await db.execute(select(City).filter(City.id == payload.city_id))
    if not city_res.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Invalid city_id")

    prefs = dict(payload.context) if payload.context else {}
    prefs["pace"] = payload.pace

    user_id = current_user.id
    trip = Trip(
        user_id=user_id,
        destination_city_id=payload.city_id,
        title=payload.title,
        total_days=payload.duration_days,
        total_budget=payload.total_budget,
        start_date=payload.start_date,
        preferences=prefs,
    )
    db.add(trip)
    await db.flush()
    trip_id = trip.id

    # Generate Itinerary v1
    optimizer = ItineraryOptimizerService(db)
    await optimizer.build_and_save_itinerary(trip, current_user, version=1)
    await db.commit()

    fresh_trip = await _load_trip_with_itinerary(trip_id, user_id, db)
    return _format_trip_response(fresh_trip)


@router.get("", response_model=list[TripResponse])
@router.get("/", response_model=list[TripResponse], include_in_schema=False)
async def list_user_trips(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """List all trips for the authenticated user."""
    query = (
        select(Trip)
        .options(
            selectinload(Trip.itineraries)
            .selectinload(Itinerary.days)
            .selectinload(ItineraryDay.items)
            .selectinload(ItineraryItem.place)
            .selectinload(Place.category),
            selectinload(Trip.itineraries)
            .selectinload(Itinerary.days)
            .selectinload(ItineraryDay.items)
            .selectinload(ItineraryItem.place)
            .selectinload(Place.images),
        )
        .filter(Trip.user_id == current_user.id)
        .order_by(Trip.created_at.desc())
    )
    res = await db.execute(query)
    trips = res.scalars().all()
    return [_format_trip_response(t) for t in trips]


@router.get("/{trip_id}", response_model=TripResponse)
async def get_trip(
    trip_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get full details of a specific trip with active itinerary."""
    trip = await _load_trip_with_itinerary(trip_id, current_user.id, db)
    return _format_trip_response(trip)


@router.post("/{trip_id}/reoptimize", response_model=TripResponse)
async def reoptimize_trip(
    trip_id: uuid.UUID,
    payload: ReoptimizeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Reoptimize an existing trip with updated parameters.
    Increments itinerary version (v1 -> v2) without deleting previous versions.
    """
    user_id = current_user.id
    trip = await _load_trip_with_itinerary(trip_id, user_id, db)

    if payload.new_total_budget is not None:
        trip.total_budget = payload.new_total_budget
    if payload.new_duration_days is not None:
        trip.total_days = payload.new_duration_days
    if payload.new_pace is not None:
        prefs = dict(trip.preferences or {})
        prefs["pace"] = payload.new_pace
        trip.preferences = prefs
    if payload.new_preferences is not None:
        prefs = dict(trip.preferences or {})
        prefs.update(payload.new_preferences)
        trip.preferences = prefs

    # Count existing versions
    v_res = await db.execute(select(Itinerary).filter(Itinerary.trip_id == trip.id))
    existing_versions = len(v_res.scalars().all())
    new_version = existing_versions + 1

    optimizer = ItineraryOptimizerService(db)
    await optimizer.build_and_save_itinerary(trip, current_user, version=new_version)
    await db.commit()
    db.expire_all()

    fresh_trip = await _load_trip_with_itinerary(trip_id, user_id, db)
    return _format_trip_response(fresh_trip)


@router.post("/{trip_id}/stops", response_model=TripResponse)
async def add_stop_to_trip(
    trip_id: uuid.UUID,
    payload: AddStopRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Append a place as a new stop on the trip's active itinerary.

    Uses the last day by default, or the preferred_day_number if provided.
    Time slots continue from the last scheduled item (09:00 if the day is empty).
    """
    user_id = current_user.id
    trip = await _load_trip_with_itinerary(trip_id, user_id, db)

    place_res = await db.execute(
        select(Place)
        .options(selectinload(Place.category), selectinload(Place.images))
        .filter(Place.id == payload.place_id)
    )
    place = place_res.scalar_one_or_none()
    if not place:
        raise HTTPException(status_code=404, detail="Place not found")

    itinerary = trip.active_itinerary
    if not itinerary or not itinerary.days:
        raise HTTPException(status_code=400, detail="Trip has no itinerary yet — generate one first")

    days = sorted(itinerary.days, key=lambda d: d.day_number)
    target_day = next(
        (d for d in days if d.day_number == payload.preferred_day_number),
        None,
    ) if payload.preferred_day_number is not None else None
    if target_day is None:
        if payload.preferred_day_number is not None:
            raise HTTPException(status_code=400, detail="preferred_day_number exceeds itinerary length")
        target_day = days[-1]

    existing_items = sorted(target_day.items, key=lambda i: i.item_order)
    prev_end_minute = ItineraryOptimizerService.DAY_START_MINUTE
    if existing_items and existing_items[-1].end_time:
        try:
            time_str = str(existing_items[-1].end_time).strip().split()[0]
            hh, mm = (int(x) for x in time_str.split(":"))
            prev_end_minute = hh * 60 + mm + 15  # 15 min transit gap
        except Exception:
            prev_end_minute = ItineraryOptimizerService.DAY_START_MINUTE + len(existing_items) * 105

    start_minute = prev_end_minute
    if start_minute >= ItineraryOptimizerService.DAY_END_MINUTE:
        start_minute = max(ItineraryOptimizerService.DAY_START_MINUTE, ItineraryOptimizerService.DAY_END_MINUTE - 75)
        visit_duration = 60
    else:
        visit_duration = min(
            place.average_visit_duration_minutes or 90,
            max(45, ItineraryOptimizerService.DAY_END_MINUTE - start_minute),
        )

    place_cost = place.estimated_cost_max or 500.0
    item = ItineraryItem(
        day_id=target_day.id,
        place_id=place.id,
        item_order=len(existing_items),
        start_time=format_time(start_minute),
        end_time=format_time(start_minute + visit_duration),
        visit_duration_minutes=visit_duration,
        estimated_cost=place_cost,
        notes=f"Added stop: {place.name}",
    )
    item.place = place
    item.day = target_day
    db.add(item)

    itinerary.total_cost = round(
        (itinerary.total_cost or 0.0) + place_cost,
        2,
    )
    await db.commit()
    db.expire_all()

    fresh_trip = await _load_trip_with_itinerary(trip_id, user_id, db)
    return _format_trip_response(fresh_trip)


@router.delete("/{trip_id}/stops/{item_id}", response_model=TripResponse)
async def remove_stop_from_trip(
    trip_id: uuid.UUID,
    item_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Remove a specific stop (ItineraryItem) from the trip's active itinerary.
    Recalculates the day's item orders, start/end times, and the itinerary total cost.
    """
    user_id = current_user.id
    trip = await _load_trip_with_itinerary(trip_id, user_id, db)
    itinerary = trip.active_itinerary
    if not itinerary or not itinerary.days:
        raise HTTPException(status_code=400, detail="Trip has no active itinerary")

    target_item = None
    target_day = None
    for day in itinerary.days:
        for it in day.items:
            if it.id == item_id:
                target_item = it
                target_day = day
                break
        if target_item:
            break

    if not target_item or not target_day:
        raise HTTPException(status_code=404, detail="Itinerary stop not found")

    item_cost = target_item.estimated_cost or 0.0
    await db.delete(target_item)

    # Recalculate remaining items in the target day
    remaining_items = [i for i in target_day.items if i.id != item_id]
    remaining_items.sort(key=lambda i: i.item_order)

    current_minute = ItineraryOptimizerService.DAY_START_MINUTE
    for idx, it in enumerate(remaining_items):
        it.item_order = idx
        dur = it.visit_duration_minutes or 90
        it.start_time = format_time(current_minute)
        it.end_time = format_time(current_minute + dur)
        current_minute += dur + 30  # 30 min transit allowance

    target_day.items = remaining_items
    itinerary.total_cost = max(0.0, round((itinerary.total_cost or 0.0) - item_cost, 2))
    await db.commit()
    db.expire_all()

    fresh_trip = await _load_trip_with_itinerary(trip_id, user_id, db)
    return _format_trip_response(fresh_trip)


@router.delete("/{trip_id}/days/{day_number}", response_model=TripResponse)
async def remove_day_from_trip(
    trip_id: uuid.UUID,
    day_number: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Remove an entire day (ItineraryDay) from the trip's active itinerary.
    Deletes the day and all of its items.
    Re-indexes remaining days (1, 2, 3, ...).
    Decrements trip.total_days.
    Recalculates itinerary total cost.
    """
    user_id = current_user.id
    trip = await _load_trip_with_itinerary(trip_id, user_id, db)
    itinerary = trip.active_itinerary
    if not itinerary or not itinerary.days:
        raise HTTPException(status_code=400, detail="Trip has no active itinerary")

    target_day = next((d for d in itinerary.days if d.day_number == day_number), None)
    if not target_day:
        raise HTTPException(status_code=404, detail=f"Day {day_number} not found in itinerary")

    # Subtract cost of any items in this day
    day_cost = sum(item.estimated_cost or 0.0 for item in target_day.items)
    await db.delete(target_day)

    # Re-index remaining days
    remaining_days = [d for d in itinerary.days if d.day_number != day_number]
    remaining_days.sort(key=lambda d: d.day_number)

    for new_idx, d in enumerate(remaining_days, start=1):
        d.day_number = new_idx

    itinerary.days = remaining_days

    # Update trip total_days
    trip.total_days = max(1, len(remaining_days))
    if trip.start_date:
        trip.end_date = trip.start_date + timedelta(days=trip.total_days - 1)

    itinerary.total_cost = max(0.0, round((itinerary.total_cost or 0.0) - day_cost, 2))
    await db.commit()
    db.expire_all()

    fresh_trip = await _load_trip_with_itinerary(trip_id, user_id, db)
    return _format_trip_response(fresh_trip)


@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_trip(
    trip_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Delete a trip and all of its itinerary versions (cascades to days/items)."""
    res = await db.execute(select(Trip).filter(Trip.id == trip_id, Trip.user_id == current_user.id))
    trip = res.scalar_one_or_none()

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    await db.delete(trip)
    await db.commit()
