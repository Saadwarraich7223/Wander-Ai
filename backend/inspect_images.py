import asyncio
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.place import Place, PlaceImage, City

async def main():
    async with AsyncSessionLocal() as session:
        stmt = select(Place)
        res = await session.execute(stmt)
        places = res.scalars().all()
        print(f"Total Places: {len(places)}\n")
        
        for p in places:
            img_stmt = select(PlaceImage).where(PlaceImage.place_id == p.id, PlaceImage.is_primary == True)
            img_res = await session.execute(img_stmt)
            img = img_res.scalar_one_or_none()

            city_res = await session.execute(select(City).where(City.id == p.city_id))
            city = city_res.scalar_one_or_none()
            city_name = city.name if city else "Unknown"
            
            url = img.url if img else "NO_IMAGE"
            print(f"ID: {p.id} | Slug: {p.slug} | City: {city_name}")
            print(f"Name: {p.name}")
            print(f"Image: {url}\n")

if __name__ == "__main__":
    asyncio.run(main())
