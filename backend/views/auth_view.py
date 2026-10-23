from typing import Any
from fastapi import APIRouter, Depends
from models.schemas import LoginRequest, LoginResponse, SignupRequest
from controllers.auth_controller import current_user, login_user, signup_user

router = APIRouter(tags=["Authentication"])


@router.post("/auth/login", response_model=LoginResponse)
def login(credentials: LoginRequest):
    return login_user(email=credentials.email, password=credentials.password)


@router.post("/auth/signup", response_model=LoginResponse, status_code=201)
def signup(credentials: SignupRequest):
    return signup_user(name=credentials.name, email=credentials.email, password=credentials.password)


@router.get("/auth/me")
def me(user: dict[str, Any] = Depends(current_user)):
    return user
