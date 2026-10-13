
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.plot import Plot
from app.services.fraud_service import analyze_plot_conflicts

router = APIRouter(prefix="/fraud", tags=["BhumiGraph"])


@router.post("/analyze/{plot_id}")
def analyze_plot(
    plot_id: str,
    db: Session = Depends(get_db),
):
    plot = db.scalar(
        select(Plot).where(Plot.id == plot_id)
    )

    if plot is None:
        raise HTTPException(status_code=404, detail="Plot not found")

    return analyze_plot_conflicts(db, plot_id)
