import urllib.request
import urllib.parse
import json

def get_wikipedia_image(query):
    """Fetch high-res image URL from Wikipedia/Wikimedia for a given search query."""
    try:
        # Search page title
        search_url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={urllib.parse.quote(query)}&format=json"
        req = urllib.request.Request(search_url, headers={'User-Agent': 'TourismSaas/1.0 (contact@tourism.pk)'})
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            search_results = data.get('query', {}).get('search', [])
            if not search_results:
                return None
            title = search_results[0]['title']

        # Get page image
        img_url = f"https://en.wikipedia.org/w/api.php?action=query&titles={urllib.parse.quote(title)}&prop=pageimages&piprop=original|thumbnail&pithumbsize=1200&format=json"
        req_img = urllib.request.Request(img_url, headers={'User-Agent': 'TourismSaas/1.0 (contact@tourism.pk)'})
        with urllib.request.urlopen(req_img) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            pages = data.get('query', {}).get('pages', {})
            for page_id, page_data in pages.items():
                if 'original' in page_data:
                    return page_data['original']['source']
                elif 'thumbnail' in page_data:
                    return page_data['thumbnail']['source']
    except Exception as e:
        print(f"Error fetching image for {query}: {e}")
    return None

if __name__ == "__main__":
    test_queries = [
        "Badshahi Mosque Lahore",
        "Faisal Mosque Islamabad",
        "Baltit Fort Hunza",
        "Attabad Lake",
        "Passu Cones",
        "Lake Saif ul Malook",
        "Mohenjo-daro",
        "Malam Jabba",
        "Derawar Fort",
        "Rohtas Fort",
    ]
    for q in test_queries:
        img = get_wikipedia_image(q)
        print(f"Query: {q}\nImage: {img}\n")
