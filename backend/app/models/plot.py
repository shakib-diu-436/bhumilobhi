
from decimal import Decimal
from typing import Optional

from sqlalchemy import Boolean, JSON, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Plot(Base):
    __tablename__ = "plots"

    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    plot_code: Mapped[str] = mapped_column(
        String(40), unique=True, index=True, nullable=False
    )
    mouza: Mapped[str] = mapped_column(String(120), nullable=False)
    jl_number: Mapped[Optional[str]] = mapped_column(String(40))
    area: Mapped[Decimal] = mapped_column(
        Numeric(14, 4), nullable=False
    )
    area_unit: Mapped[str] = mapped_column(
        String(20), default="decimal", nullable=False
    )
    geometry_geojson: Mapped[Optional[dict]] = mapped_column(JSON)
    is_synthetic_boundary: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
