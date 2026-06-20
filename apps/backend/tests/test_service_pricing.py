from service_pricing import (
    is_public_service,
    serialize_admin_service,
    serialize_public_service,
)


def test_is_public_service_excludes_internal_and_hidden():
    assert is_public_service({"is_internal": False, "is_hidden": False}) is True
    assert is_public_service({"is_internal": True, "is_hidden": False}) is False
    assert is_public_service({"is_internal": False, "is_hidden": True}) is False
    assert is_public_service({"is_internal": True, "is_hidden": True}) is False


def test_serialize_public_service_omits_admin_flags():
    service = {
        "id": "svc-1",
        "name": "Oil Change",
        "description": "Standard service",
        "category_id": "cat-1",
        "categories": {"id": "cat-1", "name": "Maintenance"},
        "pricing_type": "fixed",
        "fixed_price": 89.0,
        "is_hidden": True,
        "is_internal": True,
    }

    payload = serialize_public_service(service, hourly_rate=120.0)

    assert payload["name"] == "Oil Change"
    assert payload["calculated_price"] == 89.0
    assert "is_hidden" not in payload
    assert "is_internal" not in payload


def test_serialize_admin_service_includes_flags():
    service = {
        "id": "svc-2",
        "name": "Frame Weld",
        "description": "Structural repair",
        "category_id": "cat-2",
        "categories": {"id": "cat-2", "name": "Fabrication"},
        "pricing_type": "hourly",
        "estimated_hours": 2.5,
        "is_hidden": False,
        "is_internal": True,
    }

    payload = serialize_admin_service(service, hourly_rate=100.0)

    assert payload["calculated_price"] == 250.0
    assert payload["is_hidden"] is False
    assert payload["is_internal"] is True
