"""
Backward-compatibility layer for the recommendation engine.
The implementation resides in services.engine as part of the MVC architecture.
"""
from services.engine import (
    segment_for,
    train_affinity_model,
    get_product_similarity,
    get_shopper_recommendations,
    get_customer_recommendations,
    score_and_update_batch,
    _MODEL_CACHE,
)

__all__ = [
    "segment_for",
    "train_affinity_model",
    "get_product_similarity",
    "get_shopper_recommendations",
    "get_customer_recommendations",
    "score_and_update_batch",
    "_MODEL_CACHE",
]
