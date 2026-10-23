from typing import Any
from fastapi import APIRouter, BackgroundTasks, Depends, File, UploadFile
from models.schemas import CartEvent, JobStatus, Transaction
from controllers.auth_controller import current_user
from controllers.transaction_controller import (
    get_job_status,
    get_sample_transactions,
    ingest_transactions as controller_ingest_transactions,
    parse_and_upload_transactions,
    track_cart_event,
)

router = APIRouter(prefix="/api/v1", tags=["Transactions & Ingestion"])


@router.post("/cart-events", status_code=202)
def record_cart_event(event: CartEvent, user: dict[str, Any] = Depends(current_user)):
    return track_cart_event(
        customer_id=event.customer_id,
        product_id=event.product_id,
        event=event.event,
        occurred_at=event.occurred_at,
    )


@router.post("/transactions", status_code=202)
def ingest_transactions_endpoint(
    transactions: list[Transaction],
    background_tasks: BackgroundTasks,
    user: dict[str, Any] = Depends(current_user),
):
    return controller_ingest_transactions(transactions=transactions, background_tasks=background_tasks)


@router.post("/transactions/upload", status_code=202)
async def upload_transactions(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    user: dict[str, Any] = Depends(current_user),
):
    content = await file.read()
    return parse_and_upload_transactions(content=content, background_tasks=background_tasks)


@router.get("/transactions/sample")
def sample_transactions(user: dict[str, Any] = Depends(current_user)):
    return get_sample_transactions()


@router.get("/jobs/{job_id}", response_model=JobStatus)
def job_status_endpoint(job_id: str, user: dict[str, Any] = Depends(current_user)):
    return get_job_status(job_id=job_id)
