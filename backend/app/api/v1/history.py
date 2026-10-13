
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.plot import Plot
from app.models.owner import Owner
from app.models.ownership import OwnershipRecord
from app.models.deed import Deed

router = APIRouter(prefix="/plots", tags=["Ownership History"])


@router.get("/{plot_id}/history")
def get_ownership_history(
    plot_id: str,
    db: Session = Depends(get_db),
):
    plot = db.get(Plot, plot_id)

    if plot is None:
        raise HTTPException(status_code=404, detail="Plot not found")

    history = []

    ownership_query = (
        select(OwnershipRecord, Owner)
        .join(Owner, OwnershipRecord.owner_id == Owner.id)
        .where(OwnershipRecord.plot_id == plot.id)
    )

    for record, owner in db.execute(ownership_query).all():
        history.append({
            "date": record.valid_from.isoformat(),
            "event_type": "OWNERSHIP_RECORD",
            "record_id": record.id,
            "owner_id": owner.id,
            "owner_name": owner.display_name,
            "share": (
                f"{record.share_numerator}/"
                f"{record.share_denominator}"
            ),
            "valid_to": (
                record.valid_to.isoformat()
                if record.valid_to else None
            ),
            "status": record.record_status,
        })

    deed_query = (
        select(Deed)
        .where(Deed.plot_id == plot.id)
    )

    for deed in db.scalars(deed_query).all():
        history.append({
            "date": deed.deed_date.isoformat(),
            "event_type": "DEED",
            "record_id": deed.id,
            "deed_type": deed.deed_type,
            "verification_status": deed.verification_status,
        })

    history.sort(key=lambda item: (item["date"], item["event_type"]))

    return {
        "plot_id": plot.id,
        "plot_code": plot.plot_code,
        "history_count": len(history),
        "history": history,
        "note": (
            "Synthetic demo history based on recorded ownership "
            "and deed entries; not a legal title determination."
        ),
    }
