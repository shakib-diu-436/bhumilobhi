
from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Owner(Base):
    __tablename__ = "owners"

    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    owner_code: Mapped[str] = mapped_column(
        String(40), unique=True, index=True, nullable=False
    )
    display_name: Mapped[str] = mapped_column(
        String(120), nullable=False
    )
    synthetic_identifier: Mapped[str] = mapped_column(
        String(40), unique=True, index=True, nullable=False
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
