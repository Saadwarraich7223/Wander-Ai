"""Models package — import all for Alembic autodiscovery."""

from app.models.base import Base, TimestampMixin, UUIDMixin
from app.models.interaction import UserInteraction
from app.models.place import Category, City, Place, PlaceImage, PlaceTag, Region, Tag
from app.models.trip import Itinerary, ItineraryDay, ItineraryItem, Trip
from app.models.user import RefreshToken, User, UserPreference, UserProfile

__all__ = [
    "Base",
    "TimestampMixin",
    "UUIDMixin",
    # User domain
    "User",
    "UserProfile",
    "UserPreference",
    "RefreshToken",
    # Tourism domain
    "Region",
    "City",
    "Category",
    "Tag",
    "Place",
    "PlaceTag",
    "PlaceImage",
    # Interaction domain
    "UserInteraction",
    # Trip domain
    "Trip",
    "Itinerary",
    "ItineraryDay",
    "ItineraryItem",
]
