# routers/admin.py
import os
import uuid
from datetime import datetime
from urllib.parse import urlparse

from dependencies import supabase, verify_admin
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from labor_utils import line_labor_hours
from schemas import (
    BikeCreate,
    BikeUpdate,
    CategoryCreate,
    EmployeeCreate,
    EmployeeUpdate,
    InvoiceCreate,
    InvoiceMechanicNotesUpdate,
    InvoiceStatusUpdate,
    InvoiceUpdate,
    PartCreate,
    PartUpdate,
    RateUpdate,
    ServiceCreate,
    ServiceInternalUpdate,
    ServiceUpdate,
    ServiceVisibilityUpdate,
    ShopSettingsUpdate,
    UserInvite,
    UserResendInvite,
    UserUpdate,
    VoiceNoteRequest,
)
from voice_note import format_voice_note_block, summarize_voice_note
from service_pricing import serialize_admin_service
from storage_utils import (
    INVOICE_PHOTOS_BUCKET,
    attach_signed_urls,
    extension_for,
    remove_objects,
)

# Router
router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"],
    dependencies=[Depends(verify_admin)],
)


# ==========================================
# CATEGORY MANAGEMENT
# ==========================================


# Creates a Category
@router.post("/categories")
async def create_category(category: CategoryCreate):
    try:
        response = supabase.table("categories").insert(category.model_dump()).execute()
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create category")
        return response.data[0]
    except Exception as e:
        # Supabase throws an error if the unique constraint (duplicate name) is violated
        raise HTTPException(status_code=400, detail=str(e))


