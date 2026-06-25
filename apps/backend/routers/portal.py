# routers/portal.py
from dependencies import supabase, verify_user
from fastapi import APIRouter, Depends, HTTPException
from phone_utils import resolve_optional_phone, sync_auth_email, sync_auth_phone
from portal_invoice_view import (
    CUSTOMER_VISIBLE_STATUSES,
    PRINTABLE_STATUSES,
    serialize_customer_invoice,
    serialize_customer_invoice_for_print,
)
from schemas import UserUpdate
from storage_utils import attach_signed_urls

# Router — every endpoint requires an authenticated (non-admin or admin) user.
router = APIRouter(
    prefix="/api/portal",
    tags=["Portal"],
    dependencies=[Depends(verify_user)],
)

_BIKE_FIELDS = "id, owner_id, year, make, model, vin, license_plate"
_USER_FIELDS = "id, email, first_name, last_name, phone_number"


def _fetch_owned_invoice(invoice_id: str, user_id: str) -> dict:
    invoice_response = (
        supabase.table("invoices")
        .select("*")
        .eq("id", invoice_id)
        .eq("owner_id", user_id)
        .in_("status", list(CUSTOMER_VISIBLE_STATUSES))
        .execute()
    )
    rows = invoice_response.data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return rows[0]


def _hydrate_invoice(
    invoice: dict,
    *,
    bikes_by_id: dict[str, dict],
    line_items_by_invoice: dict[str, list[dict]],
    users_by_id: dict[str, dict] | None = None,
) -> tuple[dict | None, list[dict], dict | None]:
    bike = bikes_by_id.get(invoice.get("bike_id")) if invoice.get("bike_id") else None
    line_items = line_items_by_invoice.get(invoice["id"], [])
    owner = (
        users_by_id.get(invoice.get("owner_id"))
        if users_by_id and invoice.get("owner_id")
        else None
    )
    return bike, line_items, owner


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
            .in_("status", list(CUSTOMER_VISIBLE_STATUSES))
            .order("created_at", desc=True)
            .execute()
        )
        invoices = invoices_response.data or []

        line_items_by_invoice: dict[str, list[dict]] = {}
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
            bike, line_items, _owner = _hydrate_invoice(
                invoice,
                bikes_by_id=bikes_by_id,
                line_items_by_invoice=line_items_by_invoice,
            )
            hydrated_invoices.append(
                serialize_customer_invoice(
                    invoice,
                    bike=bike,
                    line_items=line_items,
                )
            )

        return {
            "tax_rate": tax_rate,
            "bikes": bikes,
            "invoices": hydrated_invoices,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/invoices/{invoice_id}/print")
async def get_invoice_print_data(invoice_id: str, user=Depends(verify_user)):
    """Return full invoice + shop settings for print (completed/paid only)."""
    try:
        invoice = _fetch_owned_invoice(invoice_id, user.id)
        status = str(invoice.get("status") or "")
        if status not in PRINTABLE_STATUSES:
            raise HTTPException(
                status_code=403,
                detail="Print preview is only available for completed or paid invoices.",
            )

        line_items_response = (
            supabase.table("invoice_line_items")
            .select("*")
            .eq("invoice_id", invoice_id)
            .order("created_at", desc=False)
            .execute()
        )
        line_items = line_items_response.data or []

        bike = None
        if invoice.get("bike_id"):
            bike_response = (
                supabase.table("bikes")
                .select(_BIKE_FIELDS)
                .eq("id", invoice["bike_id"])
                .execute()
            )
            bike_rows = bike_response.data or []
            bike = bike_rows[0] if bike_rows else None

        owner_response = (
            supabase.table("users").select(_USER_FIELDS).eq("id", user.id).execute()
        )
        owner_rows = owner_response.data or []
        owner = owner_rows[0] if owner_rows else None

        settings_response = (
            supabase.table("shop_settings").select("*").eq("id", 1).execute()
        )
        settings_rows = settings_response.data or []
        if not settings_rows:
            raise HTTPException(status_code=500, detail="Shop settings not found")

        return {
            "invoice": serialize_customer_invoice_for_print(
                invoice,
                bike=bike,
                line_items=line_items,
                owner=owner,
            ),
            "shop_settings": settings_rows[0],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/invoices/{invoice_id}/photos")
async def get_invoice_photos(invoice_id: str, user=Depends(verify_user)):
    """Return signed URLs for photos on a completed/paid invoice the rider owns."""
    try:
        invoice = _fetch_owned_invoice(invoice_id, user.id)
        status = str(invoice.get("status") or "")
        if status not in PRINTABLE_STATUSES:
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


@router.patch("/profile")
async def update_profile(payload: UserUpdate, user=Depends(verify_user)):
    """Let riders update their own profile after accepting an invite."""
    try:
        app_metadata = getattr(user, "app_metadata", None) or {}
        if app_metadata.get("role") == "admin":
            raise HTTPException(
                status_code=403, detail="Admins cannot update profile here."
            )

        existing = (
            supabase.table("users")
            .select("email")
            .eq("id", user.id)
            .maybe_single()
            .execute()
        )
        existing_row = existing.data if existing else None
        existing_email = (existing_row or {}).get("email") or ""

        update_payload = {
            "first_name": payload.first_name,
            "last_name": payload.last_name,
            "phone_number": resolve_optional_phone(payload.phone_number),
        }

        if "email" in payload.model_fields_set and payload.email:
            if existing_email.strip():
                raise HTTPException(
                    status_code=400,
                    detail="Email cannot be changed here. Contact the shop for help.",
                )
            update_payload["email"] = payload.email
            try:
                sync_auth_email(supabase, user.id, payload.email)
            except Exception as auth_error:
                message = str(auth_error)
                if "already" in message.lower() and "registered" in message.lower():
                    raise HTTPException(
                        status_code=409,
                        detail="A user with that email already exists.",
                    )
                raise HTTPException(status_code=400, detail=message)

        response = (
            supabase.table("users").update(update_payload).eq("id", user.id).execute()
        )
        rows = response.data or []
        if not rows:
            raise HTTPException(status_code=404, detail="Profile not found")

        if payload.phone_number is not None:
            sync_auth_phone(
                supabase,
                user.id,
                update_payload["phone_number"],
                confirm=bool(payload.setup_complete),
            )

        return rows[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
