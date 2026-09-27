# 🧠 WanderAI — Master Project Context & Knowledge Base

> **Primary Audience**: AI Agents (Antigravity, Cursor, Copilot, Claude, Gemini) and Human Engineers.  
> **Purpose**: Provides immediate, full-scope context on project domain, tech stack, database schemas, API architecture, frontend components, algorithms, caching mechanics, and design standards.

---

## 1. Project Overview

**WanderAI** (`Tourism-Saas`) is a specialized travel SaaS & intelligence platform built specifically for tourism across Pakistan. It combines spatial GIS exploration, constraint-aware multi-day itinerary synthesis, live highway/pass corridor status tracking, a 5-tier recommendation engine, and an interactive tool-calling AI assistant powered by Google Gemini.

### Core Domain Capabilities:
1. **Curated POI Knowledge Base**: 141+ verified high-fidelity destinations across Pakistan (Gilgit-Baltistan, KPK, Punjab, Sindh, Balochistan, AJK) with geo-coordinates, altitude, seasonality, activity pacing, family suitability, and ticket/cost metrics in PKR.
2. **Corridor & Pass Passability**: Real-time road status matrices for critical mountain highways (KKH, Babusar Top, Lowari Tunnel, Deosai Plateau, Makran Coastal N10).
3. **5-Model Recommendation Engine**: From cold-start baseline popularity to collaborative filtering and pgvector/Gemini RAG semantic re-ranking.
4. **Interactive Itinerary Engine**: Synthesizes day-by-day travel blueprints with realistic travel transit times, opening hours, cost estimates, and altitude acclimatization rules.
5. **SEO & Spatial Engine**: Semantic URL slugs (`/places/[slug]`), Schema.org JSON-LD (TouristAttraction, FAQPage, BreadcrumbList), and PostGIS spatial distance queries.
6. **Sub-Millisecond Read Performance**: Dual-tier caching (Backend `MemoryCache` with pre-warming + Frontend persistent `sessionStorage` stale-while-revalidate).

---

## 2. Directory Map & Repository Layout

```
e:\Tourism-Saas/
├── backend/
│   ├── app/
│   │   ├── api/v1/
│   │   │   ├── auth.py              # JWT authentication (login, register, refresh, me)
│   │   │   ├── categories.py        # Categories listing with MemoryCache
│   │   │   ├── cities.py            # Cities & regions listing with MemoryCache & joinedload
│   │   │   ├── places.py            # Places listing, search, nearby, detail (slug/UUID), admin CRUD
│   │   │   ├── trips.py             # User trips, day schedules, stops, check-ins, expenses
│   │   │   ├── itineraries.py       # Curated blueprints & public itinerary discovery
│   │   │   ├── recommendations.py   # Multi-model recommendations (Models A-E)
│   │   │   ├── ai.py                # Gemini tool-calling assistant & chat
│   │   │   ├── weather.py           # Weather forecasts & seasonal conditions
│   │   │   ├── admin.py             # Admin metrics & analytics
│   │   │   ├── interactions.py      # User interaction logging (save, view, rate, bookmark)
│   │   │   └── router.py            # Unified v1 API router assembly
│   │   ├── core/
│   │   │   ├── config.py            # Pydantic v2 settings (env parsing, CORS, JWT secrets)
│   │   │   ├── database.py          # SQLAlchemy async engine, AsyncSessionLocal, get_db
│   │   │   ├── security.py          # Password hashing (bcrypt) & JWT token creation/decoding
│   │   │   ├── dependencies.py      # Auth dependencies (get_current_user, get_current_admin)
│   │   │   └── cache.py             # Async lock-safe MemoryCache with TTL & invalidation
│   │   ├── models/
│   │   │   ├── base.py              # DeclarativeBase with UUID primary keys & timestamps
│   │   │   ├── user.py              # User model (roles: user, admin)
│   │   │   ├── place.py             # Place, City, Region, Category, Tag, PlaceImage, PlaceTag
│   │   │   ├── trip.py              # Trip, TripDay, TripItem (stops), Expense
│   │   │   ├── interaction.py       # User interaction logs for ML training
│   │   │   ├── itinerary.py         # Curated itinerary blueprints
│   │   │   └── embedding.py         # PlaceEmbedding for pgvector vector similarity
│   │   ├── schemas/                 # Pydantic v2 validation models for all requests/responses
│   │   ├── services/
│   │   │   ├── itinerary_service.py # Constraint-aware heuristic itinerary generator
│   │   │   ├── recommendation_service.py # Models A-E implementation
│   │   │   ├── rag_service.py       # pgvector search + Gemini contextual generator
│   │   │   ├── weather_service.py   # Live & forecasted weather client
│   │   │   └── spatial_service.py   # PostGIS spatial helper queries
│   │   └── main.py                  # FastAPI app instance, CORS middleware, lifespan pre-warmer
│   ├── alembic/                     # Database migrations
│   ├── tests/                       # Pytest test suite covering API endpoints and services
│   └── requirements.txt             # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx             # Homepage: Hero, Live Corridors, Curated Places, FAQs
│   │   │   ├── places/
│   │   │   │   ├── page.tsx         # Places catalog: filtering, search, sorting, region tabs
│   │   │   │   └── [slug]/page.tsx  # Dynamic Place Detail: SEO metadata, galleries, weather, tags
│   │   │   ├── itineraries/
│   │   │   │   ├── page.tsx         # Curated Itineraries catalog & filter hub
│   │   │   │   └── [id]/page.tsx    # Interactive Itinerary Blueprint (collapsible days, map route)
│   │   │   ├── planner/page.tsx     # Custom AI trip generator form & real-time synthesis
│   │   │   ├── explore/page.tsx     # Fullscreen Mapbox spatial discovery & POI markers
│   │   │   ├── trips/page.tsx       # User saved trips dashboard, budget tracker, check-ins
│   │   │   ├── login/page.tsx       # Auth login page
│   │   │   ├── register/page.tsx    # Auth registration page
│   │   │   ├── sitemap.ts           # Dynamic XML sitemap generator
│   │   │   ├── robots.ts            # Dynamic robots.txt generator
│   │   │   └── layout.tsx           # Root layout: fonts, global styles, theme providers
│   │   ├── components/
│   │   │   ├── Navbar.tsx           # Global navigation with mobile drawer & active states
│   │   │   ├── Footer.tsx           # Unified brand footer with SEO links
│   │   │   ├── PlaceCard.tsx        # Responsive place card with badges, cost, image prefetch
│   │   │   ├── StructuredData.tsx   # JSON-LD Schema.org injector for search engines
│   │   │   └── MapboxView.tsx       # Mapbox GL JS wrapper for interactive GIS maps
│   │   ├── lib/
│   │   │   ├── api.ts               # Axios client, JWT interceptor, persistent sessionStorage cache
│   │   │   └── auth.ts              # LocalStorage auth tokens manager
│   │   └── types/                   # TypeScript interfaces matching backend schemas
│   └── package.json                 # Frontend dependencies
├── data/                            # Verified destination datasets (JSON)
├── ml/                              # Offline recommendation experiments & notebooks
└── .env.example                     # Example environment variables
```

