import hashlib
import secrets
from datetime import UTC, datetime, timedelta
from uuid import uuid4

import jwt
from pwdlib import PasswordHash

from app.core.config import ACCESS_TOKEN_MINUTES, AUTH_SECRET_KEY

password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
	return password_hash.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
	try:
		return password_hash.verify(password, hashed_password)
	except (ValueError, TypeError):
		return False


def create_access_token(user_id: str, session_id: str) -> str:
	now = datetime.now(UTC)
	return jwt.encode(
		{
			"sub": user_id,
			"sid": session_id,
			"typ": "access",
			"iat": now,
			"exp": now + timedelta(minutes=ACCESS_TOKEN_MINUTES),
			"jti": str(uuid4()),
		},
		AUTH_SECRET_KEY,
		algorithm="HS256",
	)


def decode_access_token(token: str) -> dict[str, object]:
	claims = jwt.decode(token, AUTH_SECRET_KEY, algorithms=["HS256"])
	if claims.get("typ") != "access":
		raise jwt.InvalidTokenError("Invalid token type")
	return claims


def create_refresh_token() -> str:
	return secrets.token_urlsafe(48)


def hash_refresh_token(token: str) -> str:
	return hashlib.sha256(token.encode("utf-8")).hexdigest()
