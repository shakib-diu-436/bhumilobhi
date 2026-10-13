from typing import Literal

from pydantic import BaseModel


class DeedVerificationResponse(BaseModel):
    deed_id: str
    status: Literal["MATCH", "MISMATCH", "NO_REFERENCE"]
    reference_available: bool
    uploaded_sha256: str
    message: str