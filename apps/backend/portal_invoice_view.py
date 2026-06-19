"""Customer-facing invoice visibility rules for the rider portal."""

from __future__ import annotations

from typing import Any

CUSTOMER_VISIBLE_STATUSES = ("estimate", "in_progress", "completed", "paid")

# Full detail + print preview + photos + mechanic notes.
PRINTABLE_STATUSES = frozenset({"completed", "paid"})

# Line-item breakdown in the garage UI (no notes/photos/print).
DETAIL_STATUSES = frozenset({"estimate", *PRINTABLE_STATUSES})


def customer_view_level(status: str) -> str:
    if status == "in_progress":
        return "summary"
    if status == "estimate":
        return "estimate"
    if status in PRINTABLE_STATUSES:
        return "full"
    return "summary"


def serialize_customer_invoice(
    invoice: dict[str, Any],
    *,
    bike: dict[str, Any] | None,
    line_items: list[dict[str, Any]],
) -> dict[str, Any]:
    """Strip sensitive fields before sending an invoice to a customer."""
    status = str(invoice.get("status") or "")
    level = customer_view_level(status)

    payload: dict[str, Any] = {
        "id": invoice["id"],
        "invoice_number": invoice["invoice_number"],
        "status": status,
        "created_at": invoice.get("created_at"),
        "bike_id": invoice.get("bike_id"),
        "owner_id": invoice.get("owner_id"),
        "bike": bike,
        "customer_view_level": level,
        "line_items": [],
    }

    if level == "summary":
        return payload

    payload["odometer_in"] = invoice.get("odometer_in")
    payload["odometer_out"] = invoice.get("odometer_out")
    payload["line_items"] = line_items

    if level == "estimate":
        payload["mechanic_notes"] = None
        return payload

    payload["mechanic_notes"] = invoice.get("mechanic_notes")
    return payload


def serialize_customer_invoice_for_print(
    invoice: dict[str, Any],
    *,
    bike: dict[str, Any] | None,
    line_items: list[dict[str, Any]],
    owner: dict[str, Any] | None,
) -> dict[str, Any]:
    """Full invoice payload for print preview (completed/paid only)."""
    return {
        "id": invoice["id"],
        "invoice_number": invoice["invoice_number"],
        "status": invoice.get("status"),
        "created_at": invoice.get("created_at"),
        "bike_id": invoice.get("bike_id"),
        "owner_id": invoice.get("owner_id"),
        "odometer_in": invoice.get("odometer_in"),
        "odometer_out": invoice.get("odometer_out"),
        "mechanic_notes": invoice.get("mechanic_notes"),
        "bike": bike,
        "owner": owner,
        "line_items": line_items,
        "customer_view_level": "full",
    }
