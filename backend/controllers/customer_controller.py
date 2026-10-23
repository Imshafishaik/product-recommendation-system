from typing import Any
from fastapi import HTTPException, status
from models.database import get_db
from services.engine import get_customer_recommendations


def get_customers(
    segment: str | None = None,
    search: str | None = None,
    limit: int = 300,
    offset: int = 0,
) -> list[dict[str, Any]]:
    conn = get_db()
    cur = conn.cursor()

    query = "SELECT id, name, segment, health_score, frequency, monetary, recency_days FROM customers WHERE 1=1"
    params: list[Any] = []

    if segment and segment != "All segments":
        query += " AND LOWER(segment) = LOWER(?)"
        params.append(segment)

    if search:
        query += " AND (LOWER(name) LIKE LOWER(?) OR LOWER(id) LIKE LOWER(?))"
        params.extend([f"%{search}%", f"%{search}%"])

    query += " ORDER BY CASE WHEN id <= 'cus_005' THEN 0 ELSE 1 END, health_score DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    cur.execute(query, params)
    rows = [dict(row) for row in cur.fetchall()]
    conn.close()
    return rows


def get_customer_detail(customer_id: str) -> dict[str, Any]:
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "SELECT id, name, email, segment, health_score, frequency, monetary, recency_days FROM customers WHERE id = ?",
        (customer_id,),
    )
    customer = cur.fetchone()
    if not customer:
        conn.close()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    cur.execute("""
        SELECT t.id, t.product_id, p.name as product_name, p.category, t.amount, t.purchased_at
        FROM transactions t
        LEFT JOIN products p ON t.product_id = p.id
        WHERE t.customer_id = ?
        ORDER BY t.purchased_at DESC
        LIMIT 25
    """, (customer_id,))
    transactions = [dict(r) for r in cur.fetchall()]
    conn.close()

    recommendations = get_customer_recommendations(customer_id)
    return {
        **dict(customer),
        "transactions": transactions,
        "recommendations": recommendations,
    }
