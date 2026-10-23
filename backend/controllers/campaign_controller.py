from datetime import datetime, timezone
from typing import Any
from models.database import get_db


def queue_segment_campaign(segment: str) -> dict[str, Any]:
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM customers WHERE segment = ?", (segment,))
    count = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM campaigns")
    cmp_count = cur.fetchone()[0]
    campaign_id = f"cmp_demo_{1000 + cmp_count + 1}"
    now_iso = datetime.now(timezone.utc).isoformat()

    name = f"{segment} retention offer"
    cur.execute(
        "INSERT INTO campaigns (campaign_id, name, segment, status, estimated_recipients, lift_rate, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (campaign_id, name, segment, "queued", count, "Ready", now_iso),
    )
    conn.commit()
    conn.close()

    return {
        "segment": segment,
        "status": "queued",
        "estimated_recipients": count,
        "campaign_id": campaign_id,
    }


def create_custom_campaign(name: str, segment: str, offer_type: str = "Discount", offer_value: str = "15% off") -> dict[str, Any]:
    conn = get_db()
    cur = conn.cursor()
    if segment == "All segments":
        cur.execute("SELECT COUNT(*) FROM customers")
    else:
        cur.execute("SELECT COUNT(*) FROM customers WHERE segment = ?", (segment,))
    count = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM campaigns")
    cmp_count = cur.fetchone()[0]
    campaign_id = f"cmp_custom_{1000 + cmp_count + 1}"
    now_iso = datetime.now(timezone.utc).isoformat()

    lift_map = {
        "At risk": "+18%",
        "Inactive": "+12%",
        "Loyal": "+25%",
        "New": "+21%",
        "Growing": "+15%",
        "All segments": "+16%",
    }
    lift = lift_map.get(segment, "+18%")

    cur.execute(
        "INSERT INTO campaigns (campaign_id, name, segment, status, estimated_recipients, lift_rate, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (campaign_id, name, segment, "sent", count, lift, now_iso),
    )
    conn.commit()
    conn.close()

    return {
        "campaign_id": campaign_id,
        "name": name,
        "segment": segment,
        "status": "sent",
        "estimated_recipients": count,
        "lift_rate": lift,
        "created_at": now_iso,
    }


def list_campaigns() -> list[dict[str, Any]]:
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "SELECT campaign_id, name, segment, status, estimated_recipients, lift_rate, created_at FROM campaigns ORDER BY created_at DESC"
    )
    rows = [dict(row) for row in cur.fetchall()]
    conn.close()
    return rows
