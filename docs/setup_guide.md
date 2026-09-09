# Developer Setup & Deployment Guide

This guide provides instructions for setting up the development environment, running tests, executing data ingestion pipelines, and deploying the application to production.

---

## 💻 Prerequisites

Ensure you have installed:
- **Docker Desktop** (version 24.0+) & Docker Compose v2
- **Python 3.11+**
- **Node.js 18+** & `npm` / `pnpm`
- **Git**

---

## 🛠️ Local Setup Options

### Option A: Docker Compose (Recommended)

Docker Compose sets up PostgreSQL 16 (with PostGIS & pgvector extensions), FastAPI backend, Nginx reverse proxy, and Next.js frontend in isolated containers.

1. **Clone repository & prepare environment variables**:
   ```bash
   cp .env.example .env
   ```

2. **Start service containers**:
   ```bash
   docker compose up --build -d
   ```

3. **Run database migrations**:
   ```bash
   docker compose exec backend alembic upgrade head
   ```

4. **Seed database with initial Pakistan tourism data**:
   ```bash
   docker compose exec backend python app/db/seed.py
   ```

---

### Option B: Standalone Local Setup (Without Docker)

#### 1. Database Setup
Install PostgreSQL 16 locally and enable PostGIS & pgvector:
```sql
CREATE DATABASE travel_intelligence;
\c travel_intelligence;
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;
```

#### 2. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
alembic upgrade head
python app/db/seed.py
uvicorn app.main:app --reload --port 8000
```

#### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 📦 Data Ingestion Pipeline

The platform includes custom data collection and enrichment pipelines under `backend/scripts/`:

```bash
# Execute tier ingestion pipeline
cd backend
python scripts/ingest_tier_pipeline.py
```

Features of the ingestion script:
- Fetches verified geotagged tourism destinations across Northern Pakistan (Hunza, Skardu, Swat, Murree, Lahore, Islamabad).
- Enhances place records with high-quality media images via Wikimedia Commons API.
- Computes 768-dimensional text embeddings for RAG search.

---

## 🧪 Testing & Code Quality Assurance

### Run Unit & Integration Tests
```bash
cd backend
pytest tests/ -v --tb=short
```

### Static Analysis & Formatting
```bash
ruff check backend/
```

---

## 🚀 CI/CD & Production Deployment

### GitHub Actions Workflows
Located under `.github/workflows/`:
- `ci.yml`: Runs on pull requests to `main`. Executes backend pytest suite and frontend linting/build checks.
- `cd.yml`: Deploys stack to target host on push to `main`.

### Production Docker Compose Execution
For production deployments, launch containers in daemon mode:
```bash
docker compose -f docker-compose.yml up -d --build
```
