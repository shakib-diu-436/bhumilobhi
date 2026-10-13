from collections import deque
from threading import Lock
from time import monotonic

WINDOW_SECONDS = 15 * 60
MAX_FAILED_LOGINS = 5
_failures: dict[str, deque[float]] = {}
_lock = Lock()


def login_is_limited(client_ip: str) -> bool:
    now = monotonic()
    with _lock:
        attempts = _failures.setdefault(client_ip, deque())
        while attempts and now - attempts[0] >= WINDOW_SECONDS:
            attempts.popleft()
        return len(attempts) >= MAX_FAILED_LOGINS


def record_failed_login(client_ip: str) -> None:
    now = monotonic()
    with _lock:
        attempts = _failures.setdefault(client_ip, deque())
        while attempts and now - attempts[0] >= WINDOW_SECONDS:
            attempts.popleft()
        attempts.append(now)
        if len(_failures) > 10_000:
            expired = [
                key for key, values in _failures.items()
                if not values or now - values[-1] >= WINDOW_SECONDS
            ]
            for key in expired:
                _failures.pop(key, None)


def clear_login_failures(client_ip: str) -> None:
    with _lock:
        _failures.pop(client_ip, None)