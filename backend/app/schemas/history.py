from pydantic import BaseModel


class HistoryEvent(BaseModel):
    date: str
    event_type: str
    record_id: str
    owner_id: str | None = None
    owner_name: str | None = None
    share: str | None = None
    valid_to: str | None = None
    status: str | None = None
    deed_type: str | None = None
    verification_status: str | None = None


class OwnershipHistoryResponse(BaseModel):
    plot_id: str
    plot_code: str
    history_count: int
    history: list[HistoryEvent]
    note: str