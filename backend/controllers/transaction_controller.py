import csv
import io
import json
from datetime import datetime, timezone
from typing import Any
from fastapi import BackgroundTasks, HTTPException, status
from models.database import get_db
from services.engine import score_and_update_batch, train_affinity_model


def process_transaction_job(job_id: str, transactions_payload: list[dict[str, Any]]) -> None:
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE jobs SET status = 'processing' WHERE job_id = ?", (job_id,))
    conn.commit()
    conn.close()

    try:
        conn = get_db()
        cur = conn.cursor()
        for idx, tx in enumerate(transactions_payload):
            tx_id = f"tx_ingest_{job_id}_{idx}"
            cur.execute(
                "INSERT INTO transactions (id, customer_id, product_id, amount, purchased_at) VALUES (?, ?, ?, ?, ?)",
                (tx_id, tx["customer_id"], tx["product_id"], tx["amount"], tx["purchased_at"]),
            )
        conn.commit()
        conn.close()

        customers_scored = score_and_update_batch(transactions_payload)

        conn = get_db()
        cur = conn.cursor()
        completed_at = datetime.now(timezone.utc).isoformat()
        cur.execute(
            "UPDATE jobs SET status = 'completed', customers_scored = ?, completed_at = ? WHERE job_id = ?",
            (customers_scored, completed_at, job_id),
        )
        conn.commit()
        conn.close()
    except Exception:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("UPDATE jobs SET status = 'failed' WHERE job_id = ?", (job_id,))
        conn.commit()
        conn.close()


def track_cart_event(customer_id: str, product_id: str, event: str, occurred_at: datetime) -> dict[str, Any]:
    conn = get_db()
    cur = conn.cursor()
    now_iso = occurred_at.isoformat()
    event_id = f"evt_{int(datetime.now(timezone.utc).timestamp() * 1000)}"
    cur.execute(
        "INSERT INTO cart_events (id, customer_id, product_id, event, occurred_at) VALUES (?, ?, ?, ?, ?)",
        (event_id, customer_id, product_id, event, now_iso),
    )

    if event == "add_to_cart":
        cur.execute(
            "SELECT id FROM cart_items WHERE customer_id = ? AND product_id = ?",
            (customer_id, product_id),
        )
        if not cur.fetchone():
            item_id = f"cart_{customer_id}_{product_id}"
            cur.execute(
                "INSERT INTO cart_items (id, customer_id, product_id, added_at) VALUES (?, ?, ?, ?)",
                (item_id, customer_id, product_id, now_iso),
            )
    elif event == "remove_from_cart":
        cur.execute(
            "DELETE FROM cart_items WHERE customer_id = ? AND product_id = ?",
            (customer_id, product_id),
        )
    elif event in ("purchase", "clear_cart"):
        cur.execute(
            "DELETE FROM cart_items WHERE customer_id = ?",
            (customer_id,),
        )

    conn.commit()
    conn.close()

    try:
        train_affinity_model()
    except Exception:
        pass

    return {"status": "accepted", "event": event, "customer_id": customer_id}


