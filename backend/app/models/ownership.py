
from datetime import date
from typing import Optional

from sqlalchemy import Date, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class OwnershipRecord(Base):
    __tablename__ = "ownership_records"

    __table_args__ = (
        UniqueConstraint(
            "plot_id", "owner_id", "valid_from",
            name="uq_ownership_period",
        ),
    )

    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    plot_id: Mapped[str] = mapped_column(
        ForeignKey("plots.id"), index=True, nullable=False
    )
    owner_id: Mapped[str] = mapped_column(
        ForeignKey("owners.id"), index=True, nullable=False
    )
    share_numerator: Mapped[int] = mapped_column(
        Integer, nullable=False
    )
    share_denominator: Mapped[int] = mapped_column(
        Integer, nullable=False
    )
    valid_from: Mapped[date] = mapped_column(Date, nullable=False)
    valid_to: Mapped[Optional[date]] = mapped_column(Date)
    record_status: Mapped[str] = mapped_column(
        String(30), default="RECORDED", nullable=False
    )
