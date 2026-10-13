from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DashboardAlert(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    plot_id: str
    rule_code: str
    severity: str
    message: str
    status: str
    created_at: datetime


class DashboardPlot(BaseModel):
    plot_id: str
    plot_code: str


class DashboardSummary(BaseModel):
    plot_count: int
    owner_count: int
    deed_count: int
    open_alert_count: int
    recent_alerts: list[DashboardAlert]
    plots: list[DashboardPlot]