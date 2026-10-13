from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.permissions import get_current_user
from app.db.session import get_db
from app.models.deed import Deed
from app.schemas.deed import DeedVerificationResponse
from app.services.verification_service import sha256_file, hashes_match

router = APIRouter(
	prefix="/deeds", tags=["Deeds"], dependencies=[Depends(get_current_user)]
)


@router.post(
	"/{deed_id}/verify",
	response_model=DeedVerificationResponse,
)
def verify_deed_file(
	deed_id: str,
	file: UploadFile = File(...),
	db: Session = Depends(get_db),
) -> DeedVerificationResponse:
	deed = db.get(Deed, deed_id)
	if deed is None:
		raise HTTPException(status_code=404, detail="Deed not found")

	try:
		uploaded_hash, _ = sha256_file(file.file)
	except ValueError as error:
		raise HTTPException(status_code=status.HTTP_413_CONTENT_TOO_LARGE if "10 MB" in str(error) else status.HTTP_400_BAD_REQUEST, detail=str(error)) from error
	finally:
		file.file.close()

	if deed.file_sha256 is None:
		return DeedVerificationResponse(
			deed_id=deed.id,
			status="NO_REFERENCE",
			reference_available=False,
			uploaded_sha256=uploaded_hash,
			message="No reference digest is stored for this deed; integrity could not be compared.",
		)

	matches = hashes_match(uploaded_hash, deed.file_sha256)
	deed.verification_status = "INTEGRITY_MATCH" if matches else "INTEGRITY_MISMATCH"
	db.commit()
	return DeedVerificationResponse(
		deed_id=deed.id,
		status="MATCH" if matches else "MISMATCH",
		reference_available=True,
		uploaded_sha256=uploaded_hash,
		message=(
			"The uploaded file matches the stored reference digest. This establishes file integrity only, not legal authenticity."
			if matches
			else "The uploaded file does not match the stored reference digest. This is an integrity mismatch, not a legal finding."
		),
	)
