# 🤖 AI Agent Guidelines & Operations Manual (WanderAI)

> **For**: All AI Pair Programmers (Antigravity, Cursor, Copilot, Gemini, Claude).

---

## ⚡ Quick Start & Project Rules

1. **Working Directory & Paths**:
   - Backend: `backend/` (FastAPI, SQLAlchemy, Pydantic)
   - Frontend: `frontend/` (Next.js 15, TypeScript, Tailwind CSS)
   - Always run test commands from their respective subfolders.

2. **Performance Constraints**:
   - **Never revert `MemoryCache` or remove `joinedload`** in `backend/app/api/v1/places.py`, `cities.py`, or `categories.py`.
   - The database is remotely hosted in Singapore; un-cached queries take ~13+ seconds. Caching is mandatory for all high-read endpoints.
   - Any mutating endpoint (`POST`, `PUT`, `DELETE` on places/trips) must invalidate the cache via `places_cache.clear()` or `invalidateCache()`.

3. **SEO & Routing**:
   - All place routes must support semantic URL slugs (`/places/[slug]`) with fallback to UUID.
   - Preserve Schema.org JSON-LD tags and semantic `<meta>` tags.

4. **Styling & Design System**:
   - Follow the design system outlined in [`DESIGN.md`](DESIGN.md).
   - Use `Inter` for body and `Plus Jakarta Sans` for headers.
   - Dark theme `#0b1329` with glassmorphism `bg-slate-900/60 backdrop-blur-xl border border-white/10`.
   - Use emerald/teal for interactive route accents.

5. **Validation & Testing Commands**:
   - Backend verification: `pytest backend/tests/ -v`
   - Frontend verification: `cd frontend && npx tsc --noEmit`