---

## 3. Database & Entity Relationships

The primary database is **PostgreSQL 16** with **PostGIS 3.4** and **pgvector** extensions enabled (deployed on Neon Cloud Pooler in production):

### Key Entities:
1. **`User`**: `id` (UUID), `email`, `hashed_password`, `full_name`, `role` (`user` | `admin`), `preferences` (JSONB).
2. **`Region` & `City`**:
   - `Region`: `id`, `name` (e.g. Gilgit-Baltistan, Khyber Pakhtunkhwa), `slug`.
   - `City`: `id`, `region_id`, `name`, `slug`, `latitude`, `longitude`, `elevation_meters`.
3. **`Place`**:
   - `id` (UUID), `slug` (unique semantic string), `name`, `name_ur` (Urdu), `description`, `city_id`, `category_id`.
   - `latitude`, `longitude`, `geom` (PostGIS `Geography(POINT, 4326)`).
   - `estimated_cost_min`, `estimated_cost_max` (PKR), `average_visit_duration_minutes`, `popularity_score` (0.0 to 1.0).
   - `indoor_outdoor` (`indoor` | `outdoor` | `both`), `family_suitable` (bool), `activity_level` (`low` | `moderate` | `high`).
   - `opening_hours` (JSONB), `seasonality` (JSONB), `historical_significance`, `food_relevance`.
4. **`PlaceImage`**: `id`, `place_id`, `url`, `caption`, `is_primary` (bool), `sort_order`.
5. **`Tag` & `PlaceTag`**: Many-to-many relationship linking places to semantic tags (e.g., `#Heritage`, `#HighAltitude`, `#AlpineGlacier`).
6. **`Trip`, `TripDay`, `TripItem`, `Expense`**:
   - `Trip`: `id`, `user_id`, `title`, `start_date`, `end_date`, `status` (`planning` | `active` | `completed`).
   - `TripDay`: `id`, `trip_id`, `day_number`, `date`, `summary_notes`.
   - `TripItem`: `id`, `trip_day_id`, `place_id`, `sort_order`, `arrival_time`, `departure_time`, `is_visited` (bool).
   - `Expense`: `id`, `trip_id`, `day_number`, `category` (`transport` | `food` | `stay` | `tickets` | `misc`), `amount` (PKR).
7. **`Interaction`**: `id`, `user_id`, `place_id`, `interaction_type` (`view` | `save` | `click` | `rate`), `rating`, `created_at`.
8. **`PlaceEmbedding`**: `place_id`, `embedding` (`vector(768)` or `vector(1536)`).

---

## 4. Caching & Performance Architecture

Due to remote database hosting on AWS/Neon Singapore, optimizing network round-trips was critical. We implemented a **multi-tiered caching architecture**:

