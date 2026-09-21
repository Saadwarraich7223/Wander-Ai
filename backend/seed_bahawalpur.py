"""
Script to seed rich Bahawalpur & Cholistan places into the database.
Run: python seed_bahawalpur.py
"""
import asyncio
import uuid
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.place import Category, City, Place, PlaceImage

BAHAWALPUR_PLACES = [
    {
        "slug": "sadiq-garh-palace-ahmedpur",
        "name": "Sadiq Garh Palace (Dera Nawab Sahib)",
        "description": "Grand Italianate white marble royal palace of the Nawabs of Bahawalpur built in 1882, featuring vast courtyards, majestic domes, and royal armory halls.",
        "latitude": 29.1417,
        "longitude": 71.2611,
        "estimated_cost_min": 500,
        "estimated_cost_max": 1500,
        "average_visit_duration_minutes": 120,
        "indoor_outdoor": "both",
        "family_suitable": True,
        "activity_level": "low",
        "popularity_score": 0.94,
        "category_slug": "historical",
        "image_url": "https://lh3.googleusercontent.com/aida-public/AB6AXuDvZBrlqdFOxh97oMs6KN3mAdEIjC6fWVtlU_GVS1YhIbOfN2SZMb0hCPvKzBLhsC9u4Fc708Bh9Wa8xDowualNH7KBBY3SFAQ_rvArQxYe16INSbreRpO0GvukMvL4wLU1pMVkqRvd8GRwlL5bDUHgg5uCeKSYvxst5kpmrlbzB8Qdbhxj2Aq0a8UgYN0KRyRN2d9Xpl-x59INYC3X36hnmEhmKFkaTZ-VebeutdkYgu9f-K1zmGOY-A",
    },
    {
        "slug": "lal-suhanra-national-park",
        "name": "Lal Suhanra National Park & Lake",
        "description": "One of South Asia's largest biosphere reserves spanning desert dunes, forest wetlands, blackbuck sanctuaries, and serene boating lakes.",
        "latitude": 29.3250,
        "longitude": 71.9167,
        "estimated_cost_min": 300,
        "estimated_cost_max": 1000,
        "average_visit_duration_minutes": 180,
        "indoor_outdoor": "outdoor",
        "family_suitable": True,
        "activity_level": "moderate",
        "popularity_score": 0.92,
        "category_slug": "nature",
        "image_url": "https://lh3.googleusercontent.com/aida-public/AB6AXuBP1qU8Z8g2yYO4vLQCCobey_pLadT_F2rwGqYr54EcD93hWeJvXwJDyAjCJ-FH7ZsoBYhyib8LEWQsp4I3cnKWKwOix1Zsf8aMTFd99O0xTTY2d13KtAOwyKMfX5L_qjVzvOSEa91EorToae0ajkhkFlzlntye9IUUBKVj8wQgQoJFaEeLu021DRs3SWJVKuFYfqS4uOMEwrnsvs2S3wlPGonrPwk4pNiNQ8qAYgyQAGw_7N0U1qCTXw",
    },
    {
        "slug": "abbasi-mosque-derawar",
        "name": "Abbasi Mosque Derawar",
        "description": "Spectacular white cupola marble mosque modeled after the Moti Masjid of Delhi Red Fort, standing majestically opposite the historic Derawar Fort.",
        "latitude": 28.5867,
        "longitude": 71.3314,
        "estimated_cost_min": 0,
        "estimated_cost_max": 500,
        "average_visit_duration_minutes": 60,
        "indoor_outdoor": "both",
        "family_suitable": True,
        "activity_level": "low",
        "popularity_score": 0.95,
        "category_slug": "religious",
        "image_url": "https://lh3.googleusercontent.com/aida-public/AB6AXuCBOc5EALrmYQpIymSl20TzqjTojOcDwv-L-pc5bvHML8HX5fi5Myde-5qa3HZ3DfmA1COYDSFpjMX1lkXOzTAo8eUojKBOsPAStt5XW6SJac35UNoGR3-Ipz9KmLxOWFwebB-BgaA2I8U63BRTuBCNJRFzSJhDWZE8UHcXD9vzPxNWk76em9aihVUcdbzVrTLO7DCQVT0PDw16OxYyksUJXbPlAl5uXo9Z-c589ifWFKKyMlw-2pPuOA",
    },
    {
        "slug": "gulzar-mahal-bahawalpur",
        "name": "Gulzar Mahal & Italianate Gardens",
        "description": "Royal residence constructed in 1906 showcasing classical European-Mughal synthesis architecture with ornate chandeliers and lush royal lawns.",
        "latitude": 29.3980,
        "longitude": 71.6780,
        "estimated_cost_min": 300,
        "estimated_cost_max": 800,
        "average_visit_duration_minutes": 75,
        "indoor_outdoor": "both",
        "family_suitable": True,
        "activity_level": "low",
        "popularity_score": 0.89,
        "category_slug": "historical",
        "image_url": "https://lh3.googleusercontent.com/aida-public/AB6AXuB7b7qqErjD_RRs7SdRSRi0YRnfqXTSt7LBlgxBeJshGn7aaERQwnasGWXPAyNZUnQ3iBqY3i0dI2VgJX6q2deNMeBaiLM9sAlixHvPJBEczx2fN57h1TzLgnIPoX4wxQoEVwIN2MhHD3qzKeveXN2AHuH9NaNd5pHLUPUBG8P1dwSOdgTUA0alZCA3DfsPu7U_idfcSQCeD_CL_hD8R7IZ6SOGOiS_Ijx_PEINyzL9l6I13nWOQHwF4Q",
    },
    {
        "slug": "royal-tombs-nawabs-derawar",
        "name": "Royal Tombs of Nawabs (Derawar)",
        "description": "Sacred turquoise and lapis lazuli tiled mausoleum complex housing the royal family resting places of the princely State of Bahawalpur.",
        "latitude": 28.5880,
        "longitude": 71.3380,
        "estimated_cost_min": 200,
        "estimated_cost_max": 600,
        "average_visit_duration_minutes": 60,
        "indoor_outdoor": "both",
        "family_suitable": True,
        "activity_level": "low",
        "popularity_score": 0.91,
        "category_slug": "historical",
        "image_url": "https://lh3.googleusercontent.com/aida-public/AB6AXuDvZBrlqdFOxh97oMs6KN3mAdEIjC6fWVtlU_GVS1YhIbOfN2SZMb0hCPvKzBLhsC9u4Fc708Bh9Wa8xDowualNH7KBBY3SFAQ_rvArQxYe16INSbreRpO0GvukMvL4wLU1pMVkqRvd8GRwlL5bDUHgg5uCeKSYvxst5kpmrlbzB8Qdbhxj2Aq0a8UgYN0KRyRN2d9Xpl-x59INYC3X36hnmEhmKFkaTZ-VebeutdkYgu9f-K1zmGOY-A",
    },
    {
        "slug": "farid-gate-shahi-bazaar",
        "name": "Farid Gate & Shahi Bazaar",
        "description": "Historic gated bazaar renowned for authentic Bahawalpuri Chunri silks, embroidered khussa footwear, and famous Sohn Halwa confections.",
        "latitude": 29.3920,
        "longitude": 71.6850,
        "estimated_cost_min": 500,
        "estimated_cost_max": 2500,
        "average_visit_duration_minutes": 90,
        "indoor_outdoor": "both",
        "family_suitable": True,
        "activity_level": "moderate",
        "popularity_score": 0.93,
        "category_slug": "shopping",
        "image_url": "https://lh3.googleusercontent.com/aida-public/AB6AXuBP1qU8Z8g2yYO4vLQCCobey_pLadT_F2rwGqYr54EcD93hWeJvXwJDyAjCJ-FH7ZsoBYhyib8LEWQsp4I3cnKWKwOix1Zsf8aMTFd99O0xTTY2d13KtAOwyKMfX5L_qjVzvOSEa91EorToae0ajkhkFlzlntye9IUUBKVj8wQgQoJFaEeLu021DRs3SWJVKuFYfqS4uOMEwrnsvs2S3wlPGonrPwk4pNiNQ8qAYgyQAGw_7N0U1qCTXw",
    },
    {
        "slug": "cholistan-desert-safari-camp",
        "name": "Cholistan Desert Safari & Stargazing Camp",
        "description": "4x4 sand dune excursion into the Rohi wilderness with sunset camel rides, nomadic campfires, and pristine Bortle Class 1 desert stargazing.",
        "latitude": 28.5200,
        "longitude": 71.4000,
        "estimated_cost_min": 2500,
        "estimated_cost_max": 6000,
        "average_visit_duration_minutes": 240,
        "indoor_outdoor": "outdoor",
        "family_suitable": True,
        "activity_level": "moderate",
        "popularity_score": 0.96,
        "category_slug": "adventure",
        "image_url": "https://lh3.googleusercontent.com/aida-public/AB6AXuBP1qU8Z8g2yYO4vLQCCobey_pLadT_F2rwGqYr54EcD93hWeJvXwJDyAjCJ-FH7ZsoBYhyib8LEWQsp4I3cnKWKwOix1Zsf8aMTFd99O0xTTY2d13KtAOwyKMfX5L_qjVzvOSEa91EorToae0ajkhkFlzlntye9IUUBKVj8wQgQoJFaEeLu021DRs3SWJVKuFYfqS4uOMEwrnsvs2S3wlPGonrPwk4pNiNQ8qAYgyQAGw_7N0U1qCTXw",
    },
    {
        "slug": "bahawalpur-central-library-museum",
        "name": "Bahawalpur Museum & Central Library",
        "description": "Victorian-Gothic architectural landmark housing ancient Indus Valley relics, Cholistan ethnography, Quranic manuscripts, and coin collections.",
        "latitude": 29.3930,
        "longitude": 71.6750,
        "estimated_cost_min": 200,
        "estimated_cost_max": 500,
        "average_visit_duration_minutes": 90,
        "indoor_outdoor": "indoor",
        "family_suitable": True,
        "activity_level": "low",
        "popularity_score": 0.88,
        "category_slug": "historical",
        "image_url": "https://lh3.googleusercontent.com/aida-public/AB6AXuDvZBrlqdFOxh97oMs6KN3mAdEIjC6fWVtlU_GVS1YhIbOfN2SZMb0hCPvKzBLhsC9u4Fc708Bh9Wa8xDowualNH7KBBY3SFAQ_rvArQxYe16INSbreRpO0GvukMvL4wLU1pMVkqRvd8GRwlL5bDUHgg5uCeKSYvxst5kpmrlbzB8Qdbhxj2Aq0a8UgYN0KRyRN2d9Xpl-x59INYC3X36hnmEhmKFkaTZ-VebeutdkYgu9f-K1zmGOY-A",
    },
]


