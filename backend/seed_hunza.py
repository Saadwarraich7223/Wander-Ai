"""
Script to seed additional Hunza Valley places into the dev SQLite database.
Run: python seed_hunza.py
"""
import asyncio
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.models.place import Category, City, Place, PlaceImage


HUNZA_PLACES = [
    {
        "slug": "eagle-nest-diran-camp",
        "name": "Eagle's Nest & Diran Basecamp",
        "description": "Iconic hillside viewpoint above Duikar village offering panoramic sunrise views of Rakaposhi, Ultar Sar, and Diran peaks. The highest tea house in the world at ~3,100m.",
        "latitude": 36.3521,
        "longitude": 74.6812,
        "estimated_cost_min": 500,
        "estimated_cost_max": 1500,
        "average_visit_duration_minutes": 180,
        "indoor_outdoor": "outdoor",
        "family_suitable": True,
        "activity_level": "moderate",
        "popularity_score": 0.93,
        "category_slug": "nature",
        "image_url": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200&auto=format&fit=crop",
    },
    {
        "slug": "attabad-lake-boat-tour",
        "name": "Attabad Lake Boating & Shishkat View",
        "description": "Turquoise glacial lake formed in 2010 by a massive landslide. Boat tours across the stunning sapphire waters with views of surrounding Karakoram peaks.",
        "latitude": 36.3300,
        "longitude": 74.8603,
        "estimated_cost_min": 800,
        "estimated_cost_max": 2000,
        "average_visit_duration_minutes": 120,
        "indoor_outdoor": "outdoor",
        "family_suitable": True,
        "activity_level": "low",
        "popularity_score": 0.96,
        "category_slug": "nature",
        "image_url": "https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?q=80&w=1200&auto=format&fit=crop",
    },
    {
        "slug": "hunza-valley-viewpoint",
        "name": "Hunza Valley Grand Viewpoint",
        "description": "The central panoramic viewpoint of Karimabad giving a sweeping view of the entire Hunza Valley, the Hunza River gorge, and Rakaposhi peak (7,788m).",
        "latitude": 36.3150,
        "longitude": 74.6900,
        "estimated_cost_min": 0,
        "estimated_cost_max": 200,
        "average_visit_duration_minutes": 90,
        "indoor_outdoor": "outdoor",
        "family_suitable": True,
        "activity_level": "low",
        "popularity_score": 0.91,
        "category_slug": "nature",
        "image_url": "https://images.unsplash.com/photo-1541417904950-b855846fe074?q=80&w=1200&auto=format&fit=crop",
    },
    {
        "slug": "karimabad-bazaar",
        "name": "Karimabad Old Bazaar & Hunza Gems",
        "description": "The vibrant heart of Hunza's main town, lined with artisan shops selling handwoven Hunza caps, gemstones, lapis lazuli jewelry, local dried apricots, and walnut oil.",
        "latitude": 36.3180,
        "longitude": 74.6855,
        "estimated_cost_min": 500,
        "estimated_cost_max": 5000,
        "average_visit_duration_minutes": 90,
        "indoor_outdoor": "both",
        "family_suitable": True,
        "activity_level": "low",
        "popularity_score": 0.82,
        "category_slug": "shopping",
        "image_url": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=1200&auto=format&fit=crop",
    },
    {
        "slug": "rakaposhi-basecamp",
        "name": "Rakaposhi Basecamp Trekking Trail",
        "description": "A day hike to the basecamp of Rakaposhi (7,788m), one of Pakistan's most accessible Karakoram giants. The trail offers close views of glaciers, moraines, and wildflower meadows.",
        "latitude": 36.1413,
        "longitude": 74.4892,
        "estimated_cost_min": 1000,
        "estimated_cost_max": 3000,
        "average_visit_duration_minutes": 300,
        "indoor_outdoor": "outdoor",
        "family_suitable": False,
        "activity_level": "high",
        "popularity_score": 0.88,
        "category_slug": "adventure",
        "image_url": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop",
    },
    {
        "slug": "hoper-glacier",
        "name": "Hoper Glacier & Nagar Valley",
        "description": "A living glacier in the Nagar district adjacent to Hunza. Walk on the ice, observe crevasses, and witness the dramatic Hispar Valley scenery with Spantik peak in the background.",
        "latitude": 36.2100,
        "longitude": 74.5500,
        "estimated_cost_min": 500,
        "estimated_cost_max": 1500,
        "average_visit_duration_minutes": 240,
        "indoor_outdoor": "outdoor",
        "family_suitable": False,
        "activity_level": "high",
        "popularity_score": 0.85,
        "category_slug": "nature",
        "image_url": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200&auto=format&fit=crop",
    },
    {
        "slug": "gulmit-village",
        "name": "Gulmit Heritage Village & Museum",
        "description": "One of Hunza's oldest villages with traditional multi-story stone houses, a small local museum of Wakhi culture, and stunning views of the Passu Cones mountains.",
        "latitude": 36.5005,
        "longitude": 74.8300,
        "estimated_cost_min": 200,
        "estimated_cost_max": 800,
        "average_visit_duration_minutes": 120,
        "indoor_outdoor": "both",
        "family_suitable": True,
        "activity_level": "low",
        "popularity_score": 0.78,
        "category_slug": "heritage",
        "image_url": "https://images.unsplash.com/photo-1539020140153-e479b8b22e73?q=80&w=1200&auto=format&fit=crop",
    },
    {
        "slug": "passu-cones-suspension-bridge",
        "name": "Passu Cones & Hussaini Suspension Bridge",
        "description": "The dramatic serrated skyline of Passu Cones (7,284m) alongside the legendary Hussaini Suspension Bridge — one of the world's most thrilling footbridges over the Hunza River.",
        "latitude": 36.5167,
        "longitude": 74.8700,
        "estimated_cost_min": 0,
        "estimated_cost_max": 500,
        "average_visit_duration_minutes": 150,
        "indoor_outdoor": "outdoor",
        "family_suitable": True,
        "activity_level": "moderate",
        "popularity_score": 0.95,
        "category_slug": "adventure",
        "image_url": "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200&auto=format&fit=crop",
    },
    {
        "slug": "khunjerab-pass",
        "name": "Khunjerab Pass (China Border)",
        "description": "The world's highest paved international border crossing at 4,693m. A dramatic high-altitude plateau with yaks, snow-covered peaks, and the formal border gate between Pakistan and China.",
        "latitude": 36.8400,
        "longitude": 75.4200,
        "estimated_cost_min": 500,
        "estimated_cost_max": 2000,
        "average_visit_duration_minutes": 180,
        "indoor_outdoor": "outdoor",
        "family_suitable": True,
        "activity_level": "moderate",
        "popularity_score": 0.92,
        "category_slug": "nature",
        "image_url": "https://images.unsplash.com/photo-1524850011238-e3d235c7d4c9?q=80&w=1200&auto=format&fit=crop",
    },
    {
        "slug": "hunza-apricot-orchards",
        "name": "Hunza Apricot Orchards & Blossom Season",
        "description": "Hunza's famous apricot and cherry blossom orchards best seen in spring (March–April) and during harvest (July–August). Includes local farms where you can taste fresh apricots, mulberries, and dry fruit.",
        "latitude": 36.3200,
        "longitude": 74.6950,
        "estimated_cost_min": 0,
        "estimated_cost_max": 500,
        "average_visit_duration_minutes": 90,
        "indoor_outdoor": "outdoor",
        "family_suitable": True,
        "activity_level": "low",
        "popularity_score": 0.87,
        "category_slug": "nature",
        "image_url": "https://images.unsplash.com/photo-1495570689269-8d2bf5e5aa3a?q=80&w=1200&auto=format&fit=crop",
    },
]