### Backend In-Memory Cache ([`backend/app/core/cache.py`](file:///e:/Tourism-Saas/backend/app/core/cache.py)):
- **Class `MemoryCache`**: Thread/async-safe dictionary cache with TTL and double-checked asyncio locking.
- **Global Instances**:
  - `places_cache` (TTL: 10 minutes)
  - `cities_cache` (TTL: 30 minutes)
  - `categories_cache` (TTL: 30 minutes)
  - `weather_cache` (TTL: 5 minutes)
- **Startup Pre-Warming**: Inside `lifespan` in [`main.py`](file:///e:/Tourism-Saas/backend/app/main.py), an async task automatically pre-fetches and caches all 300 places, cities, and categories so the very first incoming request executes in `<0.05ms`.
- **Query Optimization**: Replaced sequential queries with `joinedload(Place.category)` and `joinedload(City.region)` to execute single-pass SQL joins.
- **Cache Invalidation**: Calling `create_place`, `update_place`, or `delete_place` automatically triggers `places_cache.clear()`.

### Frontend Persistent Cache ([`frontend/src/lib/api.ts`](file:///e:/Tourism-Saas/frontend/src/lib/api.ts)):
- In-memory `Map` with automatic fallback to `window.sessionStorage` with key prefix `wander_cache_`.
- Synchronous retrieval methods: `placesApi.getCachedPlacesList()`, `placesApi.getCachedCities()`, `placesApi.getCachedCategories()`.
- **0ms Initial Paint**: Pages (`/places`, `/`, `/itineraries`) initialize state from session cache immediately on mount, eliminating skeleton loading wait times.

---

## 5. Recommendation Engine Architecture

Implemented in [`backend/app/services/recommendation_service.py`](file:///e:/Tourism-Saas/backend/app/services/recommendation_service.py):

1. **Model A (Baseline Popularity)**:
   - Weights `popularity_score` with regional popularity density and category preferences.
2. **Model B (Content-Based TF-IDF)**:
   - Constructs destination feature documents from descriptions, tags, seasonality, and terrain.
   - Computes cosine similarity against user’s historical saved/viewed interaction vector.
3. **Model C (Collaborative Filtering)**:
   - Matrix factorization (TruncatedSVD / ALS) over the user-place interaction matrix (implicit ratings from saves, views, and duration).
4. **Model D (Hybrid Ensemble)**:
   - Fuses Model B (content score) and Model C (collaborative score) with a configurable weighting parameter $\alpha$:
     $$\text{Score}(u, p) = \alpha \cdot \text{Content}(u, p) + (1 - \alpha) \cdot \text{Collab}(u, p)$$
5. **Model E (RAG Contextual Re-Ranking)**:
   - Embeds user query/profile via Gemini embeddings, performs HNSW cosine search in `pgvector`, and passes top candidate documents to Gemini LLM with system prompt instructions to score candidates on seasonal suitability and pacing.

---

## 6. Itinerary Heuristic Optimizer

Implemented in [`backend/app/services/itinerary_service.py`](file:///e:/Tourism-Saas/backend/app/services/itinerary_service.py):
- **Inputs**: Destination city/region, duration (days), pacing (`relaxed` = 2-3 stops/day, `moderate` = 3-4 stops/day, `packed` = 5+ stops/day), budget limit (PKR), travel interests.
- **Constraints Handled**:
  - Distance & Travel Time: Uses Haversine/OSRM travel matrix to cluster nearby POIs within the same day to minimize transit fatigue.
  - Altitude Safety: Restricts sudden elevation jumps (e.g. Islamabad 500m to Deosai 4,000m on Day 1 requires intermediate acclimation stop in Skardu or Chilas).
  - Opening Hours & Daylight: Places outdoor photography viewpoints during golden hours (e.g., Passu Cones, Attabad Lake) and indoor cultural sites during midday.
  - Budget Tracking: Aggregates ticket entries, daily food allowances, and 4x4 mountain jeep costs into a transparent PKR budget breakdown.

---

## 7. Common Development Commands

### Backend:
```bash
# Activate virtual environment
source backend/venv/bin/activate  # or backend\venv\Scripts\activate on Windows

# Run Dev Server
uvicorn app.main:app --reload --port 8000

# Run Tests
pytest backend/tests/ -v

# Generate Migration
alembic revision --autogenerate -m "description"

# Apply Migrations
alembic upgrade head
```

### Frontend:
```bash
cd frontend

# Run Dev Server
npm run dev

# Typecheck
npx tsc --noEmit

# Production Build
npm run build
```

---

## 8. Critical Guidelines for Future AI Agents

1. **Do Not Introduce Regressions in Fast Path Reads**: Always preserve the `MemoryCache` and `joinedload` optimizations in `places.py`, `cities.py`, and `categories.py`.
2. **Preserve SEO Semantic Slugs**: Place routes must support both semantic slugs (e.g., `hunza-valley`) and fallback UUID lookups.
3. **Follow Design System**: Review [`DESIGN.md`](DESIGN.md) for color tokens, typography (`Inter` and `Plus Jakarta Sans`), glassmorphism cards, and dark theme consistency.
4. **Environment Variables**: Never hardcode API keys or database URLs. Always rely on `app.core.config.settings` (backend) or `process.env.NEXT_PUBLIC_*` (frontend).
