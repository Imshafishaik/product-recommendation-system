from typing import Any
from fastapi import APIRouter, Depends, Query
from models.schemas import Product, ProductCreate, Recommendation
from controllers.auth_controller import current_user
from controllers.recommendation_controller import (
    add_storefront_product,
    delete_storefront_product,
    generate_batch_recommendations,
    get_catalog,
    get_customer_recs,
    get_shopper_recs,
    get_studio_recommendations,
)

router = APIRouter(prefix="/api/v1", tags=["Recommendations & Storefront"])


@router.get("/recommendations")
def get_recommendations(user: dict[str, Any] = Depends(current_user)):
    return get_studio_recommendations()


@router.post("/recommendations/batch")
def generate_recommendation_batch(user: dict[str, Any] = Depends(current_user)):
    return generate_batch_recommendations()


@router.get("/customers/{customer_id}/recommendations", response_model=list[Recommendation])
def get_customer_recommendations_endpoint(customer_id: str, user: dict[str, Any] = Depends(current_user)):
    return get_customer_recs(customer_id=customer_id)


@router.get("/catalog", response_model=list[Product])
def catalog(user: dict[str, Any] = Depends(current_user)):
    return get_catalog()


@router.get("/products", response_model=list[Product])
def list_products(user: dict[str, Any] = Depends(current_user)):
    return get_catalog()


@router.post("/products", response_model=Product, status_code=201)
def create_storefront_item(product: ProductCreate, user: dict[str, Any] = Depends(current_user)):
    return add_storefront_product(
        name=product.name,
        category=product.category,
        price=product.price,
        reason=product.reason,
        product_id=product.id,
    )


@router.delete("/products/{product_id}")
def remove_storefront_item(product_id: str, user: dict[str, Any] = Depends(current_user)):
    return delete_storefront_product(product_id=product_id)


@router.get("/shopper/{customer_id}/recommendations", response_model=list[Product])
def shopper_recommendations(
    customer_id: str,
    cart_product_ids: str | None = Query(default=None),
    limit: int = Query(default=12),
    user: dict[str, Any] = Depends(current_user),
):
    cart_ids = [pid.strip() for pid in cart_product_ids.split(",") if pid.strip()] if cart_product_ids else []
    return get_shopper_recs(customer_id=customer_id, cart_product_ids=cart_ids, limit=limit)


@router.get("/shopper/{customer_id}/cart", response_model=list[Product])
def get_cart(customer_id: str, user: dict[str, Any] = Depends(current_user)):
    from controllers.transaction_controller import get_customer_cart
    return get_customer_cart(customer_id=customer_id)


@router.delete("/shopper/{customer_id}/cart")
def clear_cart(customer_id: str, user: dict[str, Any] = Depends(current_user)):
    from controllers.transaction_controller import clear_customer_cart
    return clear_customer_cart(customer_id=customer_id)

