"""
Script to seed additional places for Lahore, Skardu, Swat, Islamabad, and Karachi into dev SQLite database.
Run: python seed_more_places.py
"""
import asyncio
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.models.place import Category, City, Place, PlaceImage


ADDITIONAL_PLACES = [
    # LAHORE
    {
        "city_slug": "lahore",
        "slug": "lahore-fort-shahi-qila",
        "name": "Lahore Fort (Shahi Qila)",
        "description": "Citadel in the city of Lahore, Punjab. The fortress includes Sheesh Mahal, Alamgiri Gate, Naulakha Pavilion, and Moti Masjid.",
        "latitude": 31.5898,
        "longitude": 74.3148,
        "estimated_cost_min": 500,
        "estimated_cost_max": 1500,
        "average_visit_duration_minutes": 150,
        "indoor_outdoor": "both",
        "family_suitable": True,
        "activity_level": "low",
        "popularity_score": 0.98,
        "category_slug": "heritage",
        "image_url": "https://lh3.googleusercontent.com/aida-public/AB6AXuDvZBrlqdFOxh97oMs6KN3mAdEIjC6fWVtlU_GVS1YhIbOfN2SZMb0hCPvKzBLhsC9u4Fc708Bh9Wa8xDowualNH7KBBY3SFAQ_rvArQxYe16INSbreRpO0GvukMvL4wLU1pMVkqRvd8GRwlL5bDUHgg5uCeKSYvxst5kpmrlbzB8Qdbhxj2Aq0a8UgYN0KRyRN2d9Xpl-x59INYC3X36hnmEhmKFkaTZ-VebeutdkYgu9f-K1zmGOY-A",
    },
    {
        "city_slug": "lahore",
        "slug": "shalamar-gardens",
        "name": "Shalamar Gardens",
        "description": "Mughal garden complex laid out by Emperor Shah Jahan in 1641 AD, featuring 410 fountains and cascading marble terraces.",
        "latitude": 31.5857,
        "longitude": 74.3824,
        "estimated_cost_min": 300,
        "estimated_cost_max": 800,
        "average_visit_duration_minutes": 120,
        "indoor_outdoor": "outdoor",
        "family_suitable": True,
        "activity_level": "low",
        "popularity_score": 0.93,
        "category_slug": "heritage",
        "image_url": "https://lh3.googleusercontent.com/aida-public/AB6AXuCBOc5EALrmYQpIymSl20TzqjTojOcDwv-L-pc5bvHML8HX5fi5Myde-5qa3HZ3DfmA1COYDSFpjMX1lkXOzTAo8eUojKBOsPAStt5XW6SJac35UNoGR3-Ipz9KmLxOWFwebB-BgaA2I8U63BRTuBCNJRFzSJhDWZE8UHcXD9vzPxNWk76em9aihVUcdbzVrTLO7DCQVT0PDw16OxYyksUJXbPlAl5uXo9Z-c589ifWFKKyMlw-2pPuOA",
    },
    {
        "city_slug": "lahore",
        "slug": "haveli-restaurant-fort-road",
        "name": "Haveli Restaurant (Fort Road)",
        "description": "Rooftop heritage dining with unobstructed views of the illuminated Badshahi Mosque and Lahori traditional barbecue.",
        "latitude": 31.5886,
        "longitude": 74.3121,
        "estimated_cost_min": 1500,
        "estimated_cost_max": 3500,
        "average_visit_duration_minutes": 90,
        "indoor_outdoor": "indoor",
        "family_suitable": True,
        "activity_level": "low",
        "popularity_score": 0.96,
        "category_slug": "food",
        "image_url": "https://lh3.googleusercontent.com/aida-public/AB6AXuB7b7qqErjD_RRs7SdRSRi0YRnfqXTSt7LBlgxBeJshGn7aaERQwnasGWXPAyNZUnQ3iBqY3i0dI2VgJX6q2deNMeBaiLM9sAlixHvPJBEczx2fN57h1TzLgnIPoX4wxQoEVwIN2MhHD3qzKeveXN2AHuH9NaNd5pHLUPUBG8P1dwSOdgTUA0alZCA3DfsPu7U_idfcSQCeD_CL_hD8R7IZ6SOGOiS_Ijx_PEINyzL9l6I13nWOQHwF4Q",
    },
    {
        "city_slug": "lahore",
        "slug": "anarkali-bazaar",
        "name": "Anarkali Bazaar & Food Street",
        "description": "One of the oldest surviving markets in South Asia, famed for traditional silks, handicrafts, and spicy Lahori street food.",
        "latitude": 31.5658,
        "longitude": 74.3128,
        "estimated_cost_min": 500,
        "estimated_cost_max": 2500,
        "average_visit_duration_minutes": 120,
        "indoor_outdoor": "both",
        "family_suitable": True,
        "activity_level": "moderate",
        "popularity_score": 0.90,
        "category_slug": "shopping",
        "image_url": "https://lh3.googleusercontent.com/aida-public/AB6AXuBP1qU8Z8g2yYO4vLQCCobey_pLadT_F2rwGqYr54EcD93hWeJvXwJDyAjCJ-FH7ZsoBYhyib8LEWQsp4I3cnKWKwOix1Zsf8aMTFd99O0xTTY2d13KtAOwyKMfX5L_qjVzvOSEa91EorToae0ajkhkFlzlntye9IUUBKVj8wQgQoJFaEeLu021DRs3SWJVKuFYfqS4uOMEwrnsvs2S3wlPGonrPwk4pNiNQ8qAYgyQAGw_7N0U1qCTXw",
    },

    # ISLAMABAD
    {
        "city_slug": "islamabad",
        "slug": "monal-restaurant-pir-sohawa",
        "name": "Monal Restaurant & Pir Sohawa",
        "description": "Perched 1,173 meters high in the Margalla Hills offering sweeping sunset views over the capital city and authentic Pakistani cuisine.",
        "latitude": 33.7483,
        "longitude": 73.0617,
        "estimated_cost_min": 1800,
        "estimated_cost_max": 4000,
        "average_visit_duration_minutes": 120,
        "indoor_outdoor": "both",
        "family_suitable": True,
        "activity_level": "low",
        "popularity_score": 0.97,
        "category_slug": "food",
        "image_url": "https://lh3.googleusercontent.com/aida-public/AB6AXuAWdJxoveK_H6uwkP3ot7DcaRKbqeOJ6BoxzNznXnwpHKzj--2DlmjfqMoXxwkaW6lrZw9FJZOcAwTZExdlkGwZGYaqQXEGVh0aC5OXxvKhsFXi6sXTrwdBuTf3fqrOZuNZ3oG7qzKtsARLirSeISv53b-a7po5yytGQD9fvkwsyAT5aX-Zr0jV0xvafugoq8BFg1DFnwVfsm67AI97Hn0ACohxtRT9ou2p0CdrNhokoL9Wf8JaqrDZYA",
    },
    {
        "city_slug": "islamabad",
        "slug": "daman-e-koh-viewpoint",
        "name": "Daman-e-Koh Hilltop Garden",
        "description": "Hilltop garden and panoramic viewpoint situated in the middle of the Margalla Hills with views of Rawal Lake and Faisal Mosque.",
        "latitude": 33.7388,
        "longitude": 73.0565,
        "estimated_cost_min": 200,
        "estimated_cost_max": 500,
        "average_visit_duration_minutes": 90,
        "indoor_outdoor": "outdoor",
        "family_suitable": True,
        "activity_level": "low",
        "popularity_score": 0.92,
        "category_slug": "nature",
        "image_url": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1000&auto=format&fit=crop",
    },
    {
        "city_slug": "islamabad",
        "slug": "lok-virsa-heritage-museum",
        "name": "Lok Virsa Cultural Heritage Museum",
        "description": "National museum displaying the living cultural traditions, folk art, music, and ethnic architecture of all provinces of Pakistan.",
        "latitude": 33.6933,
        "longitude": 73.0683,
        "estimated_cost_min": 500,
        "estimated_cost_max": 1000,
        "average_visit_duration_minutes": 120,
        "indoor_outdoor": "indoor",
        "family_suitable": True,
        "activity_level": "low",
        "popularity_score": 0.89,
        "category_slug": "heritage",
        "image_url": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=1200&auto=format&fit=crop",
    },

    # SKARDU
    {
        "city_slug": "skardu",
        "slug": "shangrila-lower-kachura-lake",
        "name": "Shangrila Resort & Lower Kachura Lake",
        "description": "Famous heart-shaped glacial lake surrounded by red pagoda cottages and fruit orchards in Baltistan.",
        "latitude": 35.4215,
        "longitude": 75.4412,
        "estimated_cost_min": 1000,
        "estimated_cost_max": 3000,
        "average_visit_duration_minutes": 150,
        "indoor_outdoor": "outdoor",
        "family_suitable": True,
        "activity_level": "low",
        "popularity_score": 0.97,
        "category_slug": "nature",
        "image_url": "https://lh3.googleusercontent.com/aida-public/AB6AXuB8oU4AY82kHH1ALHhXPtqQ-fRcr0VC4DPRUaV7_rBsoAv780fjGuIfOwvwRT-RL_mpjmsrWRXNJ5Uz75jHpnMpy4kpxZm4J_59F4AAscOeV0pUQaW2znpFW5gLcV2fBKH5qhyslfTME9i6O8XfTE1NGGe8fbq-j8x6JZCeDxNoBMjFFkog6XnXdN6XGj0A3KJ--_YcoaSKLpiuArSb1tt3nKHO28BX9rTxw8a6WtoNjdvrqdirDQxNlw",
    },
    {
        "city_slug": "skardu",
        "slug": "katpana-cold-desert",
        "name": "Katpana Cold Desert Sand Dunes",
        "description": "One of the highest cold deserts in the world at 2,228 meters, featuring white sand dunes against snow-capped Himalayan peaks.",
        "latitude": 35.3120,
        "longitude": 75.6150,
        "estimated_cost_min": 500,
        "estimated_cost_max": 1500,
        "average_visit_duration_minutes": 120,
        "indoor_outdoor": "outdoor",
        "family_suitable": True,
        "activity_level": "moderate",
        "popularity_score": 0.94,
        "category_slug": "nature",
        "image_url": "https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1000&auto=format&fit=crop",
    },
    {
        "city_slug": "skardu",
        "slug": "shigar-fort-residence",
        "name": "Shigar Fort Palace (Fong-Khar)",
        "description": "17th-century Raja's palace built on a massive rock in Shigar Valley, meticulously restored into a heritage stay and museum.",
        "latitude": 35.4298,
        "longitude": 75.7420,
        "estimated_cost_min": 1200,
        "estimated_cost_max": 2500,
        "average_visit_duration_minutes": 120,
        "indoor_outdoor": "both",
        "family_suitable": True,
        "activity_level": "low",
        "popularity_score": 0.92,
        "category_slug": "heritage",
        "image_url": "https://images.unsplash.com/photo-1627894098906-74045f29910d?q=80&w=1200&auto=format&fit=crop",
    },

    # SWAT
    {
        "city_slug": "swat",
        "slug": "malam-jabba-ski-resort",
        "name": "Malam Jabba Alpine Ski Resort",
        "description": "Hill station and ski resort in the Hindu Kush mountain range featuring chairlifts, zip-lining, and pine forest trails.",
        "latitude": 34.7989,
        "longitude": 72.5714,
        "estimated_cost_min": 1000,
        "estimated_cost_max": 3000,
        "average_visit_duration_minutes": 180,
        "indoor_outdoor": "outdoor",
        "family_suitable": True,
        "activity_level": "moderate",
        "popularity_score": 0.94,
        "category_slug": "adventure",
        "image_url": "https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?q=80&w=1200&auto=format&fit=crop",
    },
    {
        "city_slug": "swat",
        "slug": "mahodand-lake-kalam",
        "name": "Mahodand Alpine Lake & Ushu Forest",
        "description": "High elevation lake surrounded by thick pine forests, cedar groves, and snow-fed trout streams at 2,865m.",
        "latitude": 35.7142,
        "longitude": 72.6418,
        "estimated_cost_min": 1500,
        "estimated_cost_max": 4000,
        "average_visit_duration_minutes": 240,
        "indoor_outdoor": "outdoor",
        "family_suitable": True,
        "activity_level": "moderate",
        "popularity_score": 0.95,
        "category_slug": "nature",
        "image_url": "https://lh3.googleusercontent.com/aida-public/AB6AXuB1KbJ6I1GLzPJdpsxccoVM2r48480LGLmJy-kF903JcJXZP0Yw8xNGIstfzyk7qKVnCz5hC_RspGe0lqRTLk22uDCUHTV-nIQ2njEzSDg_CvRtWv1Dtx8TozVg6zI2SNlDIm5SQU5w2EHeLfafMrOWyZqcoLhuqXWzf_ULrn2WX_4bj2DAWpAsVvlck9U6LhQfiDzGZzNsq5Vc9_pBPixqQ7rfbD32vwvwvfkFcwou0vzSLktH7Gumyg",
    },
]


