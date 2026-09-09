"""Research evaluation script for recommendation models (Model A, B, C, D, E)."""

import asyncio
import sys
import time
from pathlib import Path

# Add backend directory to sys.path
backend_path = Path(__file__).resolve().parent.parent.parent / "backend"
sys.path.insert(0, str(backend_path))

import numpy as np
from sqlalchemy import select

from app.core.database import AsyncSessionLocal, engine
from app.db.seed import seed_database
from app.models import Base
from app.models.interaction import UserInteraction
from app.models.place import Category, Place
from app.models.user import User, UserPreference
from app.services.rec_service import RecommendationService


def calculate_precision_at_k(recommended_ids: list[str], relevant_ids: set[str], k: int) -> float:
    top_k = recommended_ids[:k]
    hits = sum(1 for item_id in top_k if item_id in relevant_ids)
    return hits / k if k > 0 else 0.0


def calculate_recall_at_k(recommended_ids: list[str], relevant_ids: set[str], k: int) -> float:
    if not relevant_ids:
        return 0.0
    top_k = recommended_ids[:k]
    hits = sum(1 for item_id in top_k if item_id in relevant_ids)
    return hits / len(relevant_ids)


def calculate_intra_list_diversity(categories: list[str]) -> float:
    if len(categories) <= 1:
        return 0.0
    unique_cats = len(set(categories))
    return unique_cats / len(categories)


async def run_evaluation():
    print("=" * 65)
    print("      RESEARCH RECOMMENDATION MODEL BENCHMARK (MODELS A–E)     ")
    print("=" * 65)

    await seed_database()

    async with AsyncSessionLocal() as db:
        places_res = await db.execute(select(Place))
        all_places = list(places_res.scalars().all())

        if not all_places:
            print("No places in database.")
            return

        users_res = await db.execute(select(User).limit(10))
        users = list(users_res.scalars().all())

        rec_service = RecommendationService(db)
        models = ["model_a", "model_b", "model_c", "model_d", "model_e"]

        summary_rows = []

        for model_name in models:
            prec_3_list, recall_3_list = [], []
            prec_5_list, recall_5_list = [], []
            diversity_list = []
            latencies = []

            for user in users:
                t0 = time.perf_counter()
                results = await rec_service.get_recommendations(
                    user,
                    model_name=model_name,
                    context={"weather": "rain", "month": 7},
                    limit=10,
                )
                elapsed_ms = (time.perf_counter() - t0) * 1000.0
                latencies.append(elapsed_ms)

                rec_ids = [str(r.place.id) for r in results]
                cat_slugs = [r.place.category.slug for r in results if r.place.category]

                inter_res = await db.execute(
                    select(UserInteraction).filter(UserInteraction.user_id == user.id)
                )
                user_inters = list(inter_res.scalars().all())
                relevant_set = {str(i.place_id) for i in user_inters}
                if not relevant_set:
                    relevant_set = {str(p.id) for p in all_places[:3]}

                p3 = calculate_precision_at_k(rec_ids, relevant_set, k=3)
                r3 = calculate_recall_at_k(rec_ids, relevant_set, k=3)
                p5 = calculate_precision_at_k(rec_ids, relevant_set, k=5)
                r5 = calculate_recall_at_k(rec_ids, relevant_set, k=5)
                div = calculate_intra_list_diversity(cat_slugs)

                prec_3_list.append(p3)
                recall_3_list.append(r3)
                prec_5_list.append(p5)
                recall_5_list.append(r5)
                diversity_list.append(div)

            m_p3 = np.mean(prec_3_list)
            m_r3 = np.mean(recall_3_list)
            m_p5 = np.mean(prec_5_list)
            m_r5 = np.mean(recall_5_list)
            m_div = np.mean(diversity_list)
            m_lat = np.mean(latencies)

            summary_rows.append((model_name.upper(), m_p3, m_r3, m_p5, m_r5, m_div, m_lat))

        print(f"{'MODEL':<10} | {'P@3':<7} | {'R@3':<7} | {'P@5':<7} | {'R@5':<7} | {'DIV':<7} | {'LATENCY (ms)'}")
        print("-" * 65)
        for row in summary_rows:
            print(f"{row[0]:<10} | {row[1]:.4f} | {row[2]:.4f} | {row[3]:.4f} | {row[4]:.4f} | {row[5]:.4f} | {row[6]:.2f}")

    print("=" * 65)


if __name__ == "__main__":
    asyncio.run(run_evaluation())
