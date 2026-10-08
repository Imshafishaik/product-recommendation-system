from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import pandas as pd
from io import StringIO
from .. import models, schemas
from ..database import get_db

router = APIRouter(
    prefix="/products",
    tags=["products"]
)

@router.get("/", response_model=List[schemas.ProductResponse])
def get_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    products = db.query(models.Product).offset(skip).limit(limit).all()
    return products

@router.post("/", response_model=schemas.ProductResponse)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    db_product = models.Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.get("/{product_id}", response_model=schemas.ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("/upload_csv")
async def upload_products_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload a CSV file.")
    
    contents = await file.read()
    try:
        df = pd.read_csv(StringIO(contents.decode('utf-8')))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading CSV: {e}")
    
    added_count = 0
    for _, row in df.iterrows():
        product_ref = str(row.get('product_ref', ''))
        if not product_ref:
            continue
            
        existing = db.query(models.Product).filter(models.Product.product_ref == product_ref).first()
        if existing:
            continue
            
        new_product = models.Product(
            product_ref=product_ref,
            title=row.get('title', ''),
            description=row.get('description', ''),
            category=row.get('category', ''),
            subcategory=row.get('subcategory', ''),
            brand=row.get('brand', ''),
            price=float(row.get('price', 0.0)) if not pd.isna(row.get('price')) else 0.0,
            tags=row.get('tags', ''),
            in_stock=bool(row.get('in_stock', True))
        )
        db.add(new_product)
        added_count += 1
        
    db.commit()
    return {"message": f"Successfully imported {added_count} new products."}
