# 🏗️ WanderAI — System Architecture & Technical Specifications

> **Target Audience**: Backend Engineers, Systems Architects, and AI Agents.  
> **Key Domains**: FastAPI Async I/O, PostgreSQL/PostGIS/pgvector, ML Recommender Pipelines, Greedy Heuristic Optimization, Real-Time Lifespan Caching.

---

## 1. High-Level Data Flow

```
[Browser / Mobile Client]
       │ (HTTPS / JSON)
       ▼
[Next.js 15 App Router] (SSR / Persistent Client Cache / Mapbox GL)
       │
       ▼ (REST API /api/v1)
[FastAPI Async Server]
       │
       ├──► [MemoryCache Layer] (0.01ms TTL Lock-Safe In-Memory Caching)
       │         ▲
       │         └── Startup Pre-Warming Task (Lifespan Hook)
       │
       ├──► [Services Engine]
       │         ├── recommendation_service.py (Models A, B, C, D, E)
       │         ├── itinerary_service.py      (Heuristic Constraint Planner)
       │         ├── rag_service.py            (pgvector + Gemini 1.5/2.0)
       │         └── weather_service.py        (OpenWeatherMap + Forecast Caching)
       │
       └──► [Asyncpg Database Pool]
                 ▼
       [PostgreSQL 16 Engine]
           ├── PostGIS 3.4 (ST_DWithin, ST_Distance, GIST Indexes)
           ├── pgvector    (HNSW Cosine Vector Embeddings)
           └── Relational  (Places, Cities, Trips, Tags, Expenses, Users)
```

---

## 2. Recommendation Engine (5-Model Suite)

Located in `backend/app/services/recommendation_service.py`:

```
┌──────────────────────────────────────────────────────────────┐
│                    User Request / Query                      │
└──────────────────────────────┬───────────────────────────────┘
                               │
       ┌───────────────────────┼────────────────────────┐
       ▼                       ▼                        ▼
┌──────────────┐       ┌──────────────┐         ┌──────────────┐
│   Model A    │       │   Model B    │         │   Model C    │
│  Popularity  │       │ Content-TFIDF│         │ Collab SVD   │
└──────┬───────┘       └──────┬───────┘         └──────┬───────┘
       │                      │                        │
       └──────────────────────┼────────────────────────┘
                              │
                              ▼
                      ┌───────────────┐
                      │    Model D    │ (Hybrid Ensemble)
                      │ Alpha Fusion  │
                      └───────┬───────┘
                              │
                              ▼
                      ┌───────────────┐
                      │    Model E    │ (RAG Gemini Semantic Re-ranking)
                      │ pgvector HNSW │
                      └───────┬───────┘
                              │
                              ▼
                 [Final Top-K Ranked POIs]
```

---

## 3. Database Schema Blueprint

```
+-------------------------------------------------------------+
|                            REGIONS                          |
+-------------------------------------------------------------+
| id (UUID) | name (VARCHAR) | slug (VARCHAR, UNIQUE)         |
+-------------------------------------------------------------+
                              ▲
                              │ 1:N
+-------------------------------------------------------------+
|                            CITIES                           |
+-------------------------------------------------------------+
| id (UUID) | region_id (UUID) | name | slug | lat | lon | amsl|
+-------------------------------------------------------------+
                              ▲
                              │ 1:N
+-------------------------------------------------------------+
|                            PLACES                           |
+-------------------------------------------------------------+
| id (UUID, PK)                                               |
| city_id (UUID, FK -> cities.id)                             |
| category_id (UUID, FK -> categories.id)                     |
| name, slug (VARCHAR, UNIQUE)                                |
| description, name_ur (TEXT)                                 |
| latitude, longitude (FLOAT), geom (GEOGRAPHY(POINT, 4326))  |
| estimated_cost_min, estimated_cost_max (FLOAT, PKR)         |
| average_visit_duration_minutes (INT)                        |
| popularity_score (FLOAT 0.0 - 1.0)                          |
| indoor_outdoor (VARCHAR: indoor, outdoor, both)             |
| family_suitable (BOOLEAN), activity_level (low, mod, high)  |
| opening_hours (JSONB), seasonality (JSONB)                  |
+-------------------------------------------------------------+
      │ 1:N                        │ 1:N                 │ 1:N
      ▼                            ▼                     ▼
+---------------+          +---------------+      +-------------------+
|  PLACE_IMAGES |          |   PLACE_TAGS  |      |  PLACE_EMBEDDINGS |
+---------------+          +---------------+      +-------------------+
| id (UUID)     |          | place_id (FK) |      | place_id (FK)     |
| place_id (FK) |          | tag_id (FK)   |      | embedding (VECTOR)|
| url (TEXT)    |          +---------------+      +-------------------+
| is_primary    |
+---------------+
```

---

## 4. Performance & Caching Mechanics

1. **SQL Joined Loading**:
   - `joinedload(Place.category)` eliminates N+1 queries.
   - `selectinload(Place.images)` loads images in a single indexed lookup.
2. **Double-Checked In-Memory Locking**:
   - `MemoryCache.get_or_set()` acquires an `asyncio.Lock()` only on a cold cache miss, preventing thundering herds while serving concurrent read requests in `0.01ms`.
3. **Lifespan Warmup**:
   - Pre-loads top 300 places, all cities, and all categories into memory at application boot.
