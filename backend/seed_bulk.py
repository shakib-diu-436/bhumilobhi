
from datetime import date
from decimal import Decimal

from app.db.session import SessionLocal
from app.models.owner import Owner
from app.models.plot import Plot
from app.models.ownership import OwnershipRecord
from app.models.deed import Deed


def seed_bulk_data():
    db = SessionLocal()

    try:
        owners = [
            {
                "id": f"OWN-BULK-{i:03d}",
                "owner_code": f"OWNER-BULK-{i:03d}",
                "display_name": f"Demo Owner {i:02d}",
                "synthetic_identifier": f"SYN-NID-BULK-{i:04d}",
                "is_active": True,
            }
            for i in range(1, 21)
        ]

        plots = [
            {
                "id": f"PLOT-BULK-{i:03d}",
                "plot_code": f"P-BULK-{i:03d}",
                "mouza": f"Demo Mouza {(i - 1) // 5 + 1}",
                "jl_number": f"JL-BULK-{(i - 1) // 5 + 1:03d}",
                "area": Decimal(f"{5 + (i % 10)}.0000"),
                "area_unit": "decimal",
                "is_synthetic_boundary": True,
            }
            for i in range(1, 16)
        ]

        ownerships = []

        for i in range(1, 16):
            plot_id = f"PLOT-BULK-{i:03d}"
            owner_a = f"OWN-BULK-{((i - 1) * 2) % 20 + 1:03d}"
            owner_b = f"OWN-BULK-{((i - 1) * 2 + 1) % 20 + 1:03d}"

            # Three intentionally conflicting synthetic plots.
            if i in {4, 9, 14}:
                shares = [(3, 4), (1, 2)]  # Total: 125%
            elif i % 3 == 0:
                shares = [(1, 3), (2, 3)]  # Total: 100%
            else:
                shares = [(1, 2), (1, 2)]  # Total: 100%

            for j, (numerator, denominator) in enumerate(shares):
                ownerships.append(
                    {
                        "id": f"OR-BULK-{(i - 1) * 2 + j + 1:03d}",
                        "plot_id": plot_id,
                        "owner_id": owner_a if j == 0 else owner_b,
                        "share_numerator": numerator,
                        "share_denominator": denominator,
                        "valid_from": date(2024, (i - 1) % 12 + 1, 1),
                        "record_status": "RECORDED",
                    }
                )

        deeds = [
            {
                "id": f"DEED-BULK-{i:03d}",
                "plot_id": f"PLOT-BULK-{i:03d}",
                "deed_type": "SALE",
                "deed_date": date(2024, (i - 1) % 12 + 1, 15),
                "file_sha256": None,
                "verification_status": "UNVERIFIED",
            }
            for i in range(1, 16)
        ]

        # Each list contains its model and deterministic records.
        datasets = [
            (Owner, owners),
            (Plot, plots),
            (OwnershipRecord, ownerships),
            (Deed, deeds),
        ]

        inserted = {}

        for model, records in datasets:
            count = 0

            for record in records:
                # Deterministic IDs make reruns safe.
                if db.get(model, record["id"]) is None:
                    db.add(model(**record))
                    count += 1

            db.flush()
            inserted[model.__tablename__] = count

        db.commit()

        print("SUCCESS: Synthetic bulk data processed.")
        print("New records inserted:")

        for table, count in inserted.items():
            print(f"  {table}: {count}")

        print(f"Total new records: {sum(inserted.values())}")
        print(
            "Intentional conflict plots: "
            "PLOT-BULK-004, PLOT-BULK-009, PLOT-BULK-014"
        )

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed_bulk_data()
