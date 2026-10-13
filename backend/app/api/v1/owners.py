
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.owner import Owner
from app.models.plot import Plot
from app.models.ownership import OwnershipRecord
from app.schemas.owner import (
    OwnerSearchRequest,
    OwnerSearchResponse,
    OwnerPlotResult,
)

router = APIRouter(prefix="/owners", tags=["Owners"])


@router.post("/search", response_model=OwnerSearchResponse)
def search_owner(
    request: OwnerSearchRequest,
    db: Session = Depends(get_db),
):
    owner = db.scalar(
        select(Owner).where(
            Owner.synthetic_identifier == request.synthetic_identifier
        )
    )

    if owner is None:
        raise HTTPException(
            status_code=404,
            detail="No owner found for this synthetic identifier.",
        )

    query = (
        select(OwnershipRecord, Plot)
        .join(Plot, OwnershipRecord.plot_id == Plot.id)
        .where(
            OwnershipRecord.owner_id == owner.id,
            OwnershipRecord.valid_to.is_(None),
            OwnershipRecord.record_status == "RECORDED",
        )
        .order_by(Plot.plot_code)
    )

    rows = db.execute(query).all()
    plot_results = []

    for ownership, plot in rows:
        denominator = ownership.share_denominator

        if denominator <= 0 or ownership.share_numerator < 0:
            raise HTTPException(
                status_code=500,
                detail="Invalid ownership share in stored records.",
            )

        percentage = (
            ownership.share_numerator / denominator
        ) * 100

        plot_results.append(
            OwnerPlotResult(
                plot_id=plot.id,
                plot_code=plot.plot_code,
                mouza=plot.mouza,
                area=float(plot.area),
                area_unit=plot.area_unit,
                share_numerator=ownership.share_numerator,
                share_denominator=denominator,
                share_percentage=round(percentage, 2),
            )
        )

    return OwnerSearchResponse(
        owner_id=owner.id,
        owner_code=owner.owner_code,
        display_name=owner.display_name,
        synthetic_identifier=owner.synthetic_identifier,
        total_plots=len(plot_results),
        plots=plot_results,
    )
