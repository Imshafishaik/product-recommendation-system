from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import recommendations, customers, products, auth, transactions, analytics

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Product Recommendation API",
    description="API for Product Recommendations & Customer Retention Engine",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(recommendations.router)
app.include_router(customers.router)
app.include_router(products.router)
app.include_router(auth.router)
app.include_router(transactions.router)
app.include_router(analytics.router)

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "API is running!"}
