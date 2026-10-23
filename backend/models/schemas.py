from datetime import datetime
from typing import Any, Literal
from pydantic import BaseModel


class Transaction(BaseModel):
    customer_id: str
    product_id: str
    amount: float
    purchased_at: datetime


class LoginRequest(BaseModel):
    email: str
    password: str


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict[str, Any]


class CartEvent(BaseModel):
    customer_id: str
    product_id: str
    event: Literal["add_to_cart", "remove_from_cart", "purchase", "clear_cart"]
    occurred_at: datetime


class Product(BaseModel):
    id: str
    name: str
    category: str
    price: float
    reason: str


class ProductCreate(BaseModel):
    name: str
    category: str
    price: float
    reason: str | None = None
    id: str | None = None


class Recommendation(BaseModel):
    customer_id: str
    product_id: str
    reason: str
    confidence: float


class CustomerHealth(BaseModel):
    id: str
    name: str
    segment: str
    health_score: int
    frequency: int
    monetary: float
    recency_days: int


class JobStatus(BaseModel):
    job_id: str
    status: str
    accepted: int
    customers_scored: int | None = None


class CreateCampaignRequest(BaseModel):
    name: str
    segment: str
    offer_type: str = "Discount"
    offer_value: str = "15% off"
