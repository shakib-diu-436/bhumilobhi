from datetime import UTC, datetime

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import AuthSession, User

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
	credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
	db: Session = Depends(get_db),
) -> User:
	unauthorized = HTTPException(
		status_code=status.HTTP_401_UNAUTHORIZED,
		detail="Authentication required",
		headers={"WWW-Authenticate": "Bearer"},
	)
	if credentials is None:
		raise unauthorized

	try:
		claims = decode_access_token(credentials.credentials)
		user_id = claims.get("sub")
		session_id = claims.get("sid")
		if not isinstance(user_id, str) or not isinstance(session_id, str):
			raise jwt.InvalidTokenError("Missing token subject")
	except jwt.InvalidTokenError:
		raise unauthorized from None

	session = db.get(AuthSession, session_id)
	now = datetime.now(UTC)
	if (
		session is None
		or session.user_id != user_id
		or session.revoked_at is not None
		or _as_utc(session.expires_at) <= now
	):
		raise unauthorized

	user = db.get(User, user_id)
	if user is None or user.account_status != "ACTIVE":
		raise unauthorized
	return user


def _as_utc(value: datetime) -> datetime:
	return value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)
