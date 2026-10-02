from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db
from ..ml.engine import get_recommendations_for_user

router = APIRouter(
    prefix="/recommendations",
    tags=["recommendations"]
)

@router.get("/{customer_id}", response_model=List[schemas.RecommendationResponse])
def get_recommendations(customer_id: int, db: Session = Depends(get_db)):
    # 1. Fetch user transactions
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    transactions = db.query(models.Transaction).filter(models.Transaction.customer_id == customer_id).all()
    
    # Extract purchased products for this user
    user_purchases = []
    for tx in transactions:
        prod = db.query(models.Product).filter(models.Product.id == tx.product_id).first()
        if prod:
            user_purchases.append({
                "id": prod.id,
                "category": prod.category,
                "brand": prod.brand,
                "tags": prod.tags,
                "description": prod.description
            })
            
    # 2. Fetch all products
    all_products = db.query(models.Product).all()
    all_products_data = [{
        "id": p.id,
        "product_ref": p.product_ref,
        "title": p.title,
        "category": p.category,
        "brand": p.brand,
        "tags": p.tags,
        "description": p.description
    } for p in all_products]
    
    # 3. Call ML Engine
    recommendations = get_recommendations_for_user(user_purchases, all_products_data)
    
    return recommendations
