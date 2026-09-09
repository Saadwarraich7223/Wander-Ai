# Recommendation Systems & ML Architecture

This document describes the design, implementation, and evaluation methodology of the multi-model recommendation engine.

---

## 🎯 Model Taxonomy & Algorithms

The system evaluates 5 recommendation algorithms (Model A through Model E) to systematically measure accuracy, diversity, and contextual relevance.

### Model A: Popularity & Category Baseline
- **Strategy**: Non-personalized baseline.
- **Formula**: Sorts places by global user ratings and view count filtered by target category:
  $$\text{Score}(p) = w_1 \cdot \text{Rating}(p) + w_2 \cdot \log(1 + \text{Interactions}(p))$$

### Model B: Content-Based Filtering
- **Strategy**: TF-IDF + Cosine Similarity over metadata vector space.
- **Vector Space**: Constructs TF-IDF vectors from destination tags, descriptions, and city attributes.
- **Scoring**: Computes cosine similarity between user preference vector $\vec{U}$ and place feature vector $\vec{P}$:
  $$\text{Similarity}(\vec{U}, \vec{P}) = \frac{\vec{U} \cdot \vec{P}}{\|\vec{U}\| \|\vec{P}\|}$$

### Model C: Collaborative Filtering (Matrix Factorization)
- **Strategy**: Implicit feedback matrix factorization using low-rank latent embeddings.
- **Loss Function**: Weighted Alternating Least Squares (W-ALS) minimizing prediction error over user-item interaction matrix.

### Model D: Hybrid Recommendation Engine
- **Strategy**: Weighted linear ensemble combining content-based, collaborative, and spatial distance scores.
- **Formula**:
  $$\text{Score}_{\text{hybrid}} = \alpha \cdot S_{\text{content}} + \beta \cdot S_{\text{collaborative}} + \gamma \cdot S_{\text{spatial}}$$

### Model E: RAG + LLM Contextual Reranking
- **Strategy**: Two-stage retrieval and reranking framework.
  1. **Stage 1 (Retrieval)**: Fast Approximate Nearest Neighbor (ANN) search via `pgvector` Cosine Distance over 768-dimensional embeddings to retrieve Top-K candidates.
  2. **Stage 2 (Reranking)**: Google Gemini LLM evaluates candidate set against real-time constraints (budget limit, current weather, trip pace, family friendly constraints).

---

## 📊 Offline Evaluation Harness

Evaluation scripts are located in `ml/experiments/evaluate.py`.

### Measured Metrics:
1. **Precision@K**: Fraction of top-K recommended items that are relevant to the user.
2. **Recall@K**: Proportion of all relevant items captured in top-K recommendations.
3. **Mean Average Precision (MAP)**: Accounts for rank position of relevant recommendations.
4. **Intra-List Diversity (ILD)**: Measures pairwise dissimilarity between recommended places to prevent repetitive suggestions.

```bash
# Run ML offline evaluation benchmark
python ml/experiments/evaluate.py
```
