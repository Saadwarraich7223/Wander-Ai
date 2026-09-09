"""Database seed script for populating Pakistan tourism dataset."""

import asyncio
import json
from pathlib import Path
from typing import Any

from sqlalchemy import func, select

from app.core.database import AsyncSessionLocal, engine
from app.models import Base
from app.models.place import Category, City, Place, PlaceImage, PlaceTag, Region, Tag


def _get_dataset_path() -> Path:
    root = Path(__file__).resolve().parent.parent.parent.parent
    return root / "data" / "raw" / "pakistan_places.json"


async def seed_database() -> None:
    """Populate database with regions, cities, categories, tags, and places."""
    dataset_path = _get_dataset_path()
    if not dataset_path.exists():
        print(f"Dataset file not found at {dataset_path}")
        return

    with open(dataset_path, "r", encoding="utf-8") as f:
        data: dict[str, Any] = json.load(f)

    print("Starting database seeding...")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # 1. Seed Regions
        region_map: dict[str, Region] = {}
        for r_data in data.get("regions", []):
            res = await db.execute(select(Region).filter(Region.slug == r_data["slug"]))
            region = res.scalar_one_or_none()
            if not region:
                region = Region(
                    name=r_data["name"],
                    slug=r_data["slug"],
                    description=r_data.get("description"),
                )
                db.add(region)
                await db.flush()
            region_map[r_data["slug"]] = region

        # 2. Seed Cities
        city_map: dict[str, City] = {}
        for c_data in data.get("cities", []):
            res = await db.execute(select(City).filter(City.slug == c_data["slug"]))
            city = res.scalar_one_or_none()
            region = region_map.get(c_data["region_slug"])
            if not city and region:
                point_wkt = f"SRID=4326;POINT({c_data['longitude']} {c_data['latitude']})"
                city = City(
                    region_id=region.id,
                    name=c_data["name"],
                    slug=c_data["slug"],
                    description=c_data.get("description"),
                    latitude=c_data["latitude"],
                    longitude=c_data["longitude"],
                    geom=func.ST_GeogFromText(point_wkt) if "sqlite" not in str(engine.url) else None,
                    image_url=c_data.get("image_url"),
                    is_featured=c_data.get("is_featured", False),
                )
                db.add(city)
                await db.flush()
            if city:
                city_map[c_data["slug"]] = city

        # 3. Seed Categories
        category_map: dict[str, Category] = {}
        for cat_data in data.get("categories", []):
            res = await db.execute(select(Category).filter(Category.slug == cat_data["slug"]))
            cat = res.scalar_one_or_none()
            if not cat:
                cat = Category(
                    name=cat_data["name"],
                    slug=cat_data["slug"],
                    icon=cat_data.get("icon"),
                    description=cat_data.get("description"),
                    sort_order=cat_data.get("sort_order", 0),
                )
                db.add(cat)
                await db.flush()
            category_map[cat_data["slug"]] = cat

        # 4. Seed Tags
        tag_map: dict[str, Tag] = {}
        for tag_data in data.get("tags", []):
            res = await db.execute(select(Tag).filter(Tag.slug == tag_data["slug"]))
            tag = res.scalar_one_or_none()
            if not tag:
                tag = Tag(
                    name=tag_data["name"],
                    slug=tag_data["slug"],
                )
                db.add(tag)
                await db.flush()
            tag_map[tag_data["slug"]] = tag

        # 5. Seed Places
        inserted_count = 0
        for p_data in data.get("places", []):
            res = await db.execute(select(Place).filter(Place.slug == p_data["slug"]))
            if res.scalar_one_or_none():
                continue  # Already seeded

            city = city_map.get(p_data["city_slug"])
            category = category_map.get(p_data["category_slug"])
            if not city or not category:
                print(f"Skipping place {p_data['name']}: missing city/category mapping")
                continue

            point_wkt = f"SRID=4326;POINT({p_data['longitude']} {p_data['latitude']})"
            place = Place(
                city_id=city.id,
                category_id=category.id,
                name=p_data["name"],
                slug=p_data["slug"],
                description=p_data.get("description"),
                address=p_data.get("address"),
                latitude=p_data["latitude"],
                longitude=p_data["longitude"],
                geom=func.ST_GeogFromText(point_wkt) if "sqlite" not in str(engine.url) else None,
                estimated_cost_min=p_data.get("estimated_cost_min"),
                estimated_cost_max=p_data.get("estimated_cost_max"),
                average_visit_duration_minutes=p_data.get("average_visit_duration_minutes"),
                indoor_outdoor=p_data.get("indoor_outdoor", "outdoor"),
                family_suitable=p_data.get("family_suitable", True),
                activity_level=p_data.get("activity_level", "moderate"),
                popularity_score=p_data.get("popularity_score", 0.5),
                historical_significance=p_data.get("historical_significance"),
                food_relevance=p_data.get("food_relevance"),
                opening_hours=p_data.get("opening_hours"),
                seasonality=p_data.get("seasonality"),
                source=p_data.get("source"),
                source_url=p_data.get("source_url"),
                last_verified=p_data.get("last_verified"),
                data_confidence=p_data.get("data_confidence", 0.9),
            )
            db.add(place)
            await db.flush()

            # Add tags
            for t_slug in p_data.get("tag_slugs", []):
                t_obj = tag_map.get(t_slug)
                if t_obj:
                    pt = PlaceTag(place_id=place.id, tag_id=t_obj.id)
                    db.add(pt)

            # Add images
            for idx, img_data in enumerate(p_data.get("images", [])):
                p_img = PlaceImage(
                    place_id=place.id,
                    url=img_data["url"],
                    caption=img_data.get("caption"),
                    is_primary=img_data.get("is_primary", idx == 0),
                    sort_order=idx,
                )
                db.add(p_img)

            inserted_count += 1

        await db.commit()

    print(f"Seeding complete! Seeded {inserted_count} new place records.")


if __name__ == "__main__":
    asyncio.run(seed_database())
