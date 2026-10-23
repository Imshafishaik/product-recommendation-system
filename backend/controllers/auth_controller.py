import base64
import hashlib
import hmac
import json
from datetime import datetime, timezone
from typing import Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from models.database import get_db, hash_password, verify_password

security = HTTPBearer(auto_error=False)
AUTH_SECRET = "mindsit-demo-secret-change-in-production"


def create_access_token(user_id: str) -> str:
    payload = base64.urlsafe_b64encode(
        json.dumps({
            "sub": user_id,
            "exp": int(datetime.now(timezone.utc).timestamp()) + 86400  # 24 hours
        }).encode()
    ).decode().rstrip("=")
    signature = hmac.new(AUTH_SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return f"{payload}.{signature}"


def current_user(credentials: HTTPAuthorizationCredentials | None = Depends(security)) -> dict[str, Any]:
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    try:
        payload, signature = credentials.credentials.split(".", 1)
        expected = hmac.new(AUTH_SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()
        decoded = json.loads(base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4)))
        if not hmac.compare_digest(signature, expected) or decoded["exp"] < int(datetime.now(timezone.utc).timestamp()):
            raise ValueError
        
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT id, email, name, role FROM users WHERE id = ?", (decoded["sub"],))
        user_row = cur.fetchone()
        conn.close()

        if not user_row:
            raise ValueError
        return dict(user_row)
    except (ValueError, KeyError, json.JSONDecodeError, UnicodeDecodeError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")


def login_user(email: str, password: str) -> dict[str, Any]:
    email_clean = email.strip().lower()
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id, email, name, role, password_hash FROM users WHERE LOWER(email) = ?", (email_clean,))
    user_row = cur.fetchone()
    conn.close()

    if not user_row or not verify_password(password, user_row["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    user_data = {
        "id": user_row["id"],
        "email": user_row["email"],
        "name": user_row["name"],
        "role": user_row["role"]
    }
    return {
        "access_token": create_access_token(user_row["id"]),
        "token_type": "bearer",
        "user": user_data
    }


def signup_user(name: str, email: str, password: str) -> dict[str, Any]:
    email_clean = email.strip().lower()
    name_clean = name.strip()
    if not name_clean or "@" not in email_clean:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Enter a valid name and email")
    if len(password) < 6:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Password must contain at least 6 characters")

    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE LOWER(email) = ?", (email_clean,))
    if cur.fetchone():
        conn.close()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists")

    cur.execute("SELECT COUNT(*) FROM users")
    user_count = cur.fetchone()[0]
    user_id = f"usr_{user_count + 1:03d}"
    now_iso = datetime.now(timezone.utc).isoformat()
    pwd_hash = hash_password(password)

    cur.execute(
        "INSERT INTO users (id, email, name, role, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        (user_id, email_clean, name_clean, "Merchant", pwd_hash, now_iso)
    )
    conn.commit()
    conn.close()

    public_user = {"id": user_id, "email": email_clean, "name": name_clean, "role": "Merchant"}
    return {
        "access_token": create_access_token(user_id),
        "token_type": "bearer",
        "user": public_user
    }