def get_customer_cart(customer_id: str) -> list[dict[str, Any]]:
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT p.id, p.name, p.category, p.price, p.reason
        FROM cart_items c
        JOIN products p ON c.product_id = p.id
        WHERE c.customer_id = ?
        ORDER BY c.added_at ASC
    """, (customer_id,))
    items = [dict(r) for r in cur.fetchall()]
    conn.close()
    return items


def clear_customer_cart(customer_id: str) -> dict[str, Any]:
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM cart_items WHERE customer_id = ?", (customer_id,))
    now_iso = datetime.now(timezone.utc).isoformat()
    event_id = f"evt_{int(datetime.now(timezone.utc).timestamp() * 1000)}"
    cur.execute(
        "INSERT INTO cart_events (id, customer_id, product_id, event, occurred_at) VALUES (?, ?, ?, ?, ?)",
        (event_id, customer_id, "all", "clear_cart", now_iso),
    )
    conn.commit()
    conn.close()
    return {"status": "cleared", "customer_id": customer_id}


def ingest_transactions(transactions: list[Any], background_tasks: BackgroundTasks) -> dict[str, Any]:
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM jobs")
    job_count = cur.fetchone()[0]
    job_id = f"job_{job_count + 1:04d}"
    now_iso = datetime.now(timezone.utc).isoformat()

    cur.execute(
        "INSERT INTO jobs (job_id, status, accepted, customers_scored, created_at) VALUES (?, ?, ?, ?, ?)",
        (job_id, "queued", len(transactions), 0, now_iso),
    )
    conn.commit()
    conn.close()

    tx_dicts = [
        {
            "customer_id": tx.customer_id,
            "product_id": tx.product_id,
            "amount": tx.amount,
            "purchased_at": tx.purchased_at.isoformat(),
        }
        for tx in transactions
    ]

    background_tasks.add_task(process_transaction_job, job_id, tx_dicts)
    return {"accepted": len(transactions), "status": "queued", "job_id": job_id}


def parse_and_upload_transactions(content: bytes, background_tasks: BackgroundTasks) -> dict[str, Any]:
    text = content.decode("utf-8", errors="ignore").strip()

    parsed_transactions = []
    if text.startswith("[") or text.startswith("{"):
        data = json.loads(text)
        if isinstance(data, dict):
            data = [data]
        for item in data:
            parsed_transactions.append({
                "customer_id": str(item.get("customer_id") or item.get("customerId") or item.get("customer") or "cus_unknown"),
                "product_id": str(item.get("product_id") or item.get("productId") or item.get("product") or "prod_bundle_01"),
                "amount": float(item.get("amount") or item.get("price") or item.get("spend") or 50.0),
                "purchased_at": str(item.get("purchased_at") or item.get("date") or datetime.now(timezone.utc).isoformat()),
            })
    else:
        reader = csv.DictReader(io.StringIO(text))
        for row in reader:
            cid = row.get("customer_id") or row.get("customerId") or row.get("customer") or row.get("Customer ID") or "cus_unknown"
            pid = row.get("product_id") or row.get("productId") or row.get("product") or row.get("Product ID") or "prod_bundle_01"
            amount_val = row.get("amount") or row.get("price") or row.get("spend") or row.get("Amount") or "50.0"
            date_val = row.get("purchased_at") or row.get("date") or row.get("Purchased At") or datetime.now(timezone.utc).isoformat()
            try:
                amt = float(str(amount_val).replace("$", "").replace(",", "").strip())
            except Exception:
                amt = 50.0
            parsed_transactions.append({
                "customer_id": cid.strip(),
                "product_id": pid.strip(),
                "amount": amt,
                "purchased_at": date_val.strip(),
            })

    if not parsed_transactions:
        raise HTTPException(status_code=400, detail="No valid transactions found in file")

    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM jobs")
    job_count = cur.fetchone()[0]
    job_id = f"job_{job_count + 1:04d}"
    now_iso = datetime.now(timezone.utc).isoformat()

    cur.execute(
        "INSERT INTO jobs (job_id, status, accepted, customers_scored, created_at) VALUES (?, ?, ?, ?, ?)",
        (job_id, "queued", len(parsed_transactions), 0, now_iso),
    )
    conn.commit()
    conn.close()

    background_tasks.add_task(process_transaction_job, job_id, parsed_transactions)
    return {"accepted": len(parsed_transactions), "status": "queued", "job_id": job_id}


def get_sample_transactions() -> list[dict[str, Any]]:
    now = datetime.now(timezone.utc)
    return [
        {"customer_id": "cus_002", "product_id": "prod_bundle_01", "amount": 64.00, "purchased_at": now.isoformat()},
        {"customer_id": "cus_002", "product_id": "prod_reward_04", "amount": 42.50, "purchased_at": now.isoformat()},
        {"customer_id": "cus_004", "product_id": "prod_spring_02", "amount": 89.00, "purchased_at": now.isoformat()},
        {"customer_id": "cus_001", "product_id": "prod_fash_05", "amount": 115.00, "purchased_at": now.isoformat()},
        {"customer_id": "cus_003", "product_id": "prod_home_07", "amount": 36.00, "purchased_at": now.isoformat()},
        {"customer_id": "cus_005", "product_id": "prod_acc_03", "amount": 48.00, "purchased_at": now.isoformat()},
        {"customer_id": "cus_101", "product_id": "prod_bundle_01", "amount": 64.00, "purchased_at": now.isoformat()},
        {"customer_id": "cus_102", "product_id": "prod_spring_02", "amount": 89.00, "purchased_at": now.isoformat()},
    ]


def get_job_status(job_id: str) -> dict[str, Any]:
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT job_id, status, accepted, customers_scored FROM jobs WHERE job_id = ?", (job_id,))
    row = cur.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    return dict(row)
