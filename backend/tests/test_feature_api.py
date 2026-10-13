import hashlib
import os
from datetime import date
from decimal import Decimal

os.environ["DATABASE_URL"] = "sqlite+pysqlite://"
os.environ["AUTH_SECRET_KEY"] = "feature-test-secret-with-at-least-32-characters"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.db.session import SessionLocal
from app.main import app
from app.models.alert import FraudAlert
from app.models.deed import Deed
from app.models.owner import Owner
from app.models.ownership import OwnershipRecord
from app.models.plot import Plot
from app.models.user import AuthSession, User


@pytest.fixture(autouse=True)
def clean_feature_tables():
    with SessionLocal() as db:
        for model in (FraudAlert, AuthSession, Deed, OwnershipRecord, Owner, Plot, User):
            db.query(model).delete()
        db.commit()


@pytest.fixture
def session():
    with SessionLocal() as db:
        yield db


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        registered = test_client.post(
            "/api/v1/auth/register",
            json={
                "display_name": "Feature Tester",
                "email": "feature@example.org",
                "password": "FeaturePassword123",
            },
        )
        assert registered.status_code == 201
        test_client.headers.update(
            {"Authorization": f"Bearer {registered.json()['access_token']}"}
        )
        yield test_client


def seed_records(db, with_reference: bool = False):
    owner_a = Owner(
        id="OWN-A", owner_code="OWNER-A", display_name="Owner A",
        synthetic_identifier="SYN-NID-0001",
    )
    owner_b = Owner(
        id="OWN-B", owner_code="OWNER-B", display_name="Owner B",
        synthetic_identifier="SYN-NID-0002",
    )
    plot = Plot(
        id="PLOT-A", plot_code="PA-100", mouza="Test Mouza", jl_number="JL-5",
        area=Decimal("4.5000"), area_unit="decimal", is_synthetic_boundary=True,
    )
    deed = Deed(
        id="DEED-A", plot_id="PLOT-A", deed_type="SALE", deed_date=date(2024, 1, 2),
        file_sha256=hashlib.sha256(b"known deed file").hexdigest() if with_reference else None,
    )
    db.add_all([owner_a, owner_b, plot, deed])
    db.flush()
    db.add_all([
        OwnershipRecord(
            id="REC-A", plot_id="PLOT-A", owner_id="OWN-A", share_numerator=1,
            share_denominator=2, valid_from=date(2020, 1, 1), record_status="RECORDED",
        ),
        OwnershipRecord(
            id="REC-B", plot_id="PLOT-A", owner_id="OWN-B", share_numerator=3,
            share_denominator=4, valid_from=date(2021, 1, 1), record_status="RECORDED",
        ),
    ])
    db.commit()
    return plot, deed


def test_dashboard_returns_real_empty_and_seeded_counts(client, session):
    empty = client.get("/api/v1/dashboard/summary")
    assert empty.status_code == 200
    assert empty.json() == {
        "plot_count": 0,
        "owner_count": 0,
        "deed_count": 0,
        "open_alert_count": 0,
        "recent_alerts": [],
        "plots": [],
    }

    seed_records(session)
    client.post("/api/v1/fraud/analyze/PLOT-A")
    populated = client.get("/api/v1/dashboard/summary")

    assert populated.status_code == 200
    assert populated.json()["plot_count"] == 1
    assert populated.json()["owner_count"] == 2
    assert populated.json()["deed_count"] == 1
    assert populated.json()["open_alert_count"] == 1
    assert populated.json()["recent_alerts"][0]["plot_id"] == "PLOT-A"


def test_owner_search_and_plot_response_match_contracts(client, session):
    seed_records(session)
    owner = client.post(
        "/api/v1/owners/search", json={"synthetic_identifier": "SYN-NID-0001"}
    )
    assert owner.status_code == 200
    assert owner.json()["display_name"] == "Owner A"
    assert owner.json()["plots"][0]["share_percentage"] == 50.0
    assert client.post(
        "/api/v1/owners/search", json={"synthetic_identifier": "UNKNOWN"}
    ).status_code == 404
    assert client.post("/api/v1/owners/search", json={"synthetic_identifier": " "}).status_code == 422

    plot = client.get("/api/v1/plots/PLOT-A")
    assert plot.status_code == 200
    assert plot.json()["owner_count"] == 2
    assert [row["share_percentage"] for row in plot.json()["owners"]] == [50.0, 75.0]
    assert client.get("/api/v1/plots/MISSING").status_code == 404


