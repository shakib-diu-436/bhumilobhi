from datetime import UTC, datetime, timedelta
from uuid import uuid4

import jwt
from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import (
    ACCESS_TOKEN_MINUTES,
    AUTH_COOKIE_SECURE,
    REFRESH_TOKEN_DAYS,
)
from app.core.permissions import bearer_scheme, get_current_user
from app.core.rate_limit import (
    clear_login_failures,
    login_is_limited,
    record_failed_login,
)
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_access_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)
from app.db.session import get_db
from app.models.user import AuthSession, User
from app.schemas.auth import AuthResponse, LoginRequest, PublicUser, RegisterRequest

router = APIRouter(prefix="/auth", tags=["Authentication"])
REFRESH_COOKIE = "bhumi_refresh"
REFRESH_COOKIE_PATH = "/api/v1/auth"


def _set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=REFRESH_COOKIE,
        value=token,
        max_age=REFRESH_TOKEN_DAYS * 24 * 60 * 60,
        httponly=True,
        secure=AUTH_COOKIE_SECURE,
        samesite="lax",
        path=REFRESH_COOKIE_PATH,
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key=REFRESH_COOKIE,
        httponly=True,
        secure=AUTH_COOKIE_SECURE,
        samesite="lax",
        path=REFRESH_COOKIE_PATH,
    )


def _issue_session(db: Session, user: User, response: Response) -> AuthResponse:
    session_id = str(uuid4())
    refresh_token = create_refresh_token()
    db.add(
        AuthSession(
            id=session_id,
            user_id=user.id,
            refresh_token_hash=hash_refresh_token(refresh_token),
            expires_at=datetime.now(UTC) + timedelta(days=REFRESH_TOKEN_DAYS),
        )
    )
    db.commit()
    _set_refresh_cookie(response, refresh_token)
    return AuthResponse(
        access_token=create_access_token(user.id, session_id),
        expires_in=ACCESS_TOKEN_MINUTES * 60,
        user=PublicUser.model_validate(user),
    )


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(
    payload: RegisterRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> AuthResponse:
    user = User(
        id=str(uuid4()),
        email=payload.email,
        display_name=payload.display_name,
        password_hash=hash_password(payload.password),
        account_status="ACTIVE",
    )
    db.add(user)
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        ) from None
    return _issue_session(db, user, response)


@router.post("/login", response_model=AuthResponse)
def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> AuthResponse:
    client_ip = request.client.host if request.client else "unknown"
    if login_is_limited(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed login attempts. Try again in 15 minutes.",
            headers={"Retry-After": "900"},
        )

    user = db.scalar(select(User).where(User.email == payload.email))
    if (
        user is None
        or user.account_status != "ACTIVE"
        or not verify_password(payload.password, user.password_hash)
    ):
        record_failed_login(client_ip)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    clear_login_failures(client_ip)
    return _issue_session(db, user, response)


@router.get("/me", response_model=PublicUser)
def get_me(user: User = Depends(get_current_user)) -> User:
    return user


@router.post("/refresh", response_model=AuthResponse)
def refresh_session(
    response: Response,
    refresh_token: str | None = Cookie(default=None, alias=REFRESH_COOKIE),
    db: Session = Depends(get_db),
) -> AuthResponse:
    if refresh_token is None:
        raise HTTPException(status_code=401, detail="Refresh session is missing")

    token_hash = hash_refresh_token(refresh_token)
    session = db.scalar(
        select(AuthSession).where(AuthSession.refresh_token_hash == token_hash)
    )
    now = datetime.now(UTC)
    if (
        session is None
        or session.revoked_at is not None
        or _as_utc(session.expires_at) <= now
    ):
        _clear_refresh_cookie(response)
        raise HTTPException(status_code=401, detail="Refresh session is invalid or expired")

    user = db.get(User, session.user_id)
    if user is None or user.account_status != "ACTIVE":
        session.revoked_at = now
        db.commit()
        _clear_refresh_cookie(response)
        raise HTTPException(status_code=401, detail="Account is unavailable")

    next_refresh_token = create_refresh_token()
    session.refresh_token_hash = hash_refresh_token(next_refresh_token)
    db.commit()
    _set_refresh_cookie(response, next_refresh_token)
    return AuthResponse(
        access_token=create_access_token(user.id, session.id),
        expires_in=ACCESS_TOKEN_MINUTES * 60,
        user=PublicUser.model_validate(user),
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    response: Response,
    refresh_token: str | None = Cookie(default=None, alias=REFRESH_COOKIE),
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Response:
    now = datetime.now(UTC)
    session = None
    if refresh_token:
        session = db.scalar(
            select(AuthSession).where(
                AuthSession.refresh_token_hash == hash_refresh_token(refresh_token)
            )
        )
    if session is None and credentials is not None:
        try:
            claims = decode_access_token(credentials.credentials)
            session_id = claims.get("sid")
            if isinstance(session_id, str):
                session = db.get(AuthSession, session_id)
        except jwt.InvalidTokenError:
            pass
    if session is not None and session.revoked_at is None:
        session.revoked_at = now
        db.commit()
    _clear_refresh_cookie(response)
    response.status_code = status.HTTP_204_NO_CONTENT
    return response


def _as_utc(value: datetime) -> datetime:
    return value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)