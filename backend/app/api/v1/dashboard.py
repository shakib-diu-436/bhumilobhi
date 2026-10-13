from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.permissions import get_current_user
from app.db.session import get_db
from app.models.alert import FraudAlert
from app.models.deed import Deed
from app.models.owner import Owner
from app.models.plot import Plot
from app.schemas.dashboard import DashboardSummary

router = APIRouter(
    prefix="/dashboard", tags=["Dashboard"], dependencies=[Depends(get_current_user)]
)


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)) -> DashboardSummary:
    plot_count = db.scalar(select(func.count()).select_from(Plot)) or 0
    owner_count = db.scalar(select(func.count()).select_from(Owner)) or 0
    deed_count = db.scalar(select(func.count()).select_from(Deed)) or 0
    open_alert_count = db.scalar(
        select(func.count()).select_from(FraudAlert).where(FraudAlert.status == "OPEN")
    ) or 0
    recent_alerts = db.scalars(
        select(FraudAlert).order_by(FraudAlert.created_at.desc()).limit(5)
    ).all()
    plots = db.scalars(select(Plot).order_by(Plot.plot_code).limit(5)).all()
    return DashboardSummary(
        plot_count=plot_count,
        owner_count=owner_count,
        deed_count=deed_count,
        open_alert_count=open_alert_count,
        recent_alerts=recent_alerts,
        plots=[{"plot_id": plot.id, "plot_code": plot.plot_code} for plot in plots],
    )