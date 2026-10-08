from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import pandas as pd
from io import StringIO
from .. import models, schemas
from ..database import get_db

router = APIRouter(
    prefix="/customers",
    tags=["customers"]
)

@router.get("/", response_model=List[schemas.CustomerResponse])
def get_customers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    customers = db.query(models.Customer).offset(skip).limit(limit).all()
    return customers

@router.post("/", response_model=schemas.CustomerResponse)
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db)):
    db_customer = models.Customer(**customer.model_dump())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

@router.get("/{customer_id}", response_model=schemas.CustomerResponse)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.post("/upload_csv")
async def upload_customers_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload a CSV file.")
    
    contents = await file.read()
    try:
        df = pd.read_csv(StringIO(contents.decode('utf-8')))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading CSV: {e}")
    
    added_count = 0
    for _, row in df.iterrows():
        customer_ref = str(row.get('customer_ref', ''))
        if not customer_ref:
            continue
            
        # Check if exists
        existing = db.query(models.Customer).filter(models.Customer.customer_ref == customer_ref).first()
        if existing:
            continue
            
        new_customer = models.Customer(
            customer_ref=customer_ref,
            name=row.get('name', ''),
            email=row.get('email', ''),
            segment=row.get('segment', 'New')
        )
        db.add(new_customer)
        added_count += 1
        
    db.commit()
    return {"message": f"Successfully imported {added_count} new customers."}

