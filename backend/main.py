import os
import sys

# Ensure backend root and local venv site-packages are in sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

venv_site_packages = os.path.join(BASE_DIR, ".venv/lib/python3.12/site-packages")
if os.path.exists(venv_site_packages) and venv_site_packages not in sys.path:
    sys.path.insert(0, venv_site_packages)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from models.database import init_db
from services.engine import train_affinity_model
from views import register_views

# Initialize database schema and train initial affinity model
init_db()
train_affinity_model()

app = FastAPI(
    title="MindsIT Recommendation Engine",
    version="0.1.0",
    description="Customer intelligence and recommendation engine built on FastAPI & PostgreSQL/SQLite",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register MVC Views / Routers
register_views(app)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
