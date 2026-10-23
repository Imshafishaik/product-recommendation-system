from fastapi import FastAPI
from .auth_view import router as auth_router
from .customer_view import router as customer_router
from .overview_view import router as overview_router
from .recommendation_view import router as recommendation_router
from .campaign_view import router as campaign_router
from .transaction_view import router as transaction_router


def register_views(app: FastAPI) -> None:
    app.include_router(overview_router)
    app.include_router(auth_router)
    app.include_router(customer_router)
    app.include_router(recommendation_router)
    app.include_router(campaign_router)
    app.include_router(transaction_router)


__all__ = [
    "register_views",
    "auth_router",
    "customer_router",
    "overview_router",
    "recommendation_router",
    "campaign_router",
    "transaction_router",
]
