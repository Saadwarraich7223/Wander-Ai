"""User profile and preferences endpoints."""

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import delete, select

from app.core.dependencies import CurrentUser, DbSession
from app.models.user import UserPreference, UserProfile
from app.schemas.common import MessageResponse
from app.schemas.user import (
    MeResponse,
    UserPreferenceResponse,
    UserPreferencesUpdateRequest,
    UserProfileResponse,
    UserProfileUpdateRequest,
    UserResponse,
    UserUpdateRequest,
)

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=MeResponse, summary="Get current user with profile")
async def get_me(current_user: CurrentUser, db: DbSession) -> MeResponse:
    profile_result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    profile = profile_result.scalar_one_or_none()

    pref_result = await db.execute(
        select(UserPreference).where(UserPreference.user_id == current_user.id)
    )
    preferences = pref_result.scalars().all()

    has_onboarding = profile is not None and (
        profile.preferred_budget is not None
        or profile.travel_style is not None
    )

    profile_response = None
    if profile:
        profile_response = UserProfileResponse.model_validate(profile)

    return MeResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        avatar_url=current_user.avatar_url,
        is_active=current_user.is_active,
        is_admin=current_user.is_admin,
        created_at=current_user.created_at,
        profile=profile_response,
        preference_count=len(preferences),
        has_completed_onboarding=has_onboarding,
    )


@router.patch("/me", response_model=UserResponse, summary="Update current user")
async def update_me(
    payload: UserUpdateRequest,
    current_user: CurrentUser,
    db: DbSession,
) -> UserResponse:
    if payload.name is not None:
        current_user.name = payload.name.strip()
    if payload.avatar_url is not None:
        current_user.avatar_url = payload.avatar_url
    await db.commit()
    await db.refresh(current_user)
    return UserResponse.model_validate(current_user)


@router.get("/me/profile", response_model=UserProfileResponse, summary="Get travel profile")
async def get_profile(current_user: CurrentUser, db: DbSession) -> UserProfileResponse:
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return UserProfileResponse.model_validate(profile)


@router.put(
    "/me/profile",
    response_model=UserProfileResponse,
    summary="Create or update travel profile",
)
async def upsert_profile(
    payload: UserProfileUpdateRequest,
    current_user: CurrentUser,
    db: DbSession,
) -> UserProfileResponse:
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()

    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)

    update_data = payload.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(profile, field, value)

    await db.commit()
    await db.refresh(profile)
    return UserProfileResponse.model_validate(profile)


@router.get(
    "/me/preferences",
    response_model=list[UserPreferenceResponse],
    summary="Get category preference scores",
)
async def get_preferences(current_user: CurrentUser, db: DbSession) -> list[UserPreferenceResponse]:
    result = await db.execute(
        select(UserPreference).where(UserPreference.user_id == current_user.id)
    )
    return [UserPreferenceResponse.model_validate(p) for p in result.scalars().all()]


@router.put(
    "/me/preferences",
    response_model=list[UserPreferenceResponse],
    summary="Bulk upsert category preference scores",
)
async def upsert_preferences(
    payload: UserPreferencesUpdateRequest,
    current_user: CurrentUser,
    db: DbSession,
) -> list[UserPreferenceResponse]:
    """
    Replaces all category preferences for the current user.
    Used during onboarding and when user updates interests.
    """
    # Delete existing preferences
    await db.execute(
        delete(UserPreference).where(UserPreference.user_id == current_user.id)
    )

    # Insert new preferences
    new_prefs = [
        UserPreference(
            user_id=current_user.id,
            category_id=item.category_id,
            preference_score=item.preference_score,
        )
        for item in payload.preferences
    ]
    db.add_all(new_prefs)
    await db.commit()

    result = await db.execute(
        select(UserPreference).where(UserPreference.user_id == current_user.id)
    )
    return [UserPreferenceResponse.model_validate(p) for p in result.scalars().all()]
