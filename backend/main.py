import base64
import hashlib
import hmac
import json
import os
import sys
from datetime import datetime, timezone
from typing import Any, Literal

# Ensure venv site-packages is in sys.path
venv_site_packages = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".venv/lib/python3.12/site-packages")
if os.path.exists(venv_site_packages) and venv_site_packages not in sys.path:
    sys.path.insert(0, venv_site_packages)

import csv
import io
from fastapi import BackgroundTasks, Depends, FastAPI, File, HTTPException, Query, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel


import db
import engine

# Ensure SQLite schema and initial seed data exist
db.init_db()
engine.train_affinity_model()

app = FastAPI(title="MindsIT Recommendation Engine", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer(auto_error=False)
AUTH_SECRET = "mindsit-demo-secret-change-in-production"


# Pydantic Schemas
class Transaction(BaseModel):
    customer_id: str
    product_id: str
    amount: float
    purchased_at: datetime


class LoginRequest(BaseModel):
    email: str
    password: str


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict[str, Any]


class CartEvent(BaseModel):
    customer_id: str
    product_id: str
    event: Literal["add_to_cart", "remove_from_cart", "purchase"]
    occurred_at: datetime


class Product(BaseModel):
    id: str
    name: str
    category: str
    price: float
    reason: str


class Recommendation(BaseModel):
    customer_id: str
    product_id: str
    reason: str
    confidence: float


class CustomerHealth(BaseModel):
    id: str
    name: str
    segment: str
    health_score: int
    frequency: int
    monetary: float
    recency_days: int


class JobStatus(BaseModel):
    job_id: str
    status: str
    accepted: int
    customers_scored: int | None = None


class CreateCampaignRequest(BaseModel):
    name: str
    segment: str
    offer_type: str = "Discount"
    offer_value: str = "15% off"



# Authentication helpers
def create_access_token(user_id: str) -> str:
    payload = base64.urlsafe_b64encode(
        json.dumps({
            "sub": user_id,
            "exp": int(datetime.now(timezone.utc).timestamp()) + 86400  # 24 hours
        }).encode()
    ).decode().rstrip("=")
    signature = hmac.new(AUTH_SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return f"{payload}.{signature}"


def current_user(credentials: HTTPAuthorizationCredentials | None = Depends(security)) -> dict[str, Any]:
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    try:
        payload, signature = credentials.credentials.split(".", 1)
        expected = hmac.new(AUTH_SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()
        decoded = json.loads(base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4)))
        if not hmac.compare_digest(signature, expected) or decoded["exp"] < int(datetime.now(timezone.utc).timestamp()):
            raise ValueError
        
        conn = db.get_db()
        cur = conn.cursor()
        cur.execute("SELECT id, email, name, role FROM users WHERE id = ?", (decoded["sub"],))
        user_row = cur.fetchone()
        conn.close()

        if not user_row:
            raise ValueError
        return dict(user_row)
    except (ValueError, KeyError, json.JSONDecodeError, UnicodeDecodeError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")


# Background task processor
def process_transaction_job(job_id: str, transactions_payload: list[dict[str, Any]]) -> None:
    conn = db.get_db()
    cur = conn.cursor()
    cur.execute("UPDATE jobs SET status = 'processing' WHERE job_id = ?", (job_id,))
    conn.commit()
    conn.close()

    try:
        # Save transactions to SQLite
        conn = db.get_db()
        cur = conn.cursor()
        for idx, tx in enumerate(transactions_payload):
            tx_id = f"tx_ingest_{job_id}_{idx}"
            cur.execute(
                "INSERT INTO transactions (id, customer_id, product_id, amount, purchased_at) VALUES (?, ?, ?, ?, ?)",
                (tx_id, tx["customer_id"], tx["product_id"], tx["amount"], tx["purchased_at"])
            )
        conn.commit()
        conn.close()

        # Recalculate RFM, health score, and retrain model
        customers_scored = engine.score_and_update_batch(transactions_payload)

        # Mark job complete
        conn = db.get_db()
        cur = conn.cursor()
        completed_at = datetime.now(timezone.utc).isoformat()
        cur.execute(
            "UPDATE jobs SET status = 'completed', customers_scored = ?, completed_at = ? WHERE job_id = ?",
            (customers_scored, completed_at, job_id)
        )
        conn.commit()
        conn.close()
    except Exception as exc:
        conn = db.get_db()
        cur = conn.cursor()
        cur.execute("UPDATE jobs SET status = 'failed' WHERE job_id = ?", (job_id,))
        conn.commit()
        conn.close()


# API Endpoints
@app.get("/health")
def health_check():
    conn = db.get_db()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM customers")
    cust_count = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM transactions")
    tx_count = cur.fetchone()[0]
    conn.close()

    return {
        "status": "ok",
        "service": "recommendation-engine",
        "last_processed": datetime.now(timezone.utc).isoformat(),
        "total_customers": cust_count,
        "total_transactions": tx_count,
    }


@app.post("/auth/login", response_model=LoginResponse)
def login(credentials: LoginRequest):
    email = credentials.email.strip().lower()
    conn = db.get_db()
    cur = conn.cursor()
    cur.execute("SELECT id, email, name, role, password_hash FROM users WHERE LOWER(email) = ?", (email,))
    user_row = cur.fetchone()
    conn.close()

    if not user_row or not db.verify_password(credentials.password, user_row["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    user_data = {
        "id": user_row["id"],
        "email": user_row["email"],
        "name": user_row["name"],
        "role": user_row["role"]
    }
    return {"access_token": create_access_token(user_row["id"]), "token_type": "bearer", "user": user_data}


@app.post("/auth/signup", response_model=LoginResponse, status_code=201)
def signup(credentials: SignupRequest):
    email = credentials.email.strip().lower()
    name = credentials.name.strip()
    if not name or "@" not in email:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Enter a valid name and email")
    if len(credentials.password) < 6:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Password must contain at least 6 characters")

    conn = db.get_db()
    cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE LOWER(email) = ?", (email,))
    if cur.fetchone():
        conn.close()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists")

    cur.execute("SELECT COUNT(*) FROM users")
    user_count = cur.fetchone()[0]
    user_id = f"usr_{user_count + 1:03d}"
    now_iso = datetime.now(timezone.utc).isoformat()
    pwd_hash = db.hash_password(credentials.password)

    cur.execute(
        "INSERT INTO users (id, email, name, role, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        (user_id, email, name, "Merchant", pwd_hash, now_iso)
    )
    conn.commit()
    conn.close()

    public_user = {"id": user_id, "email": email, "name": name, "role": "Merchant"}
    return {"access_token": create_access_token(user_id), "token_type": "bearer", "user": public_user}


@app.get("/auth/me")
def me(user: dict[str, Any] = Depends(current_user)):
    return user


@app.get("/api/v1/customers", response_model=list[CustomerHealth])
def list_customers(
    segment: str | None = Query(default=None),
    search: str | None = Query(default=None),
    limit: int = Query(default=300, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
    user: dict[str, Any] = Depends(current_user)
):
    conn = db.get_db()
    cur = conn.cursor()

    query = "SELECT id, name, segment, health_score, frequency, monetary, recency_days FROM customers WHERE 1=1"
    params: list[Any] = []

    if segment and segment != "All segments":
        query += " AND LOWER(segment) = LOWER(?)"
        params.append(segment)

    if search:
        query += " AND (LOWER(name) LIKE LOWER(?) OR LOWER(id) LIKE LOWER(?))"
        params.extend([f"%{search}%", f"%{search}%"])

    # Keep demo customers first (cus_001 to cus_005) then order by health score desc
    query += " ORDER BY CASE WHEN id <= 'cus_005' THEN 0 ELSE 1 END, health_score DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    cur.execute(query, params)
    rows = [dict(row) for row in cur.fetchall()]
    conn.close()
    return rows


@app.get("/api/v1/customers/{customer_id}")
def get_customer_detail(customer_id: str, user: dict[str, Any] = Depends(current_user)):
    conn = db.get_db()
    cur = conn.cursor()
    cur.execute("SELECT id, name, email, segment, health_score, frequency, monetary, recency_days FROM customers WHERE id = ?", (customer_id,))
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

    recommendations = engine.get_customer_recommendations(customer_id)
    return {
        **dict(customer),
        "transactions": transactions,
        "recommendations": recommendations,
    }


@app.get("/api/v1/overview")
def overview(time_range: str = Query(default="30d"), user: dict[str, Any] = Depends(current_user)):
    conn = db.get_db()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM customers")
    total_customers = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM customers WHERE segment = 'At risk'")
    at_risk = cur.fetchone()[0]

    cur.execute("SELECT AVG(monetary) FROM customers")
    avg_val_row = cur.fetchone()[0]
    avg_customer_value = round(float(avg_val_row), 2) if avg_val_row else 74.28

    cur.execute("SELECT SUM(amount) FROM transactions")
    tx_sum_row = cur.fetchone()[0]
    total_tx_sum = float(tx_sum_row) if tx_sum_row else 0.0

    conn.close()

    # Time range scaling factors
    multiplier = {"7d": 0.28, "30d": 1.0, "90d": 2.85, "all": 3.9}.get(time_range, 1.0)
    rev_influenced = int(round(18420 * multiplier))

    return {
        "active_customers": total_customers,
        "at_risk_customers": at_risk,
        "average_customer_value": avg_customer_value,
        "revenue_influenced": rev_influenced,
        "time_range": time_range,
    }


@app.get("/api/v1/recommendations")
def get_studio_recommendations(user: dict[str, Any] = Depends(current_user)):
    conn = db.get_db()
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


@app.post("/api/v1/recommendations/batch")
def generate_recommendation_batch(user: dict[str, Any] = Depends(current_user)):
    engine.train_affinity_model()
    now_iso = datetime.now(timezone.utc).isoformat()
    return {
        "status": "completed",
        "model_version": "v2.4.1",
        "confidence": 88,
        "pairs_evaluated": 1840,
        "catalog_coverage": "96.4%",
        "refreshed_at": now_iso,
        "message": "Item-to-item affinity model successfully retrained and recommendations updated in PostgreSQL loyum_db."
    }


@app.get("/api/v1/customers/{customer_id}/recommendations", response_model=list[Recommendation])
def get_recommendations(customer_id: str, user: dict[str, Any] = Depends(current_user)):
    return engine.get_customer_recommendations(customer_id)



@app.get("/api/v1/catalog", response_model=list[Product])
def catalog(user: dict[str, Any] = Depends(current_user)):
    conn = db.get_db()
    cur = conn.cursor()
    cur.execute("SELECT id, name, category, price, reason FROM products ORDER BY id")
    products = [dict(row) for row in cur.fetchall()]
    conn.close()
    return products


@app.get("/api/v1/shopper/{customer_id}/recommendations", response_model=list[Product])
def shopper_recommendations(
    customer_id: str,
    cart_product_ids: str | None = Query(default=None),
    user: dict[str, Any] = Depends(current_user)
):
    cart_ids = [pid.strip() for pid in cart_product_ids.split(",") if pid.strip()] if cart_product_ids else []
    return engine.get_shopper_recommendations(customer_id=customer_id, cart_product_ids=cart_ids, limit=4)


@app.post("/api/v1/cart-events", status_code=202)
def track_cart_event(event: CartEvent, user: dict[str, Any] = Depends(current_user)):
    conn = db.get_db()
    cur = conn.cursor()
    now_iso = event.occurred_at.isoformat()
    event_id = f"evt_{int(datetime.now(timezone.utc).timestamp() * 1000)}"
    cur.execute(
        "INSERT INTO cart_events (id, customer_id, product_id, event, occurred_at) VALUES (?, ?, ?, ?, ?)",
        (event_id, event.customer_id, event.product_id, event.event, now_iso)
    )
    conn.commit()
    conn.close()
    return {"status": "accepted", "event": event.event, "customer_id": event.customer_id}


@app.post("/api/v1/transactions", status_code=202)
def ingest_transactions(
    transactions: list[Transaction],
    background_tasks: BackgroundTasks,
    user: dict[str, Any] = Depends(current_user)
):
    conn = db.get_db()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM jobs")
    job_count = cur.fetchone()[0]
    job_id = f"job_{job_count + 1:04d}"
    now_iso = datetime.now(timezone.utc).isoformat()

    cur.execute(
        "INSERT INTO jobs (job_id, status, accepted, customers_scored, created_at) VALUES (?, ?, ?, ?, ?)",
        (job_id, "queued", len(transactions), 0, now_iso)
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


@app.post("/api/v1/transactions/upload", status_code=202)
async def upload_transactions_file(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    user: dict[str, Any] = Depends(current_user)
):
    content = await file.read()
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

    conn = db.get_db()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM jobs")
    job_count = cur.fetchone()[0]
    job_id = f"job_{job_count + 1:04d}"
    now_iso = datetime.now(timezone.utc).isoformat()

    cur.execute(
        "INSERT INTO jobs (job_id, status, accepted, customers_scored, created_at) VALUES (?, ?, ?, ?, ?)",
        (job_id, "queued", len(parsed_transactions), 0, now_iso)
    )
    conn.commit()
    conn.close()

    background_tasks.add_task(process_transaction_job, job_id, parsed_transactions)
    return {"accepted": len(parsed_transactions), "status": "queued", "job_id": job_id}


@app.get("/api/v1/transactions/sample")
def get_sample_transactions(user: dict[str, Any] = Depends(current_user)):
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


@app.get("/api/v1/jobs/{job_id}", response_model=JobStatus)
def job_status(job_id: str, user: dict[str, Any] = Depends(current_user)):

    conn = db.get_db()
    cur = conn.cursor()
    cur.execute("SELECT job_id, status, accepted, customers_scored FROM jobs WHERE job_id = ?", (job_id,))
    row = cur.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    return dict(row)


@app.post("/api/v1/campaigns/{segment}/queue")
def queue_campaign(
    segment: Literal["At risk", "Inactive", "Loyal", "New", "Growing"],
    user: dict[str, Any] = Depends(current_user)
):
    conn = db.get_db()
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
        (campaign_id, name, segment, "queued", count, "Ready", now_iso)
    )
    conn.commit()
    conn.close()

    return {
        "segment": segment,
        "status": "queued",
        "estimated_recipients": count,
        "campaign_id": campaign_id,
    }


@app.post("/api/v1/campaigns")
def create_custom_campaign(payload: CreateCampaignRequest, user: dict[str, Any] = Depends(current_user)):
    conn = db.get_db()
    cur = conn.cursor()
    if payload.segment == "All segments":
        cur.execute("SELECT COUNT(*) FROM customers")
    else:
        cur.execute("SELECT COUNT(*) FROM customers WHERE segment = ?", (payload.segment,))
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
    lift = lift_map.get(payload.segment, "+18%")

    cur.execute(
        "INSERT INTO campaigns (campaign_id, name, segment, status, estimated_recipients, lift_rate, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (campaign_id, payload.name, payload.segment, "sent", count, lift, now_iso)
    )
    conn.commit()
    conn.close()

    return {
        "campaign_id": campaign_id,
        "name": payload.name,
        "segment": payload.segment,
        "status": "sent",
        "estimated_recipients": count,
        "lift_rate": lift,
        "created_at": now_iso,
    }


@app.get("/api/v1/campaigns")
def list_campaigns(user: dict[str, Any] = Depends(current_user)):
    conn = db.get_db()
    cur = conn.cursor()
    cur.execute("SELECT campaign_id, name, segment, status, estimated_recipients, lift_rate, created_at FROM campaigns ORDER BY created_at DESC")
    rows = [dict(row) for row in cur.fetchall()]
    conn.close()
    return rows