async def main():
    async with AsyncSessionLocal() as db:
        # 1. Fetch Bahawalpur city
        city_res = await db.execute(select(City).filter(City.name.ilike("%Bahawalpur%")))
        city = city_res.scalar_one_or_none()
        if not city:
            print("Bahawalpur city not found!")
            return

        # 2. Fetch categories
        cat_res = await db.execute(select(Category))
        categories = {c.slug: c.id for c in cat_res.scalars().all()}

        # 3. Add places
        added = 0
        for p in BAHAWALPUR_PLACES:
            exists = await db.execute(select(Place).filter(Place.slug == p["slug"]))
            if exists.scalar_one_or_none():
                continue

            cat_id = categories.get(p["category_slug"])
            if not cat_id:
                cat_id = list(categories.values())[0]

            place = Place(
                id=uuid.uuid4(),
                city_id=city.id,
                category_id=cat_id,
                name=p["name"],
                slug=p["slug"],
                description=p["description"],
                latitude=p["latitude"],
                longitude=p["longitude"],
                estimated_cost_min=p["estimated_cost_min"],
                estimated_cost_max=p["estimated_cost_max"],
                average_visit_duration_minutes=p["average_visit_duration_minutes"],
                indoor_outdoor=p["indoor_outdoor"],
                family_suitable=p["family_suitable"],
                activity_level=p["activity_level"],
                popularity_score=p["popularity_score"],
            )
            db.add(place)
            await db.flush()

            if p.get("image_url"):
                img = PlaceImage(
                    place_id=place.id,
                    url=p["image_url"],
                    is_primary=True,
                    caption=f"{p['name']} View",
                )
                db.add(img)

            added += 1

        await db.commit()
        print(f"Successfully seeded {added} Bahawalpur places!")


if __name__ == "__main__":
    asyncio.run(main())
