
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.permissions import get_current_user
from app.models.plot import Plot
from app.models.alert import FraudAlert
from app.services.fraud_service import analyze_plot_conflicts
from app.schemas.fraud import FraudAlertResponse, FraudAnalysisResponse

router = APIRouter(
    prefix="/fraud", tags=["BhumiGraph"], dependencies=[Depends(get_current_user)]
)


@router.post("/analyze/{plot_id}", response_model=FraudAnalysisResponse)
def analyze_plot(plot_id: str, db: Session = Depends(get_db)):
    plot = db.scalar(select(Plot).where(Plot.id == plot_id))

    if plot is None:
        raise HTTPException(status_code=404, detail="Plot not found")

    result = analyze_plot_conflicts(db, plot_id)

    # Load existing open alerts for this plot.
    existing_alerts = db.scalars(
        select(FraudAlert).where(
            FraudAlert.plot_id == plot_id,
            FraudAlert.status == "OPEN",
        )
    ).all()

    existing_by_rule = {
        alert.rule_code: alert for alert in existing_alerts
    }
    current_rule_codes = set()

    # Create new alerts or update existing ones.
    for item in result["alerts"]:
        rule_code = item["rule_code"]
        current_rule_codes.add(rule_code)

        alert = existing_by_rule.get(rule_code)

        if alert is None:
            alert = FraudAlert(
                id=str(uuid4()),
                plot_id=plot_id,
                rule_code=rule_code,
                severity=item["severity"],
                message=item["message"],
                evidence=item["evidence"],
                status="OPEN",
            )
            db.add(alert)
        else:
            alert.severity = item["severity"]
            alert.message = item["message"]
            alert.evidence = item["evidence"]

        db.flush()
        item["alert_id"] = alert.id

    # Resolve old open alerts that are no longer detected.
    for alert in existing_alerts:
        if alert.rule_code not in current_rule_codes:
            alert.status = "RESOLVED"

    db.commit()

    result["alerts_saved"] = len(result["alerts"])
    return result


@router.get("/alerts", response_model=list[FraudAlertResponse])
def get_fraud_alerts(
    plot_id: str | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
):
    query = select(FraudAlert)

    if plot_id:
        query = query.where(FraudAlert.plot_id == plot_id)

    if status:
        status = status.upper()
        if status not in {"OPEN", "RESOLVED"}:
            raise HTTPException(
                status_code=400,
                detail="Status must be OPEN or RESOLVED",
            )
        query = query.where(FraudAlert.status == status)

    alerts = db.scalars(
        query.order_by(FraudAlert.created_at.desc())
    ).all()

    return [
        {
            "id": alert.id,
            "plot_id": alert.plot_id,
            "rule_code": alert.rule_code,
            "severity": alert.severity,
            "message": alert.message,
            "evidence": alert.evidence,
            "status": alert.status,
            "created_at": alert.created_at,
        }
        for alert in alerts
    ]
