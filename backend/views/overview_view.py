from typing import Any
from fastapi import APIRouter, Depends, Query
from controllers.auth_controller import current_user
from controllers.overview_controller import get_health_status, get_overview_metrics

router = APIRouter(tags=["Overview"])


@router.get("/health")
def health_check():
    return get_health_status()


@router.get("/api/v1/overview")
def overview(
    time_range: str = Query(default="30d"),
    user: dict[str, Any] = Depends(current_user),
):
    return get_overview_metrics(time_range=time_range)
