
from collections import defaultdict
from fractions import Fraction

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.ownership import OwnershipRecord


def analyze_plot_conflicts(db: Session, plot_id: str) -> dict:
    records = db.scalars(
        select(OwnershipRecord).where(
            OwnershipRecord.plot_id == plot_id,
            OwnershipRecord.valid_to.is_(None),
            OwnershipRecord.record_status == "RECORDED",
        )
    ).all()

    alerts = []
    total_share = Fraction(0, 1)
    owner_records = defaultdict(list)

    for record in records:
        if (
            record.share_denominator <= 0
            or record.share_numerator < 0
        ):
            alerts.append({
                "rule_code": "R00_INVALID_SHARE",
                "severity": "HIGH",
                "message": "An ownership record contains an invalid share.",
                "evidence": [{"ownership_record_id": record.id}],
            })
            continue

        share = Fraction(
            record.share_numerator,
            record.share_denominator,
        )

        total_share += share
        owner_records[record.owner_id].append(record)

    # R01: Total recorded ownership exceeds 100%.
    if total_share > 1:
        alerts.append({
            "rule_code": "R01_SHARE_OVER_100",
            "severity": "HIGH",
            "message": "Recorded ownership shares exceed 100%.",
            "evidence": [
                {"ownership_record_id": record.id}
                for record in records
            ],
        })

    # R02: Multiple active records for the same owner and plot.
    for owner_id, owner_rows in owner_records.items():
        if len(owner_rows) > 1:
            alerts.append({
                "rule_code": "R02_OVERLAPPING_OWNER_RECORDS",
                "severity": "MEDIUM",
                "message": (
                    "Multiple active ownership records exist "
                    f"for owner {owner_id} on this plot."
                ),
                "evidence": [
                    {"ownership_record_id": row.id}
                    for row in owner_rows
                ],
            })

    return {
        "plot_id": plot_id,
        "analysis_status": (
            "CONFLICT_DETECTED" if alerts else "NO_CONFLICT_DETECTED"
        ),
        "total_recorded_share_percentage": round(
            float(total_share * 100), 2
        ),
        "alert_count": len(alerts),
        "alerts": alerts,
        "requires_manual_review": bool(alerts),
        "note": (
            "These are record-based flags for investigation, "
            "not a legal determination of fraud or ownership."
        ),
    }
