# REST API Specification (v1)

Base URL: `/api/v1`

All API requests accept and return JSON unless specified otherwise. Protected endpoints require a valid JWT Bearer token in the `Authorization` header:

```http
Authorization: Bearer <your_jwt_access_token>
```

---

## 🔐 Authentication (`/auth`)

### `POST /auth/register`
Register a new user account.

**Request Body**:
```json
{
  "email": "traveler@example.com",
  "password": "StrongPassword123!",
  "full_name": "Ali Khan"
}
```

**Response** (`201 Created`):
```json
{
  "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "email": "traveler@example.com",
  "full_name": "Ali Khan",
  "role": "user",
  "created_at": "2026-09-09T10:00:00Z"
}
```

---

### `POST /auth/login`
Authenticate user credentials and receive access tokens.

**Request Body**:
```json
{
  "username": "traveler@example.com",
  "password": "StrongPassword123!"
}
```

**Response** (`200 OK`):
```json
{
  "access_token": "eyJhbGciOiJIUzI1Ni...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

---

## 👤 User Profile (`/users`)

### `GET /users/me` 🔒
Retrieve current authenticated user profile.

**Response** (`200 OK`):
```json
{
  "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "email": "traveler@example.com",
  "full_name": "Ali Khan",
  "preferences": {
    "preferred_categories": ["Mountain", "Historical"],
    "travel_pace": "moderate",
    "budget_level": "medium"
  }
}
```

### `PUT /users/me/preferences` 🔒
Update user preferences used by recommendation models.

**Request Body**:
```json
{
  "preferred_categories": ["Adventure", "Lakes"],
  "travel_pace": "fast",
  "budget_level": "luxury"
}
```

---

## 📍 Places & Exploration (`/places`)

### `GET /places`
List tourist destinations with pagination and filtering.

**Query Parameters**:
- `city_id` *(int, optional)*: Filter by city ID
- `category_id` *(int, optional)*: Filter by category ID
- `search` *(string, optional)*: Text search query
- `page` *(int, default=1)*
- `page_size` *(int, default=10)*

**Response** (`200 OK`):
```json
{
  "total": 42,
  "page": 1,
  "page_size": 10,
  "items": [
    {
      "id": "e3a89b7b-231a-4f8a-9a99-4d6d1b2c3d4e",
      "name": "Attabad Lake",
      "city_name": "Hunza",
      "category_name": "Lakes",
      "rating": 4.8,
      "latitude": 36.3344,
      "longitude": 74.8664,
      "image_urls": ["https://images.unsplash.com/photo-attabad"]
    }
  ]
}
```

### `GET /places/{place_id}`
Retrieve detailed information for a single place.

---

## 🎯 Recommendations (`/recommendations`)

### `GET /recommendations` 🔒
Fetch personalized recommendations powered by selection of Model A–E.

**Query Parameters**:
- `model` *(string, default="E")*: Options: `A` (Popularity), `B` (Content), `C` (Collaborative), `D` (Hybrid), `E` (RAG+LLM)
- `limit` *(int, default=10)*: Number of items

**Response** (`200 OK`):
```json
{
  "model_used": "Model E (RAG + Contextual LLM Reranking)",
  "recommendations": [
    {
      "place_id": "e3a89b7b-231a-4f8a-9a99-4d6d1b2c3d4e",
      "name": "Fairy Meadows",
      "score": 0.96,
      "match_reason": "High match for mountain adventure preference and previous reviews."
    }
  ]
}
```

---

## 🗓️ Itinerary Planner & Trips (`/trips`)

### `POST /trips/generate` 🔒
Generate an optimized multi-day itinerary.

**Request Body**:
```json
{
  "city_id": 1,
  "duration_days": 3,
  "budget": 45000.0,
  "pace": "moderate",
  "category_preferences": ["Historical", "Nature"]
}
```

**Response** (`201 Created`):
```json
{
  "trip_id": "11aa22bb-33cc-44dd-55ee-66ff77aa88bb",
  "title": "3 Days in Hunza",
  "total_estimated_cost": 42000.0,
  "days": [
    {
      "day_number": 1,
      "schedule": [
        {
          "order": 1,
          "place_name": "Baltit Fort",
          "recommended_duration_hours": 2,
          "estimated_cost": 1000
        }
      ]
    }
  ]
}
```

---

## 🤖 AI Travel Assistant (`/ai`)

### `POST /ai/chat` 🔒
Interact with the tool-using AI Assistant.

**Request Body**:
```json
{
  "message": "Can you recommend a day trip near Skardu with lakes and historical forts?"
}
```

**Response** (`200 OK`):
```json
{
  "response": "Here is a customized day trip around Skardu featuring Shangrila Lake and Kharpocho Fort...",
  "tools_executed": [
    {
      "tool_name": "search_places",
      "status": "success"
    }
  ]
}
```

---

## 🌤️ Weather (`/weather`)

### `GET /weather/{city_name}`
Get real-time weather and forecast for a destination.

**Response** (`200 OK`):
```json
{
  "city": "Hunza",
  "temperature_celsius": 18.5,
  "condition": "Clear Sky",
  "humidity": 45,
  "wind_speed_kmh": 12.0
}
```
