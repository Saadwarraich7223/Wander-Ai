"""Script to generate a rich, accurate dataset of 80+ top tourism destinations across Pakistan."""

import json
from pathlib import Path

def get_base_metadata():
    regions = [
        { "name": "Punjab", "slug": "punjab", "description": "The land of five rivers, rich cultural heritage, Mughal architecture, salt mines, and culinary traditions." },
        { "name": "Sindh", "slug": "sindh", "description": "Historic province home to ancient Mohenjo-daro, coastal Karachi, Sufi shrines, and Makli necropolis." },
        { "name": "Khyber Pakhtunkhwa", "slug": "khyber-pakhtunkhwa", "description": "Lush green valleys, Swat, Kumrat, Chitral, mountain passes, and ancient Gandharan civilization." },
        { "name": "Gilgit-Baltistan", "slug": "gilgit-baltistan", "description": "The crown of Pakistan: Hunza, Skardu, K2, Karakoram Highway, Fairy Meadows, and high-altitude lakes." },
        { "name": "Federal Capital", "slug": "federal-capital", "description": "Islamabad and Margalla Hills region featuring modern infrastructure, scenic trails, and cultural landmarks." },
        { "name": "Azad Jammu & Kashmir", "slug": "azad-kashmir", "description": "Neelum Valley, Rawalakot, pristine glacial lakes, Banjosa, and alpine meadows." },
        { "name": "Balochistan", "slug": "balochistan", "description": "Rugged canyons, Makran coastal highway, pristine beaches, Hingol, and ancient juniper forests." }
    ]

    cities = [
        # Punjab
        { "region_slug": "punjab", "name": "Lahore", "slug": "lahore", "latitude": 31.5204, "longitude": 74.3587, "description": "Cultural capital of Pakistan, famous for Mughal monuments, vibrant bazaars, and legendary street food.", "is_featured": True, "image_url": "https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?q=80&w=1000" },
        { "region_slug": "punjab", "name": "Multan", "slug": "multan", "latitude": 30.1575, "longitude": 71.5249, "description": "The City of Saints, known for blue pottery, ancient Sufi shrines, and mango orchards.", "is_featured": False, "image_url": "https://images.unsplash.com/photo-1627894006066-b45786637385?q=80&w=1000" },
        { "region_slug": "punjab", "name": "Bahawalpur & Cholistan", "slug": "bahawalpur", "latitude": 29.3544, "longitude": 71.6911, "description": "Princely state heritage, grand palaces, Derawar Fort, and Cholistan Desert.", "is_featured": True, "image_url": "https://images.unsplash.com/photo-1590077428593-a55bb07c4665?q=80&w=1000" },
        { "region_slug": "punjab", "name": "Murree & Galyat", "slug": "murree", "latitude": 33.9070, "longitude": 73.3943, "description": "Popular hill station with pine-covered hills, chairlifts, hiking trails, and cool mountain breezes.", "is_featured": True, "image_url": "https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1000" },
        { "region_slug": "punjab", "name": "Rawalpindi", "slug": "rawalpindi", "latitude": 33.5651, "longitude": 73.0169, "description": "Twin city of Islamabad, famous for historical bazaars, food streets, and colonial heritage.", "is_featured": False, "image_url": "https://images.unsplash.com/photo-1590077428593-a55bb07c4665?q=80&w=1000" },
        { "region_slug": "punjab", "name": "Taxila & Salt Range", "slug": "taxila-salt-range", "latitude": 32.6500, "longitude": 72.9500, "description": "Ancient Gandhara Buddhist ruins, Khewra Salt Mines, Katas Raj temples, and Rohtas Fort.", "is_featured": False, "image_url": "https://images.unsplash.com/photo-1590077428593-a55bb07c4665?q=80&w=1000" },

        # Federal Capital
        { "region_slug": "federal-capital", "name": "Islamabad", "slug": "islamabad", "latitude": 33.6844, "longitude": 73.0479, "description": "The green capital city framed by Margalla Hills National Park, modern architecture, and scenic hiking trails.", "is_featured": True, "image_url": "https://images.unsplash.com/photo-1608248597249-1978baf8286a?q=80&w=1000" },

        # Sindh
        { "region_slug": "sindh", "name": "Karachi", "slug": "karachi", "latitude": 24.8607, "longitude": 67.0011, "description": "The bustling coastal megacity, financial hub, rich heritage buildings, and vibrant Arabian Sea beaches.", "is_featured": True, "image_url": "https://images.unsplash.com/photo-1622547748225-3fc4abd2cca0?q=80&w=1000" },
        { "region_slug": "sindh", "name": "Thatta & Makli", "slug": "thatta-makli", "latitude": 24.7470, "longitude": 67.9235, "description": "UNESCO World Heritage necropolis, Mughal mosques, and Keenjhar Lake.", "is_featured": False, "image_url": "https://images.unsplash.com/photo-1590077428593-a55bb07c4665?q=80&w=1000" },
        { "region_slug": "sindh", "name": "Larkana & Mohenjo-Daro", "slug": "larkana-mohenjodaro", "latitude": 27.5330, "longitude": 68.1380, "description": "Ancient cradle of the 5,000-year-old Indus Valley Civilization.", "is_featured": True, "image_url": "https://images.unsplash.com/photo-1590077428593-a55bb07c4665?q=80&w=1000" },
        { "region_slug": "sindh", "name": "Sukkur & Khairpur", "slug": "sukkur", "latitude": 27.7052, "longitude": 68.8574, "description": "Kot Diji Fort, Sadhu Bela island temple, and historic Indus River bridges.", "is_featured": False, "image_url": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000" },
        { "region_slug": "sindh", "name": "Gorakh Hill", "slug": "gorakh-hill", "latitude": 26.8639, "longitude": 67.1517, "description": "The Murree of Sindh, elevated hill station offering cool weather and starry night skies in Dadu.", "is_featured": False, "image_url": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1000" },

        # KPK
        { "region_slug": "khyber-pakhtunkhwa", "name": "Peshawar", "slug": "peshawar", "latitude": 34.0151, "longitude": 71.5249, "description": "Historic gateway city famous for Qissa Khwani Bazaar, Namak Mandi food, and Gandharan art.", "is_featured": True, "image_url": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000" },
        { "region_slug": "khyber-pakhtunkhwa", "name": "Swat Valley", "slug": "swat", "latitude": 35.2227, "longitude": 72.4258, "description": "The Switzerland of the East with crystal rivers, Malam Jabba ski slopes, and Kalam alpine forests.", "is_featured": True, "image_url": "https://images.unsplash.com/photo-1598970434795-0c54fe7c0648?q=80&w=1000" },
        { "region_slug": "khyber-pakhtunkhwa", "name": "Kumrat Valley & Dir", "slug": "kumrat-valley", "latitude": 35.5393, "longitude": 72.2214, "description": "Untouched deodar pine forests, Jahaz Banda meadows, and high-altitude Katora Lake.", "is_featured": True, "image_url": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1000" },
        { "region_slug": "khyber-pakhtunkhwa", "name": "Naran & Kaghan", "slug": "naran", "latitude": 34.9085, "longitude": 73.6534, "description": "Glacial lakes like Saif-ul-Malook, Babusar Pass, lush Shogran meadows, and Kunhar River.", "is_featured": True, "image_url": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1000" },
        { "region_slug": "khyber-pakhtunkhwa", "name": "Chitral & Kalash", "slug": "chitral", "latitude": 35.8510, "longitude": 71.7869, "description": "Home to ancient Kalash indigenous culture, Tirich Mir peak, and Shandur Polo Ground.", "is_featured": True, "image_url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1000" },

        # Gilgit-Baltistan
        { "region_slug": "gilgit-baltistan", "name": "Hunza Valley", "slug": "hunza", "latitude": 36.3167, "longitude": 74.6500, "description": "Breathtaking valley featuring turquoise Attabad Lake, Altit & Baltit Forts, and Passu Cones.", "is_featured": True, "image_url": "https://images.unsplash.com/photo-1586016413664-864c2dd76f5c?q=80&w=1000" },
        { "region_slug": "gilgit-baltistan", "name": "Skardu & Baltistan", "slug": "skardu", "latitude": 35.2978, "longitude": 75.6337, "description": "Gateway to K2, Shangrila Resort, cold deserts, Deosai National Park, and Katpana sand dunes.", "is_featured": True, "image_url": "https://images.unsplash.com/photo-1609839335607-4bf74d75d278?q=80&w=1000" },
        { "region_slug": "gilgit-baltistan", "name": "Gilgit & Naltar", "slug": "gilgit", "latitude": 35.9208, "longitude": 74.3089, "description": "Historic Karakoram Highway hub leading to the colorful emerald waters of Naltar Valley.", "is_featured": False, "image_url": "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1000" },
        { "region_slug": "gilgit-baltistan", "name": "Ghizer & Phander", "slug": "ghizer-phander", "latitude": 36.1764, "longitude": 72.9344, "description": "The trout paradise of Pakistan with emerald Phander Lake, serene rivers, and Gupis valley.", "is_featured": False, "image_url": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1000" },
        { "region_slug": "gilgit-baltistan", "name": "Astore & Fairy Meadows", "slug": "astore-fairy-meadows", "latitude": 35.3725, "longitude": 74.8872, "description": "Dramatic base camps of Nanga Parbat, Rama Lake meadows, and Deosai plains access.", "is_featured": True, "image_url": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1000" },

        # Azad Kashmir
        { "region_slug": "azad-kashmir", "name": "Neelum Valley", "slug": "neelum-valley", "latitude": 34.5886, "longitude": 73.9066, "description": "Alpine valley with roaring rivers, dense deodar forests, Sharda Peeth, and Arang Kel village.", "is_featured": True, "image_url": "https://images.unsplash.com/photo-1609137144813-7d9921338f24?q=80&w=1000" },
        { "region_slug": "azad-kashmir", "name": "Rawalakot & Poonch", "slug": "rawalakot", "latitude": 33.8578, "longitude": 73.7604, "description": "Known as the Pearl Valley, home to picturesque Banjosa Lake and high-altitude Toli Peer.", "is_featured": False, "image_url": "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1000" },
        { "region_slug": "azad-kashmir", "name": "Muzaffarabad", "slug": "muzaffarabad", "latitude": 34.3700, "longitude": 73.4711, "description": "Capital of AJK at the confluence of Jhelum and Neelum rivers, gateway to Pir Chinasi peak.", "is_featured": False, "image_url": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1000" },

        # Balochistan
        { "region_slug": "balochistan", "name": "Gwadar & Makran Coast", "slug": "gwadar", "latitude": 25.1264, "longitude": 62.3225, "description": "Pristine Arabian Sea beaches, dramatic Hingol mud volcanoes, Princess of Hope, and Hammerhead cliff.", "is_featured": True, "image_url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1000" },
        { "region_slug": "balochistan", "name": "Ziarat", "slug": "ziarat", "latitude": 30.3824, "longitude": 67.7256, "description": "Home to the world's 2nd largest ancient juniper forest, Quaid-e-Azam Residency, and cool mountain air.", "is_featured": True, "image_url": "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1000" },
        { "region_slug": "balochistan", "name": "Quetta & Khuzdar", "slug": "quetta-khuzdar", "latitude": 30.1798, "longitude": 66.9750, "description": "Hanna Lake, Urak Valley orchards, Hazarganji park, and the magical oasis waterfalls of Moola Chotok.", "is_featured": False, "image_url": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1000" }
    ]

    categories = [
        { "name": "Historical & Heritage", "slug": "historical", "icon": "fort", "description": "Forts, palaces, ancient ruins, and Mughal heritage monuments.", "sort_order": 1 },
        { "name": "Nature & Scenery", "slug": "nature", "icon": "forest", "description": "Lakes, mountain peaks, valleys, national parks, and rivers.", "sort_order": 2 },
        { "name": "Food & Dining", "slug": "food", "icon": "restaurant", "description": "Traditional street food, Karahi spots, tea houses, and regional dishes.", "sort_order": 3 },
        { "name": "Adventure & Outdoors", "slug": "adventure", "icon": "hiking", "description": "Trekking, hiking, skiing, rafting, and jeep safaris.", "sort_order": 4 },
        { "name": "Religious & Cultural", "slug": "religious", "icon": "church", "description": "Sufi shrines, historic mosques, Buddhist stupas, and Sikh gurdwaras.", "sort_order": 5 },
        { "name": "Shopping & Bazaars", "slug": "shopping", "icon": "shopping_bag", "description": "Traditional bazaars, handicrafts, carpet markets, and spice souks.", "sort_order": 6 }
    ]

    tags = [
        { "name": "Mughal Heritage", "slug": "mughal" },
        { "name": "UNESCO Heritage", "slug": "unesco" },
        { "name": "Family Friendly", "slug": "family-friendly" },
        { "name": "Street Food & Cuisine", "slug": "street-food" },
        { "name": "Hiking Trail", "slug": "hiking-trail" },
        { "name": "Alpine Lake", "slug": "alpine-lake" },
        { "name": "Sufi Shrine", "slug": "sufi-shrine" },
        { "name": "Photography Point", "slug": "photography" },
        { "name": "High Altitude", "slug": "high-altitude" },
        { "name": "Historical Fort", "slug": "historical-fort" },
        { "name": "Boating & Water Sports", "slug": "boating" },
        { "name": "Skiing & Snow", "slug": "skiing" },
        { "name": "Beach & Coast", "slug": "beach" },
        { "name": "Camping & Outdoors", "slug": "camping" },
        { "name": "Ancient Civilization", "slug": "ancient-civilization" },
        { "name": "Desert Safari", "slug": "desert-safari" },
        { "name": "River & Waterfall", "slug": "river-waterfall" },
        { "name": "Religious Site", "slug": "religious" },
        { "name": "Adventure Sports", "slug": "adventure" },
        { "name": "Shopping & Souvenirs", "slug": "shopping" },
        { "name": "Heritage & Culture", "slug": "heritage" }
    ]

    return regions, cities, categories, tags

def run():
    from generate_places import generate_all_places
    from additional_places import get_additional_places
    regions, cities, categories, tags = get_base_metadata()
    places = generate_all_places()
    
    existing_slugs = {p["slug"] for p in places}
    for p in get_additional_places():
        if p["slug"] not in existing_slugs:
            places.append(p)
            existing_slugs.add(p["slug"])

    valid_cities = {c["slug"] for c in cities}
    valid_categories = {c["slug"] for c in categories}
    valid_tags = {t["slug"] for t in tags}

    for p in places:
        assert p["city_slug"] in valid_cities, f"Invalid city_slug in {p['name']}: {p['city_slug']}"
        assert p["category_slug"] in valid_categories, f"Invalid category_slug in {p['name']}: {p['category_slug']}"
        for t in p["tag_slugs"]:
            assert t in valid_tags, f"Invalid tag_slug in {p['name']}: {t}"

    dataset = {
        "regions": regions,
        "cities": cities,
        "categories": categories,
        "tags": tags,
        "places": places
    }

    out_path = Path(__file__).resolve().parent / "raw" / "pakistan_places.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(dataset, f, indent=2, ensure_ascii=False)

    print(f"SUCCESS: Exported {len(places)} places across {len(cities)} cities and {len(regions)} regions into {out_path}")

if __name__ == "__main__":
    run()
