from datetime import datetime
from typing import Any

from pydantic import BaseModel


class FraudAlertResponse(BaseModel):
    id: str
    plot_id: str
    rule_code: str
    severity: str
    message: str
    evidence: list[dict[str, Any]]
    status: str
    created_at: datetime


class AnalysisAlertResponse(BaseModel):
    rule_code: str
    severity: str
    message: str
    evidence: list[dict[str, Any]]
    alert_id: str


class FraudAnalysisResponse(BaseModel):
    plot_id: str
    analysis_status: str
    total_recorded_share_percentage: float
    alert_count: int
    alerts: list[AnalysisAlertResponse]
    requires_manual_review: bool
    note: str
    alerts_saved: int