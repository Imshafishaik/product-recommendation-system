from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import models
from ..database import get_db
from ..ml.rfm import compute_rfm_and_segment

router = APIRouter(
    prefix="/analytics",
    tags=["analytics"]
)

@router.get("/dashboard")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_customers = db.query(models.Customer).count()
    total_products = db.query(models.Product).count()
    total_transactions = db.query(models.Transaction).count()
    in_stock_products = db.query(models.Product).filter(models.Product.in_stock == True).count()

    # Segment counts
    segments = db.query(models.Customer.segment, models.Customer.id).all()
    segment_counts = {}
    for seg, _ in segments:
        segment_counts[seg] = segment_counts.get(seg, 0) + 1

    at_risk = segment_counts.get("At-Risk", 0)

    return {
        "total_customers": total_customers,
        "total_products": total_products,
        "total_transactions": total_transactions,
        "in_stock_products": in_stock_products,
        "at_risk_customers": at_risk,
        "segment_distribution": segment_counts
    }

@router.post("/compute_rfm")
def compute_rfm(db: Session = Depends(get_db)):
    """Runs RFM analysis and updates customer segments in DB."""
    customers = db.query(models.Customer).all()
    transactions = db.query(models.Transaction).all()
    
    if not transactions:
        return {"message": "No transactions found. Import transaction data first."}
    
    updated = compute_rfm_and_segment(customers, transactions, db)
    return {"message": f"RFM computed. {updated} customer segments updated."}

@router.get("/rfm_segments")
def get_rfm_segments(db: Session = Depends(get_db)):
    """Returns all customers with their RFM segment."""
    customers = db.query(models.Customer).all()
    return [
        {
            "id": c.id,
            "customer_ref": c.customer_ref,
            "name": c.name,
            "email": c.email,
            "segment": c.segment,
        }
        for c in customers
    ]
