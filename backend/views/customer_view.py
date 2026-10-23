from typing import Any
from fastapi import APIRouter, Depends, Query
from models.schemas import CustomerHealth
from controllers.auth_controller import current_user
from controllers.customer_controller import get_customers, get_customer_detail

router = APIRouter(prefix="/api/v1", tags=["Customers"])


@router.get("/customers", response_model=list[CustomerHealth])
def list_customers(
    segment: str | None = Query(default=None),
    search: str | None = Query(default=None),
    limit: int = Query(default=300, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
    user: dict[str, Any] = Depends(current_user),
):
    return get_customers(segment=segment, search=search, limit=limit, offset=offset)


@router.get("/customers/{customer_id}")
def customer_detail(customer_id: str, user: dict[str, Any] = Depends(current_user)):
    return get_customer_detail(customer_id=customer_id)
