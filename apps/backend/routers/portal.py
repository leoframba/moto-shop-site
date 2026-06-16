# routers/portal.py
from dependencies import supabase, verify_user
from fastapi import APIRouter, Depends, HTTPException
from storage_utils import attach_signed_urls

# Router — every endpoint requires an authenticated (non-admin or admin) user.
router = APIRouter(
    prefix="/api/portal",
    tags=["Portal"],
    dependencies=[Depends(verify_user)],
)

# Statuses a customer should be able to see in their garage. Internal drafts and
# voided invoices are intentionally hidden.
CUSTOMER_VISIBLE_STATUSES = ["estimate", "in_progress", "completed", "paid"]

_BIKE_FIELDS = "id, owner_id, year, make, model, vin, license_plate"


@router.get("/garage")
async def get_garage(user=Depends(verify_user)):
    """Return the authenticated rider's bikes and their visible invoices."""
    try:
        user_id = user.id

        settings_response = (
            supabase.table("shop_settings").select("tax_rate").eq("id", 1).execute()
        )
        tax_rate = 0.0
        if (
            settings_response.data
            and settings_response.data[0].get("tax_rate") is not None
        ):
            tax_rate = float(settings_response.data[0]["tax_rate"])

        bikes_response = (
            supabase.table("bikes")
            .select(_BIKE_FIELDS)
            .eq("owner_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        bikes = bikes_response.data or []
        bikes_by_id = {bike["id"]: bike for bike in bikes}

        invoices_response = (
            supabase.table("invoices")
            .select("*")
            .eq("owner_id", user_id)
            .in_("status", CUSTOMER_VISIBLE_STATUSES)
            .order("created_at", desc=True)
            .execute()
        )
        invoices = invoices_response.data or []

        line_items_by_invoice = {}
        if invoices:
            invoice_ids = [invoice["id"] for invoice in invoices]
            line_items_response = (
                supabase.table("invoice_line_items")
                .select("*")
                .in_("invoice_id", invoice_ids)
                .order("created_at", desc=False)
                .execute()
            )
            for item in line_items_response.data or []:
                invoice_id = item.get("invoice_id")
                if invoice_id:
                    line_items_by_invoice.setdefault(invoice_id, []).append(item)

        # Hydrate bikes referenced by invoices but not in the owner's current list
        # (e.g. a bike that was reassigned). Keeps the historical record intact.
        missing_bike_ids = list(
            {
                invoice["bike_id"]
                for invoice in invoices
                if invoice.get("bike_id") and invoice["bike_id"] not in bikes_by_id
            }
        )
        if missing_bike_ids:
            extra_bikes_response = (
                supabase.table("bikes")
                .select(_BIKE_FIELDS)
                .in_("id", missing_bike_ids)
                .execute()
            )
            for bike in extra_bikes_response.data or []:
                bikes_by_id[bike["id"]] = bike

        hydrated_invoices = []
        for invoice in invoices:
            hydrated_invoices.append(
                {
                    **invoice,
                    "bike": (
                        bikes_by_id.get(invoice.get("bike_id"))
                        if invoice.get("bike_id")
                        else None
                    ),
                    "line_items": line_items_by_invoice.get(invoice["id"], []),
                }
            )

        return {
            "tax_rate": tax_rate,
            "bikes": bikes,
            "invoices": hydrated_invoices,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/invoices/{invoice_id}/photos")
async def get_invoice_photos(invoice_id: str, user=Depends(verify_user)):
    """Return signed URLs for photos on an invoice the rider owns."""
    try:
        invoice_response = (
            supabase.table("invoices")
            .select("id, owner_id")
            .eq("id", invoice_id)
            .execute()
        )
        rows = invoice_response.data or []
        if not rows or rows[0].get("owner_id") != user.id:
            raise HTTPException(status_code=404, detail="Invoice not found")

        photos_response = (
            supabase.table("invoice_photos")
            .select("id, caption, storage_path, created_at")
            .eq("invoice_id", invoice_id)
            .order("created_at", desc=False)
            .execute()
        )
        return attach_signed_urls(
            photos_response.data or [], include_storage_path=False
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