def test_invalid_stored_share_returns_api_error_without_division(client, session):
    seed_records(session)
    record = session.get(OwnershipRecord, "REC-A")
    record.share_denominator = 0
    session.commit()

    assert client.get("/api/v1/plots/PLOT-A").status_code == 500
    assert client.post(
        "/api/v1/owners/search", json={"synthetic_identifier": "SYN-NID-0001"}
    ).status_code == 500


def test_history_is_typed_and_chronological(client, session):
    seed_records(session)

    response = client.get("/api/v1/plots/PLOT-A/history")

    assert response.status_code == 200
    data = response.json()
    assert set(data) == {"plot_id", "plot_code", "history_count", "history", "note"}
    assert data["history_count"] == 3
    assert [event["date"] for event in data["history"]] == [
        "2020-01-01", "2021-01-01", "2024-01-02"
    ]
    deed_event = data["history"][-1]
    assert deed_event["event_type"] == "DEED"
    assert deed_event["deed_type"] == "SALE"
    assert client.get("/api/v1/plots/MISSING/history").status_code == 404


def test_fraud_analysis_is_deduplicated_and_filterable(client, session):
    seed_records(session)

    first = client.post("/api/v1/fraud/analyze/PLOT-A")
    second = client.post("/api/v1/fraud/analyze/PLOT-A")

    assert first.status_code == second.status_code == 200
    first_alert_id = first.json()["alerts"][0]["alert_id"]
    assert second.json()["alerts"][0]["alert_id"] == first_alert_id
    with SessionLocal() as db:
        assert len(db.scalars(select(FraudAlert)).all()) == 1
    assert len(client.get("/api/v1/fraud/alerts?plot_id=PLOT-A&status=OPEN").json()) == 1
    assert client.get("/api/v1/fraud/alerts?status=INVALID").status_code == 400
    assert client.post("/api/v1/fraud/analyze/MISSING").status_code == 404


def test_deed_verification_no_reference_match_mismatch_and_missing(client, session):
    _, deed = seed_records(session, with_reference=True)
    matching = client.post(
        "/api/v1/deeds/DEED-A/verify",
        files={"file": ("anything.bin", b"known deed file", "application/octet-stream")},
    )
    mismatch = client.post(
        "/api/v1/deeds/DEED-A/verify",
        files={"file": ("different.bin", b"other content", "application/octet-stream")},
    )
    assert matching.status_code == 200
    assert matching.json()["status"] == "MATCH"
    assert matching.json()["reference_available"] is True
    assert "not legal authenticity" in matching.json()["message"]
    assert mismatch.status_code == 200
    assert mismatch.json()["status"] == "MISMATCH"
    assert client.post(
        "/api/v1/deeds/MISSING/verify",
        files={"file": ("file.bin", b"content", "application/octet-stream")},
    ).status_code == 404

    deed.file_sha256 = None
    session.commit()
    no_reference = client.post(
        "/api/v1/deeds/DEED-A/verify",
        files={"file": ("file.bin", b"content", "application/octet-stream")},
    )
    assert no_reference.status_code == 200
    assert no_reference.json()["status"] == "NO_REFERENCE"


def test_deed_upload_rejects_empty_large_and_unauthorized(client):
    with SessionLocal() as db:
        seed_records(db)
    empty = client.post(
        "/api/v1/deeds/DEED-A/verify",
        files={"file": ("empty.bin", b"", "application/octet-stream")},
    )
    too_large = client.post(
        "/api/v1/deeds/DEED-A/verify",
        files={"file": ("large.bin", b"x" * (10 * 1024 * 1024 + 1), "application/octet-stream")},
    )
    client.headers.pop("Authorization")
    unauthorized = client.post(
        "/api/v1/deeds/DEED-A/verify",
        files={"file": ("file.bin", b"content", "application/octet-stream")},
    )

    assert empty.status_code == 400
    assert too_large.status_code == 413
    assert unauthorized.status_code == 401


def test_new_feature_endpoints_require_authentication():
    with TestClient(app) as unauthenticated:
        assert unauthenticated.get("/api/v1/dashboard/summary").status_code == 401
        assert unauthenticated.get("/api/v1/plots/MISSING/history").status_code == 401
        assert unauthenticated.get("/api/v1/fraud/alerts").status_code == 401
        assert unauthenticated.post(
            "/api/v1/deeds/DEED-A/verify",
            files={"file": ("file.bin", b"content", "application/octet-stream")},
        ).status_code == 401