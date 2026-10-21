import os
import sys
import sqlite3
from datetime import datetime, timezone
from typing import Any

# Ensure venv site-packages is in sys.path
venv_site_packages = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".venv/lib/python3.12/site-packages")
if os.path.exists(venv_site_packages) and venv_site_packages not in sys.path:
    sys.path.insert(0, venv_site_packages)

try:
    import pandas as pd
    import numpy as np
    from sklearn.metrics.pairwise import cosine_similarity
    HAS_ML = True
except ImportError:
    HAS_ML = False

from db import get_db

# In-memory cache for similarity matrix and product mapping
_MODEL_CACHE: dict[str, Any] = {
    "product_ids": [],
    "similarity_matrix": None,
    "last_trained": None,
}


def segment_for(recency_days: int, frequency: int, monetary: float) -> tuple[str, int]:
    """Calculates customer segment and health score based on RFM metrics."""
    if recency_days <= 10 and frequency >= 20:
        score = min(98, 70 + frequency)
        return "Loyal", score
    if recency_days > 45:
        score = max(12, 45 - recency_days // 2)
        return "Inactive", score
    if recency_days > 14:
        score = max(30, 72 - recency_days)
        return "At risk", score
    if frequency <= 8:
        score = min(76, 45 + frequency * 2)
        return "New", score
    score = min(84, 55 + frequency)
    return "Growing", score


def train_affinity_model() -> None:
    """Trains an item-to-item collaborative filtering affinity matrix."""
    global _MODEL_CACHE
    conn = get_db()
    cur = conn.cursor()

    cur.execute("SELECT id FROM products ORDER BY id")
    products = [row["id"] for row in cur.fetchall()]
    if not products:
        conn.close()
        return

    # Extract transactions and cart events
    cur.execute("SELECT customer_id, product_id, 2.0 as weight FROM transactions")
    tx_rows = cur.fetchall()

    cur.execute("SELECT customer_id, product_id, 1.0 as weight FROM cart_events")
    cart_rows = cur.fetchall()
    conn.close()

    all_interactions = list(tx_rows) + list(cart_rows)

    if not all_interactions:
        # Default identity similarity matrix
        _MODEL_CACHE = {
            "product_ids": products,
            "similarity_matrix": [[1.0 if i == j else 0.3 for j in range(len(products))] for i in range(len(products))],
            "last_trained": datetime.now(timezone.utc).isoformat(),
        }
        return

    if HAS_ML:
        df = pd.DataFrame([dict(row) for row in all_interactions])
        interaction_matrix = df.groupby(["customer_id", "product_id"])["weight"].sum().unstack(fill_value=0.0)

        # Reindex to ensure all catalog products are present
        interaction_matrix = interaction_matrix.reindex(columns=products, fill_value=0.0)

        # Compute cosine similarity between product columns (transpose matrix)
        item_matrix = interaction_matrix.T.values
        sim_matrix = cosine_similarity(item_matrix)

        _MODEL_CACHE = {
            "product_ids": products,
            "similarity_matrix": sim_matrix,
            "last_trained": datetime.now(timezone.utc).isoformat(),
        }
    else:
        # Pure-Python fallback for item co-occurrence
        p_index = {pid: idx for idx, pid in enumerate(products)}
        n = len(products)
        co_counts = [[0.0] * n for _ in range(n)]

        cust_prods: dict[str, set[str]] = {}
        for r in all_interactions:
            cust_prods.setdefault(r["customer_id"], set()).add(r["product_id"])

        for pset in cust_prods.values():
            for p1 in pset:
                if p1 in p_index:
                    i = p_index[p1]
                    for p2 in pset:
                        if p2 in p_index:
                            j = p_index[p2]
                            co_counts[i][j] += 1.0

        sim_matrix = []
        for i in range(n):
            row = []
            for j in range(n):
                if i == j:
                    row.append(1.0)
                else:
                    norm = (co_counts[i][i] * co_counts[j][j]) ** 0.5
                    row.append(co_counts[i][j] / norm if norm > 0 else 0.2)
            sim_matrix.append(row)

        _MODEL_CACHE = {
            "product_ids": products,
            "similarity_matrix": sim_matrix,
            "last_trained": datetime.now(timezone.utc).isoformat(),
        }


def get_product_similarity(p1: str, p2: str) -> float:
    """Returns similarity score between two products."""
    if _MODEL_CACHE["similarity_matrix"] is None:
        train_affinity_model()

    p_ids = _MODEL_CACHE.get("product_ids", [])
    if p1 not in p_ids or p2 not in p_ids:
        return 0.3

    i1 = p_ids.index(p1)
    i2 = p_ids.index(p2)
    matrix = _MODEL_CACHE["similarity_matrix"]
    if HAS_ML and hasattr(matrix, "__getitem__"):
        return float(matrix[i1][i2])
    return float(matrix[i1][i2])


def get_shopper_recommendations(customer_id: str, cart_product_ids: list[str], limit: int = 3) -> list[dict[str, Any]]:
    """Generates personalized product recommendations for a shopper based on live cart items and purchase history."""
    if _MODEL_CACHE["similarity_matrix"] is None:
        train_affinity_model()

    conn = get_db()
    cur = conn.cursor()

    # Get all products
    cur.execute("SELECT id, name, category, price, reason FROM products")
    products = [dict(row) for row in cur.fetchall()]

    # Get customer info and past purchases
    cur.execute("SELECT segment FROM customers WHERE id = ?", (customer_id,))
    cust_row = cur.fetchone()
    segment = cust_row["segment"] if cust_row else "Loyal"

    cur.execute("SELECT DISTINCT product_id FROM transactions WHERE customer_id = ?", (customer_id,))
    past_purchases = {row["product_id"] for row in cur.fetchall()}

    conn.close()

    cart_set = set(cart_product_ids)
    candidates = [p for p in products if p["id"] not in cart_set]

    # Score each candidate
    scored_candidates = []
    for cand in candidates:
        pid = cand["id"]
        affinity_score = 0.0
        reason = cand["reason"]

        if cart_product_ids:
            # Score against items in current cart
            best_cart_item_sim = 0.0
            best_cart_id = cart_product_ids[0]
            for cart_pid in cart_product_ids:
                sim = get_product_similarity(pid, cart_pid)
                if sim > best_cart_item_sim:
                    best_cart_item_sim = sim
                    best_cart_id = cart_pid

            affinity_score = best_cart_item_sim * 1.5
            cart_prod_name = next((p["name"] for p in products if p["id"] == best_cart_id), "cart items")
            reason = f"Frequently paired with your {cart_prod_name.lower()}"
        elif past_purchases:
            # Score against past purchases
            best_past_sim = 0.0
            best_past_id = ""
            for past_pid in past_purchases:
                sim = get_product_similarity(pid, past_pid)
                if sim > best_past_sim:
                    best_past_sim = sim
                    best_past_id = past_pid

            affinity_score = best_past_sim
            past_name = next((p["name"] for p in products if p["id"] == best_past_id), "recent orders")
            reason = f"Complements your purchase of {past_name}"
        else:
            # Segment-based prior
            if segment == "At risk":
                affinity_score = 0.75 if cand["category"] == "Rewards" else 0.5
                reason = "Popular reactivation reward for your customer profile"
            elif segment == "Loyal":
                affinity_score = 0.85 if cand["category"] in ["Fashion", "Lifestyle"] else 0.6
                reason = "Popular with loyal customers in your segment"
            else:
                affinity_score = 0.65
                reason = "A trending favorite across the catalog"

        scored_candidates.append({
            "id": cand["id"],
            "name": cand["name"],
            "category": cand["category"],
            "price": cand["price"],
            "reason": reason,
            "_score": affinity_score,
        })

    # Sort descending by score
    scored_candidates.sort(key=lambda x: x["_score"], reverse=True)
    return [{k: v for k, v in item.items() if not k.startswith("_")} for item in scored_candidates[:limit]]


def get_customer_recommendations(customer_id: str, limit: int = 2) -> list[dict[str, Any]]:
    """Returns model recommendations with confidence scores for the merchant dashboard."""
    shopper_recs = get_shopper_recommendations(customer_id=customer_id, cart_product_ids=[], limit=limit)
    results = []
    base_confidences = [0.86, 0.78, 0.72]

    for idx, rec in enumerate(shopper_recs):
        confidence = base_confidences[idx] if idx < len(base_confidences) else 0.70
        results.append({
            "customer_id": customer_id,
            "product_id": rec["id"],
            "reason": rec["reason"],
            "confidence": confidence,
        })
    return results


def score_and_update_batch(transactions: list[dict[str, Any]]) -> int:
    """Updates customer RFM scores and segments in the database based on ingested transactions."""
    now = datetime.now(timezone.utc)
    conn = get_db()
    cur = conn.cursor()

    # Find affected customers
    customer_ids = list(set(tx["customer_id"] for tx in transactions))

    for cid in customer_ids:
        # Fetch all transactions for this customer
        cur.execute("SELECT amount, purchased_at FROM transactions WHERE customer_id = ?", (cid,))
        rows = cur.fetchall()

        if not rows:
            continue

        tx_dates = []
        monetary = 0.0
        for r in rows:
            monetary += float(r["amount"])
            try:
                dt = datetime.fromisoformat(r["purchased_at"])
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                tx_dates.append(dt)
            except Exception:
                tx_dates.append(now)

        recency_days = min(max((now - max(tx_dates)).days, 0), 365) if tx_dates else 30
        frequency = len(rows)
        segment, health_score = segment_for(recency_days, frequency, monetary)

        # Check if customer exists
        cur.execute("SELECT id FROM customers WHERE id = ?", (cid,))
        exists = cur.fetchone()

        if exists:
            cur.execute("""
            UPDATE customers
            SET segment = ?, health_score = ?, frequency = ?, monetary = ?, recency_days = ?
            WHERE id = ?
            """, (segment, health_score, frequency, round(monetary, 2), recency_days, cid))
        else:
            cur.execute("""
            INSERT INTO customers (id, name, email, segment, health_score, frequency, monetary, recency_days, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (cid, cid, f"{cid}@demo.mindsit.com", segment, health_score, frequency, round(monetary, 2), recency_days, now.isoformat()))

    conn.commit()
    conn.close()

    # Retrain model with updated interactions
    train_affinity_model()
    return len(customer_ids)