async def seed_more_places():
    async with AsyncSessionLocal() as session:
        print("[SEED] Seeding additional places into dev.db...")
        
        # Load existing cities and categories
        city_stmt = select(City)
        cities_res = await session.execute(city_stmt)
        city_map = {c.slug: c.id for c in cities_res.scalars().all()}
        
        cat_stmt = select(Category)
        cat_res = await session.execute(cat_stmt)
        cat_map = {c.slug: c.id for c in cat_res.scalars().all()}
        
        added_count = 0
        for item in ADDITIONAL_PLACES:
            city_id = city_map.get(item["city_slug"])
            cat_id = cat_map.get(item["category_slug"])
            
            if not city_id or not cat_id:
                print(f"[SKIP] Skipping {item['name']}: city {item['city_slug']} or cat {item['category_slug']} not found.")
                continue
            
            # Check if exists
            stmt = select(Place).where(Place.slug == item["slug"])
            res = await session.execute(stmt)
            existing = res.scalar_one_or_none()
            
            if not existing:
                place_id = uuid.uuid4()
                place = Place(
                    id=place_id,
                    city_id=city_id,
                    category_id=cat_id,
                    slug=item["slug"],
                    name=item["name"],
                    description=item["description"],
                    latitude=item["latitude"],
                    longitude=item["longitude"],
                    estimated_cost_min=item["estimated_cost_min"],
                    estimated_cost_max=item["estimated_cost_max"],
                    average_visit_duration_minutes=item["average_visit_duration_minutes"],
                    indoor_outdoor=item["indoor_outdoor"],
                    family_suitable=item["family_suitable"],
                    activity_level=item["activity_level"],
                    popularity_score=item["popularity_score"],
                )
                session.add(place)
                
                # Add primary image
                place_img = PlaceImage(
                    id=uuid.uuid4(),
                    place_id=place_id,
                    url=item["image_url"],
                    caption=item["name"],
                    is_primary=True,
                )
                session.add(place_img)
                added_count += 1
                print(f"  + Added place: {item['name']} ({item['city_slug']})")

        await session.commit()
        print(f"[SUCCESS] Successfully seeded places into dev.db!\n")


if __name__ == "__main__":
    asyncio.run(seed_more_places())
