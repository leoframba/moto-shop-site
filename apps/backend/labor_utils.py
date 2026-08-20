import math


def resolve_service_pricing_type(
    line: dict,
    services_by_id: dict[str, dict] | None = None,
) -> str:
    """Resolve billable pricing type for a service line item."""
    stored = line.get("pricing_type")
    if stored in ("hourly", "fixed"):
        return stored

    service_id = line.get("service_id")
    if service_id and services_by_id:
        service = services_by_id.get(service_id)
        if service and service.get("pricing_type") == "hourly":
            return "hourly"

    return "fixed"


def line_labor_hours(
    pricing_type: str,
    quantity: float,
    unit_price: float,
    hourly_rate: float,
) -> float:
    """Return billable labor hours for a service line item."""
    if pricing_type == "hourly":
        return round(quantity, 2)

    cost = unit_price * quantity
    if hourly_rate <= 0:
        return 0.0

    raw_hours = cost / hourly_rate
    return math.ceil(raw_hours * 10) / 10
