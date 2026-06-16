# service_pricing.py
"""Shared helpers for computing and serializing service pricing so the public
and admin service endpoints stay consistent."""


def calculate_service_price(service: dict, hourly_rate: float) -> float | None:
    pricing_type = service.get("pricing_type", "hourly")
    if pricing_type == "hourly" and service.get("estimated_hours") is not None:
        return round(float(service["estimated_hours"]) * hourly_rate, 2)
    if pricing_type == "fixed" and service.get("fixed_price") is not None:
        return round(float(service["fixed_price"]), 2)
    return None


def serialize_service(service: dict, hourly_rate: float) -> dict:
    return {
        "id": service["id"],
        "name": service["name"],
        "description": service.get("description"),
        "category_id": service.get("category_id"),
        "categories": service.get("categories"),
        "pricing_type": service.get("pricing_type", "hourly"),
        "estimated_hours": service.get("estimated_hours"),
        "fixed_price": service.get("fixed_price"),
        "calculated_price": calculate_service_price(service, hourly_rate),
        "is_hidden": bool(service.get("is_hidden", False)),
    }