# Map categories slugs to what exists in the DB
CATEGORY_SLUG_ALIASES = {
    "nature": ["nature", "landscape", "outdoor"],
    "heritage": ["heritage", "historical", "culture", "history"],
    "adventure": ["adventure", "trekking", "sports"],
    "shopping": ["shopping", "bazaar", "market"],
}


async def seed_hunza():
    async with AsyncSessionLocal() as db:
        # Get Hunza city
        city_res = await db.execute(select(City).filter(City.slug == "hunza"))
        hunza = city_res.scalar_one_or_none()
        if not hunza:
            print("ERROR: Hunza city not found in DB. Run main seed first.")
            return
        print(f"Found Hunza city: {hunza.id}")

        # Get all categories
        cat_res = await db.execute(select(Category))
        all_cats = {c.slug: c for c in cat_res.scalars().all()}
        print(f"Available categories: {list(all_cats.keys())}")

        # Pick a default fallback category
        default_cat = next(iter(all_cats.values()))

        inserted = 0
        skipped = 0

        for place_data in HUNZA_PLACES:
            # Check if already exists
            existing = await db.execute(select(Place).filter(Place.slug == place_data["slug"]))
            if existing.scalar_one_or_none():
                print(f"  Skipping (exists): {place_data['name']}")
                skipped += 1
                continue

            # Find the category
            cat_slug = place_data["category_slug"]
            category = all_cats.get(cat_slug)
            if not category:
                # Try aliases
                for aliases in CATEGORY_SLUG_ALIASES.get(cat_slug, []):
                    category = all_cats.get(aliases)
                    if category:
                        break
            if not category:
                category = default_cat
                print(f"  Using default category for: {place_data['name']}")

            place = Place(
                city_id=hunza.id,
                category_id=category.id,
                name=place_data["name"],
                slug=place_data["slug"],
                description=place_data["description"],
                latitude=place_data["latitude"],
                longitude=place_data["longitude"],
                estimated_cost_min=place_data["estimated_cost_min"],
                estimated_cost_max=place_data["estimated_cost_max"],
                average_visit_duration_minutes=place_data["average_visit_duration_minutes"],
                indoor_outdoor=place_data["indoor_outdoor"],
                family_suitable=place_data["family_suitable"],
                activity_level=place_data["activity_level"],
                popularity_score=place_data["popularity_score"],
                data_confidence=0.9,
            )
            db.add(place)
            await db.flush()

            # Add primary image
            img = PlaceImage(
                place_id=place.id,
                url=place_data["image_url"],
                is_primary=True,
                sort_order=0,
                caption=place_data["name"],
            )
            db.add(img)
            inserted += 1
            print(f"  Inserted: {place_data['name']}")

        await db.commit()
        print(f"\nDone! Inserted {inserted} places, skipped {skipped} duplicates.")


if __name__ == "__main__":
    asyncio.run(seed_hunza())
