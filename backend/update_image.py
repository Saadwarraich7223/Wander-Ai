"""
Utility script to manually change or add images for any place in the database.

Usage:
  python update_image.py "<place_name_or_slug>" "<new_image_url>" "[optional_caption]"

Example:
  python update_image.py "attabad-lake-hunza" "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200" "Attabad Alpine Turquoise Lake"
"""

import sys
import asyncio
import uuid
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.place import Place, PlaceImage

async def update_place_image(search_query: str, new_url: str, caption: str = "Verified Place Image"):
    async with AsyncSessionLocal() as db:
        # Search place by slug or name
        stmt = select(Place).where(
            (Place.slug.ilike(f"%{search_query}%")) | (Place.name.ilike(f"%{search_query}%"))
        )
        res = await db.execute(stmt)
        places = res.scalars().all()

        if not places:
            print(f"❌ No place found matching query: '{search_query}'")
            return

        if len(places) > 1:
            print(f"⚠️ Multiple places found matching '{search_query}':")
            for p in places:
                print(f"   • [{p.slug}] {p.name} (ID: {p.id})")
            print("Please refine your search with exact slug or full name.")
            return

        target_place = places[0]
        print(f"📍 Target Place Found: '{target_place.name}' (Slug: {target_place.slug})")

        # Fetch existing images for this place
        img_stmt = select(PlaceImage).where(PlaceImage.place_id == target_place.id)
        img_res = await db.execute(img_stmt)
        existing_images = img_res.scalars().all()

        if existing_images:
            # Update primary image URL or set all existing as non-primary
            primary = next((i for i in existing_images if i.is_primary), existing_images[0])
            old_url = primary.url
            primary.url = new_url
            primary.caption = caption or primary.caption
            primary.is_primary = True
            print(f"✅ Primary image updated successfully!")
            print(f"   Old URL: {old_url[:60]}...")
            print(f"   New URL: {new_url}")
        else:
            # Insert new primary image
            new_img = PlaceImage(
                id=str(uuid.uuid4()),
                place_id=target_place.id,
                url=new_url,
                caption=caption,
                is_primary=True,
            )
            db.add(new_img)
            print(f"✅ New primary image added successfully!")
            print(f"   Image URL: {new_url}")

        await db.commit()
        print("🎉 Database updated successfully!")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python update_image.py \"<place_name_or_slug>\" \"<new_image_url>\" \"[caption]\"")
        sys.exit(1)

    query = sys.argv[1]
    url = sys.argv[2]
    cap = sys.argv[3] if len(sys.argv) > 3 else "Verified Place Image"

    asyncio.run(update_place_image(query, url, cap))
