# Machine Learning & Recommendation Experiments

This directory contains research experiments, benchmarks, and evaluation scripts for the 5 recommendation models (Model A–E).

## Structure

- `model_a_baseline/`: Popularity + Category match heuristics
- `model_b_content/`: TF-IDF & Tag vector similarity
- `model_c_collaborative/`: Implicit feedback Matrix Factorization
- `model_d_hybrid/`: Multi-signal weighted ensemble
- `model_e_rag_rerank/`: PGVector vector search + LLM reranking

## Evaluation Metrics

All models are evaluated on identical test splits using:
- **Precision@K** (K=3, 5, 10)
- **Recall@K** (K=3, 5, 10)
- **MAP@K** (Mean Average Precision)
- **Intra-list Diversity** (Category variance across recommended items)
- **Execution Latency** (ms per recommendation request)