# Deletes a Category
@router.delete("/categories/{category_id}")
async def delete_category(category_id: str):
    try:
        response = supabase.table("categories").delete().eq("id", category_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Category not found")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# SERVICE MANAGEMENT
# ==========================================


# Creates a Service
@router.post("/services")
async def create_service(service: ServiceCreate):
    try:
        response = supabase.table("services").insert(service.model_dump()).execute()
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create service")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Deletes a Service
@router.delete("/services/{service_id}")
async def delete_service(service_id: str):
    response = supabase.table("services").delete().eq("id", service_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Service not found")
    return {"message": "Service deleted successfully"}


# Updates a Service
@router.patch("/services/{service_id}")
async def update_service(service_id: str, service: ServiceUpdate):
    response = (
        supabase.table("services")
        .update(service.model_dump())
        .eq("id", service_id)
        .execute()
    )

    if len(response.data) == 0:
        raise HTTPException(status_code=400, detail="Failed to update service")

    return response.data[0]


# Lists all services (including hidden) for admin management.
@router.get("/services")
async def list_admin_services():
    try:
        settings_response = (
            supabase.table("shop_settings").select("hourly_rate").eq("id", 1).execute()
        )
        if not settings_response.data:
            raise HTTPException(status_code=500, detail="Shop settings not found")
        hourly_rate = float(settings_response.data[0]["hourly_rate"])

        categories_response = supabase.table("categories").select("*").execute()
        services_response = (
            supabase.table("services").select("*, categories(id, name)").execute()
        )

        services = [
            serialize_admin_service(service, hourly_rate)
            for service in (services_response.data or [])
        ]

        return {
            "hourly_rate": hourly_rate,
            "categories": categories_response.data,
            "services": services,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Toggles a service's visibility on the public menu.
@router.patch("/services/{service_id}/visibility")
async def update_service_visibility(service_id: str, payload: ServiceVisibilityUpdate):
    existing = (
        supabase.table("services").select("is_internal").eq("id", service_id).execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Service not found")
    if existing.data[0].get("is_internal"):
        raise HTTPException(
            status_code=400,
            detail="Invoice-only services are never on the public menu.",
        )

    response = (
        supabase.table("services")
        .update({"is_hidden": payload.is_hidden})
        .eq("id", service_id)
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Service not found")
    return response.data[0]


# Toggles whether a service is invoice-only (never on the public menu).
@router.patch("/services/{service_id}/internal")
async def update_service_internal(service_id: str, payload: ServiceInternalUpdate):
    update_payload: dict = {"is_internal": payload.is_internal}
    if payload.is_internal:
        update_payload["is_hidden"] = False

    response = (
        supabase.table("services").update(update_payload).eq("id", service_id).execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Service not found")
    return response.data[0]


# Updates the Shop Rate
@router.patch("/shop-rate")
async def update_hourly_rate(update: RateUpdate):
    response = (
        supabase.table("shop_settings")
        .update({"hourly_rate": update.hourly_rate})
        .eq("id", 1)
        .execute()
    )
    if len(response.data) == 0:
        raise HTTPException(status_code=400, detail="Failed to update rate")
    return response.data[0]


@router.get("/shop-settings")
async def get_shop_settings():
    try:
        response = supabase.table("shop_settings").select("*").eq("id", 1).execute()
        rows = response.data or []
        if not rows:
            raise HTTPException(status_code=404, detail="Shop settings not found")
        return rows[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/shop-settings")
async def update_shop_settings(payload: ShopSettingsUpdate):
    try:
        update_payload = {
            key: value
            for key, value in payload.model_dump().items()
            if value is not None
        }
        if not update_payload:
            raise HTTPException(status_code=400, detail="No settings provided")

        response = (
            supabase.table("shop_settings").update(update_payload).eq("id", 1).execute()
        )
        rows = response.data or []
        if not rows:
            raise HTTPException(status_code=404, detail="Shop settings not found")
        return rows[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# EMPLOYEE MANAGEMENT
# ==========================================


@router.get("/employees")
async def list_employees():
    try:
        response = (
            supabase.table("employees")
            .select("id, first_name, last_name, created_at")
            .order("last_name")
            .order("first_name")
            .execute()
        )
        return response.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/employees")
async def create_employee(payload: EmployeeCreate):
    try:
        response = (
            supabase.table("employees")
            .insert(
                {
                    "first_name": payload.first_name,
                    "last_name": payload.last_name,
                }
            )
            .execute()
        )
        rows = response.data or []
        if not rows:
            raise HTTPException(status_code=400, detail="Failed to create employee")
        return rows[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/employees/{employee_id}")
async def update_employee(employee_id: str, payload: EmployeeUpdate):
    try:
        response = (
            supabase.table("employees")
            .update(
                {
                    "first_name": payload.first_name,
                    "last_name": payload.last_name,
                }
            )
            .eq("id", employee_id)
            .execute()
        )
        rows = response.data or []
        if not rows:
            raise HTTPException(status_code=404, detail="Employee not found")
        return rows[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/labor/summary")
async def labor_summary(
    start_at: datetime = Query(..., description="Inclusive range start (ISO 8601)"),
    end_at: datetime = Query(..., description="Inclusive range end (ISO 8601)"),
    statuses: list[str] = Query(
        default=["completed", "paid"],
        description="Invoice statuses to include",
    ),
):
    try:
        if end_at < start_at:
            raise HTTPException(
                status_code=400,
                detail="end_at must be on or after start_at.",
            )

        if not statuses:
            return {"rows": [], "total_hours": 0.0}

        invoices_response = (
            supabase.table("invoices")
            .select("id, invoice_number")
            .gte("created_at", start_at.isoformat())
            .lte("created_at", end_at.isoformat())
            .in_("status", statuses)
            .execute()
        )
        invoices = invoices_response.data or []
        invoice_ids = [row["id"] for row in invoices]
        if not invoice_ids:
            return {"rows": [], "total_hours": 0.0}

        settings_response = (
            supabase.table("shop_settings").select("hourly_rate").eq("id", 1).execute()
        )
        settings_rows = settings_response.data or []
        hourly_rate = float(settings_rows[0]["hourly_rate"]) if settings_rows else 0.0

        invoice_numbers = {row["id"]: row.get("invoice_number") for row in invoices}

        lines_response = (
            supabase.table("invoice_line_items")
            .select(
                "id, invoice_id, employee_id, quantity, unit_price, pricing_type, snapshot_name"
            )
            .in_("invoice_id", invoice_ids)
            .eq("item_type", "service")
            .execute()
        )

        employees_response = (
            supabase.table("employees").select("id, first_name, last_name").execute()
        )
        employee_names = {
            row["id"]: f"{row.get('first_name', '')} {row.get('last_name', '')}".strip()
            for row in (employees_response.data or [])
        }

        grouped: dict[str, dict] = {}
        for line in lines_response.data or []:
            employee_id = line.get("employee_id")
            key = employee_id or "__shop__"
            if key not in grouped:
                grouped[key] = {"hours": 0.0, "breakdown": []}

            pricing_type = line.get("pricing_type") or "fixed"
            quantity = float(line.get("quantity") or 0)
            unit_price = float(line.get("unit_price") or 0)
            hours = line_labor_hours(pricing_type, quantity, unit_price, hourly_rate)
            grouped[key]["hours"] += hours

            invoice_id = line.get("invoice_id")
            grouped[key]["breakdown"].append(
                {
                    "id": line.get("id"),
                    "invoice_id": invoice_id,
                    "invoice_number": invoice_numbers.get(invoice_id),
                    "snapshot_name": line.get("snapshot_name") or "Service",
                    "pricing_type": pricing_type,
                    "hours": hours,
                }
            )

        rows = []
        for key, payload in sorted(
            grouped.items(),
            key=lambda item: (-item[1]["hours"], item[0]),
        ):
            breakdown = sorted(
                payload["breakdown"],
                key=lambda entry: (
                    -(entry.get("invoice_number") or 0),
                    entry.get("snapshot_name") or "",
                ),
            )
            rows.append(
                {
                    "employee_id": None if key == "__shop__" else key,
                    "employee_name": "Shop Labor"
                    if key == "__shop__"
                    else employee_names.get(key, "Unknown"),
                    "hours": round(payload["hours"], 1),
                    "breakdown": breakdown,
                }
            )

        total_hours = round(sum(row["hours"] for row in rows), 1)
        return {"rows": rows, "total_hours": total_hours}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# USER MANAGEMENT
# ==========================================


@router.get("/users")
async def list_users():
    try:
        response = (
            supabase.table("users")
            .select("id, email, first_name, last_name, phone_number, is_admin")
            .order("created_at", desc=True)
            .execute()
        )

        users = response.data or []
        return [user for user in users if not user.get("is_admin")]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/users/{user_id}")
async def update_user(user_id: str, payload: UserUpdate):
    try:
        existing = (
            supabase.table("users").select("id, is_admin").eq("id", user_id).execute()
        )
        existing_rows = existing.data or []
        if not existing_rows:
            raise HTTPException(status_code=404, detail="User not found")
        if existing_rows[0].get("is_admin"):
            raise HTTPException(
                status_code=403, detail="Admin accounts cannot be edited here."
            )

        update_payload = {
            "first_name": payload.first_name,
            "last_name": payload.last_name,
            "phone_number": payload.phone_number,
        }

        updated = (
            supabase.table("users").update(update_payload).eq("id", user_id).execute()
        )
        updated_rows = updated.data or []
        if not updated_rows:
            raise HTTPException(status_code=404, detail="User not found")
        return updated_rows[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _resolve_invite_redirect_base(explicit: str | None) -> str:
    """Pick the frontend origin embedded in invite links.

    Prefers the admin UI origin sent by the browser, then SITE_URL env.
    Only allows known hostnames to avoid open-redirect abuse.
    """
    env_default = os.environ.get("SITE_URL", "http://localhost:3000").rstrip("/")
    if not explicit:
        return env_default

    explicit = explicit.strip().rstrip("/")
    parsed = urlparse(explicit)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        return env_default

    hostname = (parsed.hostname or "").lower()
    allowed_hosts = {
        h.strip().lower()
        for h in os.environ.get(
            "ALLOWED_SITE_HOSTS",
            "localhost,127.0.0.1,advcycles.com,www.advcycles.com,"
            "moto-shop-site-frontend.vercel.app",
        ).split(",")
        if h.strip()
    }

    if hostname in allowed_hosts or hostname.endswith(".vercel.app"):
        return f"{parsed.scheme}://{parsed.netloc}"

    return env_default


@router.post("/users/invite")
async def invite_user(payload: UserInvite):
    try:
        user_metadata = {
            key: value
            for key, value in {
                "first_name": payload.first_name,
                "last_name": payload.last_name,
                "phone_number": payload.phone_number,
            }.items()
            if value is not None
        }

        try:
            site_url = _resolve_invite_redirect_base(payload.redirect_base_url)
            # Invites are server-initiated, so the user's browser has no PKCE code
            # verifier — the /auth/callback exchangeCodeForSession path cannot work.
            # Send the implicit-flow tokens straight to the client page, which
            # consumes the #access_token / #refresh_token hash via setSession().
            redirect_to = f"{site_url}/accept-invite"

            invite_response = supabase.auth.admin.invite_user_by_email(
                payload.email,
                {"data": user_metadata, "redirect_to": redirect_to},
            )
        except Exception as invite_error:
            message = str(invite_error)
            if "already" in message.lower() and "registered" in message.lower():
                raise HTTPException(
                    status_code=409,
                    detail="A user with that email already exists.",
                )
            raise HTTPException(status_code=400, detail=message)

        invited_user = getattr(invite_response, "user", None)
        if invited_user is None or not getattr(invited_user, "id", None):
            raise HTTPException(status_code=400, detail="Failed to invite user.")

        profile_payload = {
            "id": invited_user.id,
            "email": payload.email,
            "first_name": payload.first_name,
            "last_name": payload.last_name,
            "phone_number": payload.phone_number,
        }

        upserted = (
            supabase.table("users").upsert(profile_payload, on_conflict="id").execute()
        )
        upserted_rows = upserted.data or []
        return {
            "user": upserted_rows[0] if upserted_rows else profile_payload,
            "message": "Invitation sent.",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _extract_link_properties(link_response) -> dict:
    """Normalize generate_link properties across SDK response shapes."""
    properties = getattr(link_response, "properties", None)
    if properties is not None:
        return {
            "hashed_token": getattr(properties, "hashed_token", None),
            "verification_type": getattr(properties, "verification_type", None),
            "action_link": getattr(properties, "action_link", None),
        }
    if isinstance(link_response, dict):
        props = link_response.get("properties") or {}
        return {
            "hashed_token": props.get("hashed_token"),
            "verification_type": props.get("verification_type"),
            "action_link": props.get("action_link"),
        }
    return {}


@router.post("/users/{user_id}/resend-invite")
async def resend_invite(user_id: str, payload: UserResendInvite):
    try:
        record = (
            supabase.table("users")
            .select("id, email, first_name, last_name, phone_number")
            .eq("id", user_id)
            .maybe_single()
            .execute()
        )
        user_row = record.data if record else None
        if not user_row or not user_row.get("email"):
            raise HTTPException(status_code=404, detail="User not found.")

        email = user_row["email"]
        site_url = _resolve_invite_redirect_base(payload.redirect_base_url)
        redirect_to = f"{site_url}/accept-invite"
        user_metadata = {
            key: value
            for key, value in {
                "first_name": user_row.get("first_name"),
                "last_name": user_row.get("last_name"),
                "phone_number": user_row.get("phone_number"),
            }.items()
            if value is not None
        }

        # Mint a fresh one-time token. "invite" works for never-confirmed users;
        # already-existing users fall back to a magiclink (same /accept-invite
        # landing where they set their password). We build a button-gated
        # token_hash link to /accept-invite so email scanners that GET the page
        # don't consume the token — only a human click runs verifyOtp().
        props = {}
        last_error = None
        for link_type in ("invite", "magiclink"):
            try:
                options = {"redirect_to": redirect_to}
                if link_type == "invite" and user_metadata:
                    options["data"] = user_metadata
                link_response = supabase.auth.admin.generate_link(
                    {"type": link_type, "email": email, "options": options}
                )
                props = _extract_link_properties(link_response)
                if props.get("hashed_token"):
                    break
            except Exception as link_error:  # noqa: BLE001
                last_error = link_error
                continue

        hashed_token = props.get("hashed_token")
        if not hashed_token:
            detail = str(last_error) if last_error else "Failed to generate link."
            raise HTTPException(status_code=400, detail=detail)

        verification_type = props.get("verification_type") or "invite"
        action_link = (
            f"{redirect_to}?token_hash={hashed_token}&type={verification_type}"
        )

        return {
            "email": email,
            "action_link": action_link,
            "message": "Fresh invite link generated.",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# BIKE MANAGEMENT (INVOICES)
# ==========================================


@router.get("/bikes")
async def list_bikes():
    try:
        response = (
            supabase.table("bikes")
            .select("*, owner:users(id, email, first_name, last_name, phone_number)")
            .order("created_at", desc=True)
            .execute()
        )
        return response.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/bikes")
async def create_bike(bike: BikeCreate):
    try:
        response = supabase.table("bikes").insert(bike.model_dump()).execute()
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create bike")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/bikes/{bike_id}")
async def delete_bike(bike_id: str):
    try:
        response = supabase.table("bikes").delete().eq("id", bike_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Bike not found")
        return {"message": "Bike deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# INVOICE MANAGEMENT
# ==========================================


def _invoice_header_metadata(invoice) -> dict:
    payload = {}
    if invoice.invoice_number is not None:
        payload["invoice_number"] = invoice.invoice_number
    if invoice.created_at is not None:
        payload["created_at"] = invoice.created_at.isoformat()
    return payload


def _assert_invoice_number_available(
    invoice_number: int, exclude_invoice_id: str | None = None
) -> None:
    query = (
        supabase.table("invoices")
        .select("id")
        .eq("invoice_number", invoice_number)
        .limit(1)
    )
    response = query.execute()
    rows = response.data or []
    if not rows:
        return

    existing_id = rows[0].get("id")
    if exclude_invoice_id and existing_id == exclude_invoice_id:
        return

    raise HTTPException(
        status_code=409,
        detail="An invoice with this number already exists.",
    )


def _raise_invoice_http_error(exc: Exception) -> None:
    message = str(exc)
    lowered = message.lower()
    if "duplicate" in lowered or "unique" in lowered:
        if "invoice_number" in lowered:
            raise HTTPException(
                status_code=409,
                detail="An invoice with this number already exists.",
            )
        raise HTTPException(
            status_code=409,
            detail="An invoice with these values already exists.",
        )
    raise HTTPException(status_code=500, detail=message)


def _invoice_line_item_row(invoice_id: str, item) -> dict:
    row = {
        "invoice_id": invoice_id,
        "item_type": item.item_type,
        "service_id": item.service_id if item.item_type == "service" else None,
        "part_id": item.part_id if item.item_type == "part" else None,
        "employee_id": item.employee_id if item.item_type == "service" else None,
        "snapshot_name": item.snapshot_name,
        "pricing_type": item.pricing_type if item.item_type == "service" else None,
        "unit_price": item.unit_price,
        "quantity": item.quantity,
    }
    if item.item_type == "part":
        row["snapshot_part_number"] = item.snapshot_part_number
    return row


@router.get("/invoices")
async def list_invoices():
    try:
        invoices_response = (
            supabase.table("invoices")
            .select("*")
            .order("created_at", desc=True)
            .execute()
        )
        invoices = invoices_response.data or []

        if not invoices:
            return []

        invoice_ids = [invoice["id"] for invoice in invoices]
        owner_ids = list(
            {invoice["owner_id"] for invoice in invoices if invoice.get("owner_id")}
        )
        bike_ids = list(
            {invoice["bike_id"] for invoice in invoices if invoice.get("bike_id")}
        )

        line_items_response = (
            supabase.table("invoice_line_items")
            .select("*")
            .in_("invoice_id", invoice_ids)
            .order("created_at", desc=False)
            .execute()
        )
        line_items = line_items_response.data or []

        users_by_id = {}
        if owner_ids:
            users_response = (
                supabase.table("users")
                .select("id, email, first_name, last_name, phone_number")
                .in_("id", owner_ids)
                .execute()
            )
            users_by_id = {user["id"]: user for user in (users_response.data or [])}

        bikes_by_id = {}
        if bike_ids:
            bikes_response = (
                supabase.table("bikes")
                .select("id, owner_id, year, make, model, vin, license_plate")
                .in_("id", bike_ids)
                .execute()
            )
            bikes_by_id = {bike["id"]: bike for bike in (bikes_response.data or [])}

        line_items_by_invoice = {}
        for item in line_items:
            invoice_id = item.get("invoice_id")
            if not invoice_id:
                continue
            line_items_by_invoice.setdefault(invoice_id, []).append(item)

        hydrated_invoices = []
        for invoice in invoices:
            hydrated_invoices.append(
                {
                    **invoice,
                    "owner": (
                        users_by_id.get(invoice.get("owner_id"))
                        if invoice.get("owner_id")
                        else None
                    ),
                    "bike": (
                        bikes_by_id.get(invoice.get("bike_id"))
                        if invoice.get("bike_id")
                        else None
                    ),
                    "line_items": line_items_by_invoice.get(invoice["id"], []),
                }
            )

        return hydrated_invoices
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/invoices")
async def create_invoice(invoice: InvoiceCreate):
    created_invoice = None

    try:
        if invoice.invoice_number is not None:
            _assert_invoice_number_available(invoice.invoice_number)

        invoice_payload = {
            "owner_id": invoice.owner_id,
            "bike_id": invoice.bike_id,
            "status": invoice.status,
            "odometer_in": invoice.odometer_in,
            "odometer_out": invoice.odometer_out,
            "mechanic_notes": invoice.mechanic_notes,
            "customer_first_name": invoice.customer_first_name,
            "customer_last_name": invoice.customer_last_name,
            "customer_address": invoice.customer_address,
            "customer_phone": invoice.customer_phone,
            "customer_email": invoice.customer_email,
            **_invoice_header_metadata(invoice),
        }

        created_invoice_response = (
            supabase.table("invoices").insert(invoice_payload).execute()
        )
        created_invoice_rows = created_invoice_response.data or []
        created_invoice = created_invoice_rows[0] if created_invoice_rows else None

        if not created_invoice:
            raise HTTPException(status_code=400, detail="Failed to create invoice")

        line_items_payload = [
            _invoice_line_item_row(created_invoice["id"], item)
            for item in invoice.line_items
        ]

        inserted_line_items: list[dict] = []
        if line_items_payload:
            line_items_response = (
                supabase.table("invoice_line_items")
                .insert(line_items_payload)
                .execute()
            )
            inserted_line_items = line_items_response.data or []

        return {
            "invoice": created_invoice,
            "line_items": inserted_line_items,
        }
    except HTTPException:
        raise
    except Exception as e:
        # Best-effort rollback to avoid orphaned invoice headers if line insert fails.
        if created_invoice and created_invoice.get("id"):
            try:
                supabase.table("invoices").delete().eq(
                    "id", created_invoice["id"]
                ).execute()
            except Exception:
                pass
        _raise_invoice_http_error(e)


@router.patch("/invoices/{invoice_id}")
async def update_invoice(invoice_id: str, invoice: InvoiceUpdate):
    try:
        if invoice.invoice_number is not None:
            _assert_invoice_number_available(
                invoice.invoice_number, exclude_invoice_id=invoice_id
            )

        invoice_payload = {
            "owner_id": invoice.owner_id,
            "bike_id": invoice.bike_id,
            "status": invoice.status,
            "odometer_in": invoice.odometer_in,
            "odometer_out": invoice.odometer_out,
            "mechanic_notes": invoice.mechanic_notes,
            "customer_first_name": invoice.customer_first_name,
            "customer_last_name": invoice.customer_last_name,
            "customer_address": invoice.customer_address,
            "customer_phone": invoice.customer_phone,
            "customer_email": invoice.customer_email,
            **_invoice_header_metadata(invoice),
        }

        updated_invoice_response = (
            supabase.table("invoices")
            .update(invoice_payload)
            .eq("id", invoice_id)
            .execute()
        )
        updated_invoice_rows = updated_invoice_response.data or []
        if not updated_invoice_rows:
            raise HTTPException(status_code=404, detail="Invoice not found")

        supabase.table("invoice_line_items").delete().eq(
            "invoice_id", invoice_id
        ).execute()

        line_items_payload = [
            _invoice_line_item_row(invoice_id, item) for item in invoice.line_items
        ]

        inserted_line_items: list[dict] = []
        if line_items_payload:
            line_items_response = (
                supabase.table("invoice_line_items")
                .insert(line_items_payload)
                .execute()
            )
            inserted_line_items = line_items_response.data or []

        return {
            "invoice": updated_invoice_rows[0],
            "line_items": inserted_line_items,
        }
    except HTTPException:
        raise
    except Exception as e:
        _raise_invoice_http_error(e)


@router.delete("/invoices/{invoice_id}")
async def delete_invoice(invoice_id: str):
    try:
        # Remove any stored photos so we don't orphan objects in the bucket.
        photos_response = (
            supabase.table("invoice_photos")
            .select("storage_path")
            .eq("invoice_id", invoice_id)
            .execute()
        )
        photo_paths = [
            photo["storage_path"]
            for photo in (photos_response.data or [])
            if photo.get("storage_path")
        ]
        remove_objects(photo_paths)

        supabase.table("invoice_line_items").delete().eq(
            "invoice_id", invoice_id
        ).execute()
        deleted_invoice_response = (
            supabase.table("invoices").delete().eq("id", invoice_id).execute()
        )
        if not deleted_invoice_response.data:
            raise HTTPException(status_code=404, detail="Invoice not found")
        return {"message": "Invoice deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# INVOICE PHOTOS
# ==========================================

ALLOWED_PHOTO_MIME_PREFIX = "image/"
MAX_PHOTO_BYTES = 12 * 1024 * 1024  # safety cap; clients compress before upload


@router.get("/invoices/{invoice_id}/photos")
async def list_invoice_photos(invoice_id: str):
    try:
        response = (
            supabase.table("invoice_photos")
            .select("*")
            .eq("invoice_id", invoice_id)
            .order("created_at", desc=False)
            .execute()
        )
        return attach_signed_urls(response.data or [])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/invoices/{invoice_id}/photos")
async def upload_invoice_photos(
    invoice_id: str,
    files: list[UploadFile] = File(...),
    caption: str | None = Form(None),
    admin=Depends(verify_admin),
):
    try:
        invoice_response = (
            supabase.table("invoices").select("id").eq("id", invoice_id).execute()
        )
        if not (invoice_response.data or []):
            raise HTTPException(status_code=404, detail="Invoice not found")

        normalized_caption = (caption or "").strip() or None
        created_rows: list[dict] = []

        for upload in files:
            content_type = upload.content_type or "application/octet-stream"
            if not content_type.startswith(ALLOWED_PHOTO_MIME_PREFIX):
                raise HTTPException(
                    status_code=400,
                    detail=f"{upload.filename or 'File'} is not an image.",
                )

            data = await upload.read()
            if not data:
                continue
            if len(data) > MAX_PHOTO_BYTES:
                raise HTTPException(
                    status_code=413,
                    detail=f"{upload.filename or 'File'} is too large.",
                )

            ext = extension_for(upload.filename, content_type)
            storage_path = f"{invoice_id}/{uuid.uuid4().hex}{ext}"

            try:
                supabase.storage.from_(INVOICE_PHOTOS_BUCKET).upload(
                    storage_path,
                    data,
                    {"content-type": content_type, "upsert": "false"},
                )
            except Exception as upload_error:
                raise HTTPException(
                    status_code=502,
                    detail=f"Failed to upload {upload.filename or 'file'}: {upload_error}",
                )

            insert_response = (
                supabase.table("invoice_photos")
                .insert(
                    {
                        "invoice_id": invoice_id,
                        "storage_path": storage_path,
                        "caption": normalized_caption,
                        "uploaded_by": getattr(admin, "id", None),
                    }
                )
                .execute()
            )
            created_rows.extend(insert_response.data or [])

        if not created_rows:
            raise HTTPException(status_code=400, detail="No valid images uploaded.")

        return attach_signed_urls(created_rows)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/invoices/{invoice_id}/photos/{photo_id}")
async def delete_invoice_photo(invoice_id: str, photo_id: str):
    try:
        photo_response = (
            supabase.table("invoice_photos")
            .select("*")
            .eq("id", photo_id)
            .eq("invoice_id", invoice_id)
            .execute()
        )
        rows = photo_response.data or []
        if not rows:
            raise HTTPException(status_code=404, detail="Photo not found")

        remove_objects([rows[0].get("storage_path")])
        supabase.table("invoice_photos").delete().eq("id", photo_id).execute()
        return {"message": "Photo deleted."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/invoices/{invoice_id}/status")
async def update_invoice_status(invoice_id: str, payload: InvoiceStatusUpdate):
    try:
        response = (
            supabase.table("invoices")
            .update({"status": payload.status})
            .eq("id", invoice_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Invoice not found")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/invoices/{invoice_id}/mechanic-notes")
async def update_invoice_mechanic_notes(
    invoice_id: str, payload: InvoiceMechanicNotesUpdate
):
    try:
        response = (
            supabase.table("invoices")
            .update({"mechanic_notes": payload.mechanic_notes})
            .eq("id", invoice_id)
            .select("*")
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Invoice not found")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/invoices/{invoice_id}/voice-note")
async def summarize_invoice_voice_note(invoice_id: str, payload: VoiceNoteRequest):
    try:
        invoice_response = (
            supabase.table("invoices").select("id").eq("id", invoice_id).execute()
        )
        if not (invoice_response.data or []):
            raise HTTPException(status_code=404, detail="Invoice not found")

        summary = summarize_voice_note(payload.audio_base64, payload.mime_type)

        return {
            "invoiceId": invoice_id,
            "transcript": summary.transcript,
            "summaryBullets": summary.summaryBullets,
            "mechanicNotesBlock": format_voice_note_block(summary),
        }
    except HTTPException:
        raise
    except RuntimeError as e:
        message = str(e)
        status_code = 500 if "GEMINI_API_KEY is not configured" in message else 502
        raise HTTPException(status_code=status_code, detail=message) from e
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e)) from e


@router.patch("/bikes/{bike_id}")
async def update_bike(bike_id: str, bike: BikeUpdate):
    try:
        response = (
            supabase.table("bikes")
            .update(bike.model_dump())
            .eq("id", bike_id)
            .execute()
        )
        if len(response.data) == 0:
            raise HTTPException(status_code=404, detail="Bike not found")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# PART MANAGEMENT (INVOICES)
# ==========================================


def _raise_part_http_error(exc: Exception) -> None:
    message = str(exc)
    lowered = message.lower()
    if "duplicate" in lowered or "unique" in lowered:
        if "description" in lowered:
            raise HTTPException(
                status_code=409,
                detail="A part with this description already exists.",
            )
        if "part_number" in lowered:
            raise HTTPException(
                status_code=409,
                detail="A part with this part number already exists.",
            )
        raise HTTPException(
            status_code=409,
            detail="A part with these values already exists.",
        )
    raise HTTPException(status_code=500, detail=message)


@router.get("/parts")
async def list_parts():
    try:
        response = (
            supabase.table("parts")
            .select("*")
            .order("description", desc=False)
            .execute()
        )
        return response.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/parts")
async def create_part(part: PartCreate):
    try:
        response = supabase.table("parts").insert(part.model_dump()).execute()
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create part")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        _raise_part_http_error(e)


@router.delete("/parts/{part_id}")
async def delete_part(part_id: str):
    try:
        response = supabase.table("parts").delete().eq("id", part_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Part not found")
        return {"message": "Part deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/parts/{part_id}")
async def update_part(part_id: str, part: PartUpdate):
    try:
        response = (
            supabase.table("parts")
            .update(part.model_dump())
            .eq("id", part_id)
            .execute()
        )
        if len(response.data) == 0:
            raise HTTPException(status_code=404, detail="Part not found")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        _raise_part_http_error(e)
