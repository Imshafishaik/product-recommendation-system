import urllib.request
import json
import time

base = "http://localhost:8000"

# 1. Login
req = urllib.request.Request(
    f"{base}/auth/login",
    data=json.dumps({"email": "demo@mindsit.com", "password": "demo123"}).encode(),
    headers={"Content-Type": "application/json"}
)
with urllib.request.urlopen(req) as resp:
    login_data = json.loads(resp.read().decode())
token = login_data["access_token"]
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
print("[PASS] Login successful for user:", login_data["user"]["name"])

# 2. Overview
req = urllib.request.Request(f"{base}/api/v1/overview", headers=headers)
with urllib.request.urlopen(req) as resp:
    overview = json.loads(resp.read().decode())
print("[PASS] Overview:", overview)

# 3. Customers
req = urllib.request.Request(f"{base}/api/v1/customers", headers=headers)
with urllib.request.urlopen(req) as resp:
    customers = json.loads(resp.read().decode())
first_cust = customers[0]
print(f"[PASS] Customers count: {len(customers)}, first customer: {first_cust['name']} ({first_cust['segment']}, health: {first_cust['health_score']})")

# 4. Catalog
req = urllib.request.Request(f"{base}/api/v1/catalog", headers=headers)
with urllib.request.urlopen(req) as resp:
    catalog = json.loads(resp.read().decode())
print(f"[PASS] Catalog count: {len(catalog)}, first product: {catalog[0]['name']}")

# 5. Shopper Recommendations with Cart
req = urllib.request.Request(f"{base}/api/v1/shopper/cus_001/recommendations?cart_product_ids=prod_bundle_01", headers=headers)
with urllib.request.urlopen(req) as resp:
    shopper_recs = json.loads(resp.read().decode())
print(f"[PASS] Shopper recs count: {len(shopper_recs)}, top rec: {shopper_recs[0]['name']} - {shopper_recs[0]['reason']}")

# 6. Cart event
cart_event = {"customer_id": "cus_001", "product_id": "prod_bundle_01", "event": "add_to_cart", "occurred_at": "2026-10-19T14:00:00Z"}
req = urllib.request.Request(f"{base}/api/v1/cart-events", data=json.dumps(cart_event).encode(), headers=headers)
with urllib.request.urlopen(req) as resp:
    cart_res = json.loads(resp.read().decode())
print("[PASS] Cart event recorded:", cart_res)

# 7. Campaign queue
req = urllib.request.Request(f"{base}/api/v1/campaigns/At%20risk/queue", data=b"", headers=headers)
with urllib.request.urlopen(req) as resp:
    cmp_res = json.loads(resp.read().decode())
print("[PASS] Campaign queued:", cmp_res)

# 8. Transaction ingestion & async job
tx_payload = [
    {"customer_id": "cus_002", "product_id": "prod_bundle_01", "amount": 64.0, "purchased_at": "2026-10-19T14:30:00Z"},
    {"customer_id": "cus_002", "product_id": "prod_reward_04", "amount": 42.5, "purchased_at": "2026-10-19T14:35:00Z"}
]
req = urllib.request.Request(f"{base}/api/v1/transactions", data=json.dumps(tx_payload).encode(), headers=headers)
with urllib.request.urlopen(req) as resp:
    tx_res = json.loads(resp.read().decode())
job_id = tx_res["job_id"]
print("[PASS] Ingested transactions, job_id:", job_id)

time.sleep(1)  # wait for background task
req = urllib.request.Request(f"{base}/api/v1/jobs/{job_id}", headers=headers)
with urllib.request.urlopen(req) as resp:
    job_status = json.loads(resp.read().decode())
print("[PASS] Job status after async processing:", job_status)

# 9. Signup new merchant user
test_email = f"merchant_{int(time.time())}@mindsit.com"
new_user_payload = {"name": "Jean Dupont", "email": test_email, "password": "securepassword123"}
req = urllib.request.Request(f"{base}/auth/signup", data=json.dumps(new_user_payload).encode(), headers={"Content-Type": "application/json"})
with urllib.request.urlopen(req) as resp:
    signup_res = json.loads(resp.read().decode())
print("[PASS] Signup new merchant:", signup_res["user"]["name"], "role:", signup_res["user"]["role"])

