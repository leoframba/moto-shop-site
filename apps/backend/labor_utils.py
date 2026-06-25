import math


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
