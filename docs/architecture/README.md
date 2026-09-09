# System Architecture Documentation

This document describes the architectural layout, data models, entity relationships, and key pipeline execution flows of the AI-Powered Tourism & Travel Intelligence Platform.

---

## 🏢 System Overview

The platform uses a **Modular Monolith Architecture** designed for high modularity, easy maintenance, and research-grade scalability.

```mermaid
flowchart TB
    subgraph Client Tier
        UI[Next.js 15 App Router Frontend]
        MB[Mapbox GL JS]
    end

    subgraph Gateway Tier
        NGINX[Nginx Reverse Proxy]
    end

    subgraph Application Tier (FastAPI)
        API[API Router /api/v1]
        AUTH[Auth & User Module]
        PLACES[Places & Category Module]
        REC[Multi-Model Recommendation Engine]
        OPT[Itinerary Constraint Optimizer]
        RAG[RAG Engine & Tool Service]
        WX[Weather Service]
    end

    subgraph Data & Storage Tier
        PG[(PostgreSQL 16)]
        GIS[PostGIS Extension - Spatial Queries]
        VEC[pgvector Extension - 768d Embeddings]
    end

    subgraph External Services
        GEMINI[Google Gemini 1.5/Flash LLM]
        OWM[OpenWeatherMap API]
    end

    UI -->|REST / JSON| NGINX
    UI -->|Render Maps| MB
    NGINX -->|Pass Request| API
    API --> AUTH
    API --> PLACES
    API --> REC
    API --> OPT
    API --> RAG
    API --> WX

    AUTH & PLACES & REC & OPT & RAG --> PG
    PG --- GIS
    PG --- VEC

    RAG --> GEMINI
    WX --> OWM
```

---

## 🗄️ Database Entity-Relationship (ER) Schema

PostgreSQL 16 stores core database entity tables with spatial data handled via PostGIS geometry columns and semantic vector representations handled via `pgvector`.

```mermaid
erDiagram
    USERS ||--o{ TRIPS : creates
    USERS ||--o{ INTERACTIONS : performs
    USERS {
        uuid id PK
        string email UK
        string hashed_password
        string full_name
        string role
        json preferences
        datetime created_at
    }

    CITIES ||--o{ PLACES : contains
    CITIES {
        int id PK
        string name UK
        string province
        geometry location
        string description
    }

    CATEGORIES ||--o{ PLACES : classifies
    CATEGORIES {
        int id PK
        string name UK
        string description
    }

    PLACES ||--o{ INTERACTIONS : receives
    PLACES ||--o{ TRIP_ITEMS : included_in
    PLACES {
        uuid id PK
        int city_id FK
        int category_id FK
        string name
        string description
        float rating
        geometry location
        vector embedding_768
        string_array image_urls
        json opening_hours
        float average_cost
    }

    TRIPS ||--o{ TRIP_ITEMS : contains
    TRIPS {
        uuid id PK
        uuid user_id FK
        string title
        date start_date
        date end_date
        float budget
        string pace
        json metadata
    }

    TRIP_ITEMS {
        uuid id PK
        uuid trip_id FK
        uuid place_id FK
        int day_number
        int order_index
        time visit_time
    }

    INTERACTIONS {
        uuid id PK
        uuid user_id FK
        uuid place_id FK
        string interaction_type
        float weight
        datetime created_at
    }
```

---

## 🔄 Execution Pipelines & Workflows

### 1. Multi-Model Recommendation Pipeline

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Frontend
    participant RecAPI as /api/v1/recommendations
    participant RecEngine as Recommendation Service
    participant PG as Postgres (pgvector)
    participant Gemini as Gemini LLM

    User->>Frontend: Request Recommendations (Model E)
    Frontend->>RecAPI: GET /recommendations?model=E&limit=10
    RecAPI->>RecEngine: get_recommendations(user_id, model='E')
    RecEngine->>PG: Query pgvector Cosine Distance (Vector Search)
    PG-->>RecEngine: Return Top-20 Vector Candidate Places
    RecEngine->>Gemini: Re-rank Candidates (User Profile + Intent Prompt)
    Gemini-->>RecEngine: Return Scored & Ranked List
    RecEngine-->>RecAPI: Top-10 Recommended Places
    RecAPI-->>Frontend: Render Recommendation Cards
```

### 2. RAG & Tool-Calling Assistant Execution

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Frontend
    participant AssistantAPI as /api/v1/ai/chat
    participant RAG as RAG Service
    participant Tools as Tool Execution Engine
    participant DB as PostgreSQL
    participant Gemini as Gemini LLM

    User->>Frontend: Type prompt ("Suggest a 3-day Hunza trip under 50k PKR")
    Frontend->>AssistantAPI: POST /ai/chat { message: "..." }
    AssistantAPI->>RAG: Process Message
    RAG->>Gemini: Send Prompt + Registered Tool Definitions
    Gemini-->>RAG: Request Tool Call: `generate_itinerary(city="Hunza", days=3, budget=50000)`
    RAG->>Tools: Execute `generate_itinerary`
    Tools->>DB: Fetch matching places & locations
    DB-->>Tools: Places data
    Tools-->>RAG: Generated Itinerary JSON
    RAG->>Gemini: Send Tool Output back to LLM
    Gemini-->>RAG: Final Natural Language Answer with Structured Itinerary
    RAG-->>AssistantAPI: Assistant Response
    AssistantAPI-->>Frontend: Display Message & Interactive Map Widget
```

---

## ⚡ Performance & Scalability Considerations

1. **Spatial Indexing**: PostGIS `GIST` indexes on `places.location` ensure sub-millisecond bounding box and distance query speeds.
2. **Vector Indexing**: `HNSW` (Hierarchical Navigable Small World) index on `places.embedding_768` enables fast approximate nearest neighbor (ANN) vector retrieval.
3. **Database Connection Pooling**: SQLAlchemy Async Engine with connection pooling (`pool_size=10`, `max_overflow=20`) handles high concurrent throughput.
4. **Static & Media Asset Delivery**: Image assets and fonts are served via optimized CDN or static cache headers in Nginx.
