
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.plot import Plot
from app.models.ownership import OwnershipRecord
from app.models.owner import Owner

router = APIRouter(prefix="/plots", tags=["Plots"])


@router.get("/{plot_id}")
def get_plot_details(
    plot_id: str,
    db: Session = Depends(get_db),
):
    plot = db.get(Plot, plot_id)

    if plot is None:
        raise HTTPException(status_code=404, detail="Plot not found")

    query = (
        select(OwnershipRecord, Owner)
        .join(Owner, OwnershipRecord.owner_id == Owner.id)
        .where(
            OwnershipRecord.plot_id == plot.id,
            OwnershipRecord.valid_to.is_(None),
            OwnershipRecord.record_status == "RECORDED",
        )
        .order_by(Owner.owner_code)
    )

    rows = db.execute(query).all()

    owners = []
    for record, owner in rows:
        if record.share_denominator <= 0 or record.share_numerator < 0:
            raise HTTPException(
                status_code=500,
                detail="Invalid ownership share in stored records",
            )

        owners.append({
            "owner_id": owner.id,
            "owner_code": owner.owner_code,
            "display_name": owner.display_name,
            "share_numerator": record.share_numerator,
            "share_denominator": record.share_denominator,
            "share_percentage": round(
                record.share_numerator / record.share_denominator * 100,
                2,
            ),
        })

    return {
        "plot_id": plot.id,
        "plot_code": plot.plot_code,
        "mouza": plot.mouza,
        "jl_number": plot.jl_number,
        "area": float(plot.area),
        "area_unit": plot.area_unit,
        "is_synthetic_boundary": plot.is_synthetic_boundary,
        "owners": owners,
        "owner_count": len(owners),
    }
