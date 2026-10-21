# MindsIT Recommendation Engine

A product recommendation and customer retention engine proof of concept for Loyum merchants. The workspace contains a Vite React dashboard and a FastAPI service with seeded data, RFM-oriented customer segments, recommendation endpoints, and asynchronous campaign ingestion scaffolding.

## Frontend

The React application lives in `frontend/`.

```powershell
cd frontend
npm install
npm run dev
```

Open the local Vite URL shown in the terminal. The primary experience is a merchant dashboard for customer health, RFM segments, recommendations, and retention campaigns. Use **Shopper preview** in the left navigation to open a checkout-style demo that recommends products and sends add-to-cart events to the API.

Sign in with the seeded demo account:

```text
Email: demo@mindsit.com
Password: demo123
```

## FastAPI service

From the project root (`C:\Users\Dell\final-project`):

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
uvicorn backend.main:app --reload --port 8000
```

API docs are available at `http://localhost:8000/docs` while the service is running. `GET /health` and `POST /auth/login` are public; all `/api/v1/*` routes require the bearer token returned by login.

The shopper demo uses these endpoints:

- `GET /api/v1/catalog`
- `GET /api/v1/shopper/{customer_id}/recommendations?cart_product_ids=...`
- `POST /api/v1/cart-events`
- `POST /api/v1/transactions` returns a queued `job_id`
- `GET /api/v1/jobs/{job_id}` polls asynchronous processing status

Authentication:

- `POST /auth/login`
- `POST /auth/signup`
- `GET /auth/me`

Signup requires a name, valid email, and password with at least six characters. New accounts receive the `Merchant` role and are signed in immediately. The current POC stores users in memory; use a persistent identity provider and hashed passwords for production.

If your terminal is already inside `backend`, use:

```powershell
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Database Configuration

The backend is connected to the PostgreSQL database **`loyum_db`**:

- Host: `localhost`
- Port: `5432`
- Database: `loyum_db`
- Connection URL: `postgresql://localhost:5432/loyum_db` (or JDBC `jdbc:postgresql://localhost:5432/postgres` selecting `loyum_db` under Databases)
- Driver: `psycopg2-binary`
- Fallback: Automatic SQLite fallback (`backend/recommendation_engine.db`) if PostgreSQL is temporarily unavailable.

Environment overrides (optional):
```bash
export DATABASE_URL="postgresql://postgres@localhost:5432/loyum_db"
export POSTGRES_USER="postgres"
export POSTGRES_PASSWORD=""
export POSTGRES_HOST="localhost"
export POSTGRES_PORT="5432"
export POSTGRES_DB="loyum_db"
```

## Project direction

- `backend/main.py` provides the service contract, seeded data, PostgreSQL transaction processing, and RFM scoring.
- Authentication is implemented with a signed one-hour demo bearer token.
- The async processing boundary is represented by the transaction ingestion job response.
- The merchant dashboard is the main product surface; the shopper preview demonstrates the end-customer checkout use case required by the recommendation engine.
- Transactions, users, and customer health are stored directly in PostgreSQL `loyum_db`.
- The UI loads customer and overview data from FastAPI and falls back to local seeded data when the API is offline.

