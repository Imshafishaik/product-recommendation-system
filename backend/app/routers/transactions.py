from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import pandas as pd
from io import StringIO
from .. import models, schemas
from ..database import get_db

router = APIRouter(
    prefix="/transactions",
    tags=["transactions"]
)

@router.get("/", response_model=List[schemas.TransactionResponse])
def get_transactions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    transactions = db.query(models.Transaction).offset(skip).limit(limit).all()
    return transactions

@router.post("/", response_model=schemas.TransactionResponse)
def create_transaction(transaction: schemas.TransactionCreate, db: Session = Depends(get_db)):
    db_tx = models.Transaction(**transaction.model_dump())
    db.add(db_tx)
    db.commit()
    db.refresh(db_tx)
    return db_tx

@router.get("/{transaction_id}", response_model=schemas.TransactionResponse)
def get_transaction(transaction_id: int, db: Session = Depends(get_db)):
    tx = db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return tx

@router.post("/upload_csv")
async def upload_transactions_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload a CSV file.")
    
    contents = await file.read()
    try:
        df = pd.read_csv(StringIO(contents.decode('utf-8')))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading CSV: {e}")
    
    added_count = 0
    for _, row in df.iterrows():
        transaction_ref = str(row.get('transaction_ref', ''))
        if not transaction_ref:
            continue
        
        existing = db.query(models.Transaction).filter(models.Transaction.transaction_ref == transaction_ref).first()
        if existing:
            continue
        
        # Resolve customer_ref -> customer_id
        customer_id = None
        customer_ref = str(row.get('customer_ref', ''))
        if customer_ref:
            customer = db.query(models.Customer).filter(models.Customer.customer_ref == customer_ref).first()
            if customer:
                customer_id = customer.id
        
        if not customer_id:
            customer_id = int(row.get('customer_id', 0)) if row.get('customer_id') else None
        
        # Resolve product_ref -> product_id
        product_id = None
        product_ref = str(row.get('product_ref', ''))
        if product_ref:
            product = db.query(models.Product).filter(models.Product.product_ref == product_ref).first()
            if product:
                product_id = product.id
        
        if not product_id:
            product_id = int(row.get('product_id', 0)) if row.get('product_id') else None
        
        if not customer_id or not product_id:
            continue
        
        new_tx = models.Transaction(
            transaction_ref=transaction_ref,
            customer_id=customer_id,
            product_id=product_id,
            quantity=int(row.get('quantity', 1)),
        )
        db.add(new_tx)
        added_count += 1
    
    db.commit()
    return {"message": f"Successfully imported {added_count} new transactions."}
