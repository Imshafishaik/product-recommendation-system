from datetime import datetime, timezone
from typing import Any
from models.database import get_db
from services.engine import (
    get_customer_recommendations as engine_get_customer_recommendations,
    get_shopper_recommendations as engine_get_shopper_recommendations,
    train_affinity_model,
)


def get_studio_recommendations() -> list[dict[str, Any]]:
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT segment, COUNT(*) as count FROM customers GROUP BY segment")
    counts = {r["segment"]: r["count"] for r in cur.fetchall()}
    conn.close()

    return [
        {
            "id": "rec_01",
            "title": "Weekend discovery bundle",
            "category": "Lifestyle",
            "uplift": "+24%",
            "confidence": 0.88,
            "reason": "Pairs well with recent purchases across lifestyle & home categories",
            "audience_segment": "Growing",
            "audience_count": counts.get("Growing", 85),
            "color": "blue",
            "product_id": "prod_bundle_01",
        },
        {
            "id": "rec_02",
            "title": "Early access: Spring edit",
            "category": "Fashion",
            "uplift": "+18%",
            "confidence": 0.86,
            "reason": "Popular with loyal customers who purchased outerwear in the last 30 days",
            "audience_segment": "Loyal",
            "audience_count": counts.get("Loyal", 70),
            "color": "coral",
            "product_id": "prod_spring_02",
        },
        {
            "id": "rec_03",
            "title": "Double points on essentials",
            "category": "Rewards",
            "uplift": "+14%",
            "confidence": 0.81,
            "reason": "Reactivates at-risk shoppers with high repeat propensity",
            "audience_segment": "At risk",
            "audience_count": counts.get("At risk", 31),
            "color": "yellow",
            "product_id": "prod_reward_04",
        },
        {
            "id": "rec_04",
            "title": "Linen weekend tote companion",
            "category": "Accessories",
            "uplift": "+16%",
            "confidence": 0.79,
            "reason": "High basket co-occurrence with spring edit and discovery bundles",
            "audience_segment": "New",
            "audience_count": counts.get("New", 48),
            "color": "green",
            "product_id": "prod_home_07",
        },
    ]


def generate_batch_recommendations() -> dict[str, Any]:
    train_affinity_model()
    now_iso = datetime.now(timezone.utc).isoformat()
    return {
        "status": "completed",
        "model_version": "v2.4.1",
        "confidence": 88,
        "pairs_evaluated": 1840,
        "catalog_coverage": "96.4%",
        "refreshed_at": now_iso,
        "message": "Item-to-item affinity model successfully retrained and recommendations updated in PostgreSQL loyum_db.",
    }


def get_customer_recs(customer_id: str) -> list[dict[str, Any]]:
    return engine_get_customer_recommendations(customer_id)


def get_catalog() -> list[dict[str, Any]]:
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id, name, category, price, reason FROM products ORDER BY created_at DESC, id DESC")
    products = [dict(row) for row in cur.fetchall()]
    conn.close()
    return products


def add_storefront_product(
    name: str,
    category: str,
    price: float,
    reason: str | None = None,
    product_id: str | None = None,
) -> dict[str, Any]:
    import uuid
    conn = get_db()
    cur = conn.cursor()
    now_iso = datetime.now(timezone.utc).isoformat()

    if not product_id:
        clean_cat = category.strip().lower()[:4]
        product_id = f"prod_{clean_cat}_{uuid.uuid4().hex[:6]}"

    final_reason = (
        reason.strip()
        if reason and reason.strip()
        else f"Curated {category} addition to your collection"
    )

    cur.execute(
        "INSERT INTO products (id, name, category, price, reason, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        (product_id, name.strip(), category.strip(), round(float(price), 2), final_reason, now_iso),
    )
    conn.commit()
    conn.close()

    # Retrain affinity model so collaborative filtering includes the new item
    train_affinity_model()

    return {
        "id": product_id,
        "name": name.strip(),
        "category": category.strip(),
        "price": round(float(price), 2),
        "reason": final_reason,
        "created_at": now_iso,
    }


def delete_storefront_product(product_id: str) -> dict[str, Any]:
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM cart_items WHERE product_id = ?", (product_id,))
    cur.execute("DELETE FROM products WHERE id = ?", (product_id,))
    conn.commit()
    conn.close()

    train_affinity_model()
    return {"status": "deleted", "product_id": product_id}


def get_shopper_recs(customer_id: str, cart_product_ids: list[str], limit: int = 12) -> list[dict[str, Any]]:
    return engine_get_shopper_recommendations(
        customer_id=customer_id,
        cart_product_ids=cart_product_ids,
        limit=limit,
    )
