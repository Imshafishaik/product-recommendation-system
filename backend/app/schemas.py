from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ProductBase(BaseModel):
    product_ref: str
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    brand: Optional[str] = None
    price: Optional[float] = None
    tags: Optional[str] = None
    in_stock: bool = True

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    class Config:
        from_attributes = True

class CustomerBase(BaseModel):
    customer_ref: str
    name: Optional[str] = None
    email: Optional[str] = None
    segment: str = "New"

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: int
    class Config:
        from_attributes = True

class TransactionBase(BaseModel):
    transaction_ref: str
    customer_id: int
    product_id: int
    quantity: int = 1
    timestamp: datetime = datetime.utcnow()

class TransactionCreate(TransactionBase):
    pass

class TransactionResponse(TransactionBase):
    id: int
    class Config:
        from_attributes = True

class RecommendationResponse(BaseModel):
    product_id: int
    product_ref: str
    title: str
    score: float
    reason: str
