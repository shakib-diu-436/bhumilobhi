
from datetime import date
from decimal import Decimal

from app.db.base import Base
from app.db.session import engine, SessionLocal

from app.models.owner import Owner
from app.models.plot import Plot
from app.models.ownership import OwnershipRecord
from app.models.deed import Deed


def seed_data():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        owners = [
            {
                "id": "OWN-001",
                "owner_code": "OWNER-0001",
                "display_name": "Demo Owner A",
                "synthetic_identifier": "SYN-NID-0001",
            },
            {
                "id": "OWN-002",
                "owner_code": "OWNER-0002",
                "display_name": "Demo Owner B",
                "synthetic_identifier": "SYN-NID-0002",
            },
            {
                "id": "OWN-003",
                "owner_code": "OWNER-0003",
                "display_name": "Demo Owner C",
                "synthetic_identifier": "SYN-NID-0003",
            },
        ]

        for item in owners:
            if db.get(Owner, item["id"]) is None:
                db.add(Owner(**item))

        db.flush()

        plots = [
            {
                "id": "PLOT-001",
                "plot_code": "P-1001",
                "mouza": "Demo Mouza A",
                "jl_number": "JL-001",
                "area": Decimal("10.0000"),
                "area_unit": "decimal",
                "is_synthetic_boundary": True,
            },
            {
                "id": "PLOT-002",
                "plot_code": "P-1002",
                "mouza": "Demo Mouza A",
                "jl_number": "JL-001",
                "area": Decimal("8.0000"),
                "area_unit": "decimal",
                "is_synthetic_boundary": True,
            },
            {
                "id": "PLOT-003",
                "plot_code": "P-1003",
                "mouza": "Demo Mouza B",
                "jl_number": "JL-002",
                "area": Decimal("6.0000"),
                "area_unit": "decimal",
                "is_synthetic_boundary": True,
            },
        ]

        for item in plots:
            if db.get(Plot, item["id"]) is None:
                db.add(Plot(**item))

        db.flush()

        ownerships = [
            {
                "id": "OR-001",
                "plot_id": "PLOT-001",
                "owner_id": "OWN-001",
                "share_numerator": 1,
                "share_denominator": 2,
                "valid_from": date(2022, 1, 1),
                "record_status": "RECORDED",
            },
            {
                "id": "OR-002",
                "plot_id": "PLOT-001",
                "owner_id": "OWN-002",
                "share_numerator": 1,
                "share_denominator": 2,
                "valid_from": date(2022, 1, 1),
                "record_status": "RECORDED",
            },
            {
                "id": "OR-003",
                "plot_id": "PLOT-002",
                "owner_id": "OWN-003",
                "share_numerator": 1,
                "share_denominator": 1,
                "valid_from": date(2023, 3, 1),
                "record_status": "RECORDED",
            },

            {
    "id": "OR-004",
    "plot_id": "PLOT-003",
    "owner_id": "OWN-001",
    "share_numerator": 3,
    "share_denominator": 4,
    "valid_from": date(2024, 1, 1),
    "record_status": "RECORDED",
},
{
    "id": "OR-005",
    "plot_id": "PLOT-003",
    "owner_id": "OWN-002",
    "share_numerator": 1,
    "share_denominator": 2,
    "valid_from": date(2024, 1, 1),
    "record_status": "RECORDED",
},
        ]

        for item in ownerships:
            if db.get(OwnershipRecord, item["id"]) is None:
                db.add(OwnershipRecord(**item))

        deeds = [
            {
                "id": "DEED-001",
                "plot_id": "PLOT-001",
                "deed_type": "SALE",
                "deed_date": date(2022, 1, 1),
                "verification_status": "UNVERIFIED",
            },
            {
                "id": "DEED-002",
                "plot_id": "PLOT-002",
                "deed_type": "SALE",
                "deed_date": date(2023, 3, 1),
                "verification_status": "UNVERIFIED",
            },
        ]

        for item in deeds:
            if db.get(Deed, item["id"]) is None:
                db.add(Deed(**item))

        db.commit()
        print("SUCCESS: Synthetic demo data inserted.")

    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
