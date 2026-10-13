import hashlib
import hmac
from typing import BinaryIO

MAX_DEED_FILE_BYTES = 10 * 1024 * 1024
CHUNK_BYTES = 64 * 1024


def sha256_file(stream: BinaryIO) -> tuple[str, int]:
	digest = hashlib.sha256()
	size = 0
	while chunk := stream.read(CHUNK_BYTES):
		size += len(chunk)
		if size > MAX_DEED_FILE_BYTES:
			raise ValueError("Uploaded file exceeds the 10 MB limit")
		digest.update(chunk)
	if size == 0:
		raise ValueError("Uploaded file is empty")
	return digest.hexdigest(), size


def hashes_match(uploaded_hash: str, reference_hash: str) -> bool:
	return hmac.compare_digest(uploaded_hash.lower(), reference_hash.lower())
