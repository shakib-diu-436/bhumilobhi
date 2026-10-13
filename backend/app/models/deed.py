
from datetime import date
from typing import Optional

from sqlalchemy import Date, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Deed(Base):
    __tablename__ = "deeds"

    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    plot_id: Mapped[str] = mapped_column(
        ForeignKey("plots.id"), index=True, nullable=False
    )
    deed_type: Mapped[str] = mapped_column(String(40), nullable=False)
    deed_date: Mapped[date] = mapped_column(Date, nullable=False)
    file_sha256: Mapped[Optional[str]] = mapped_column(String(64))
    verification_status: Mapped[str] = mapped_column(
        String(30), default="UNVERIFIED", nullable=False
    )
