from typing import Any, Literal
from fastapi import APIRouter, Depends
from models.schemas import CreateCampaignRequest
from controllers.auth_controller import current_user
from controllers.campaign_controller import (
    create_custom_campaign,
    list_campaigns as get_all_campaigns,
    queue_segment_campaign,
)

router = APIRouter(prefix="/api/v1", tags=["Campaigns"])


@router.post("/campaigns/{segment}/queue")
def queue_campaign(
    segment: Literal["At risk", "Inactive", "Loyal", "New", "Growing"],
    user: dict[str, Any] = Depends(current_user),
):
    return queue_segment_campaign(segment=segment)


@router.post("/campaigns")
def create_campaign(
    payload: CreateCampaignRequest,
    user: dict[str, Any] = Depends(current_user),
):
    return create_custom_campaign(
        name=payload.name,
        segment=payload.segment,
        offer_type=payload.offer_type,
        offer_value=payload.offer_value,
    )


@router.get("/campaigns")
def list_campaigns(user: dict[str, Any] = Depends(current_user)):
    return get_all_campaigns()
