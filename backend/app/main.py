
from fastapi import FastAPI
from sqlalchemy import text
from app.db.base import Base
from app.db.session import engine

from app.models.owner import Owner
from app.models.plot import Plot
from app.models.ownership import OwnershipRecord
from app.models.deed import Deed

Base.metadata.create_all(bind=engine)

from app.db.session import engine

app = FastAPI(
    title="BhumiLobhi API",
    description="Synthetic Land Ownership & Conflict Intelligence",
    version="0.1.0",
)


@app.get("/api/v1/health")
def health_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "ok",
            "database": "connected",
            "project": "BhumiLobhi",
        }
    except Exception:
        return {
            "status": "error",
            "database": "disconnected",
            "project": "BhumiLobhi",
        }
