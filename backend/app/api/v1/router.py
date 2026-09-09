"""Central API v1 router combining all resource endpoints."""

from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.categories import router as categories_router
from app.api.v1.cities import router as cities_router
from app.api.v1.interactions import router as interactions_router
from app.api.v1.places import router as places_router
from app.api.v1.recommendations import router as recommendations_router
from app.api.v1.trips import router as trips_router
from app.api.v1.users import router as users_router
from app.api.v1.ai import router as ai_router

api_router = APIRouter(prefix="/v1")

api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(places_router)
api_router.include_router(cities_router)
api_router.include_router(categories_router)
api_router.include_router(interactions_router)
api_router.include_router(recommendations_router)
api_router.include_router(trips_router)
api_router.include_router(ai_router)

