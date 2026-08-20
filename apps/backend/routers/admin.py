# routers/admin.py
import os
import uuid
from datetime import datetime
from urllib.parse import urlparse

from dependencies import supabase, verify_admin
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from invite_utils import (
    invite_link_label,
    is_placeholder_invite_email,
    resolve_invite_email,
)
from labor_utils import line_labor_hours, resolve_service_pricing_type
from phone_utils import resolve_optional_phone, sync_auth_email, sync_auth_phone
from schemas import (
    BikeCreate,
    BikeUpdate,
    CategoryCreate,
    CategoryEdit,
    EmployeeCreate,
    EmployeeUpdate,
    InvoiceCreate,
    InvoiceMechanicNotesUpdate,
    InvoicePhotoCaptionUpdate,
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
    UserCreate,
    UserInvite,
    UserResendInvite,
    UserSendInvite,
    UserUpdate,
    VoiceNoteRequest,
)
from service_pricing import serialize_admin_service
from storage_utils import (
    INVOICE_PHOTOS_BUCKET,
    attach_signed_urls,
    extension_for,
    remove_objects,
)
from voice_note import format_voice_note_block, summarize_voice_note


def _sync_auth_phone(user_id: str, phone_number: str | None) -> None:
    sync_auth_phone(supabase, user_id, phone_number)


def _sync_auth_email(user_id: str, email: str) -> None:
    sync_auth_email(supabase, user_id, email)


def _ensure_auth_invite_email(user_id: str, invite_email: str, user_row: dict) -> None:
    """Attach a non-routable placeholder email in Auth when the rider is phone-only."""
    if (user_row.get("email") or "").strip():
        return
    if not is_placeholder_invite_email(invite_email):
        return
    try:
        _sync_auth_email(user_id, invite_email)
    except Exception as auth_error:
        message = str(auth_error)
        if "already" in message.lower() and "registered" in message.lower():
            raise HTTPException(
                status_code=409,
                detail="A user with that email already exists.",
            )
        raise HTTPException(status_code=400, detail=message)


def _require_user_contact(email: str | None, phone_number: str | None) -> None:
    if not email and not phone_number:
        raise HTTPException(
            status_code=400,
            detail="Either email or phone number is required.",
        )


def _get_auth_confirmation_flags(user_id: str) -> dict[str, bool]:
    try:
        response = supabase.auth.admin.get_user_by_id(user_id)
        auth_user = getattr(response, "user", None)
        if not auth_user:
            return {"email_confirmed": False, "phone_confirmed": False}
        return {
            "email_confirmed": bool(getattr(auth_user, "email_confirmed_at", None)),
            "phone_confirmed": bool(getattr(auth_user, "phone_confirmed_at", None)),
        }
    except Exception:
        return {"email_confirmed": False, "phone_confirmed": False}


def _user_metadata_from_row(row: dict) -> dict:
    return {
        key: value
        for key, value in {
            "first_name": row.get("first_name"),
            "last_name": row.get("last_name"),
            "phone_number": row.get("phone_number"),
        }.items()
        if value is not None
    }


def _mint_accept_invite_link(
    email: str,
    user_metadata: dict,
    redirect_base_url: str | None,
) -> str:
    site_url = _resolve_invite_redirect_base(redirect_base_url)
    redirect_to = f"{site_url}/accept-invite"
    props = {}
    last_error = None
    for link_type in ("invite", "magiclink"):
        try:
            options: dict = {"redirect_to": redirect_to}
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
    return f"{redirect_to}?token_hash={hashed_token}&type={verification_type}"


def _fetch_rider_user_row(user_id: str) -> dict:
    record = (
        supabase.table("users")
        .select("id, email, first_name, last_name, phone_number, is_admin")
        .eq("id", user_id)
        .maybe_single()
        .execute()
    )
    user_row = record.data if record else None
    if not user_row:
        raise HTTPException(status_code=404, detail="User not found.")
    if user_row.get("is_admin"):
        raise HTTPException(
            status_code=403, detail="Admin accounts cannot be invited here."
        )
    return user_row


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
        response = (
            supabase.table("categories").delete().eq("id", category_id).execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Category not found")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Updates a Category
@router.patch("/categories/{category_id}")
async def update_category(category_id: str, category: CategoryEdit):
    if str(category.id) != category_id:
        raise HTTPException(status_code=400, detail="Category id mismatch")
    try:
        response = (
            supabase.table("categories")
            .update({"name": category.name})
            .eq("id", category_id)
            .execute()
        )
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
        hourly_rate_value = (
            settings_rows[0].get("hourly_rate") if settings_rows else None
        )
        hourly_rate = (
            float(hourly_rate_value) if hourly_rate_value is not None else 0.0
        )

        invoice_numbers = {row["id"]: row.get("invoice_number") for row in invoices}

        lines_response = (
            supabase.table("invoice_line_items")
            .select(
                "id, invoice_id, employee_id, service_id, quantity, unit_price, pricing_type, snapshot_name"
            )
            .in_("invoice_id", invoice_ids)
            .eq("item_type", "service")
            .execute()
        )
        service_lines = lines_response.data or []
        service_ids = list(
            {
                line.get("service_id")
                for line in service_lines
                if line.get("service_id")
            }
        )
        services_by_id: dict[str, dict] = {}
        if service_ids:
            services_response = (
                supabase.table("services")
                .select("id, pricing_type")
                .in_("id", service_ids)
                .execute()
            )
            services_by_id = {
                row["id"]: row for row in (services_response.data or [])
            }

        employees_response = (
            supabase.table("employees").select("id, first_name, last_name").execute()
        )
        employee_names = {
            row["id"]: f"{row.get('first_name', '')} {row.get('last_name', '')}".strip()
            for row in (employees_response.data or [])
        }

        grouped: dict[str, dict] = {}
        for line in service_lines:
            employee_id = line.get("employee_id")
            key = employee_id or "__shop__"
            if key not in grouped:
                grouped[key] = {"hours": 0.0, "breakdown": []}

            pricing_type = resolve_service_pricing_type(line, services_by_id)
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

        users = [user for user in (response.data or []) if not user.get("is_admin")]
        enriched = []
        for user in users:
            flags = _get_auth_confirmation_flags(user["id"])
            enriched.append({**user, **flags})
        return enriched
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/users")
async def create_user(payload: UserCreate):
    """Create a rider account without sending an invite."""
    try:
        normalized_phone = resolve_optional_phone(payload.phone_number)
        email = payload.email

        user_metadata = {
            key: value
            for key, value in {
                "first_name": payload.first_name,
                "last_name": payload.last_name,
                "phone_number": normalized_phone,
            }.items()
            if value is not None
        }

        create_attrs: dict = {}
        if user_metadata:
            create_attrs["user_metadata"] = user_metadata
        if email:
            create_attrs["email"] = email
            create_attrs["email_confirm"] = False
        if normalized_phone:
            create_attrs["phone"] = normalized_phone

        try:
            created_response = supabase.auth.admin.create_user(create_attrs)
        except Exception as create_error:
            message = str(create_error)
            if "already" in message.lower() and "registered" in message.lower():
                raise HTTPException(
                    status_code=409,
                    detail="A user with that email or phone already exists.",
                )
            raise HTTPException(status_code=400, detail=message)

        created_user = getattr(created_response, "user", None)
        if created_user is None or not getattr(created_user, "id", None):
            raise HTTPException(status_code=400, detail="Failed to create user.")

        profile_payload = {
            "id": created_user.id,
            "email": email,
            "first_name": payload.first_name,
            "last_name": payload.last_name,
            "phone_number": normalized_phone,
        }

        upserted = (
            supabase.table("users").upsert(profile_payload, on_conflict="id").execute()
        )
        upserted_rows = upserted.data or []
        row = upserted_rows[0] if upserted_rows else profile_payload
        return {**row, **_get_auth_confirmation_flags(created_user.id)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/users/{user_id}")
async def update_user(user_id: str, payload: UserUpdate):
    try:
        existing = (
            supabase.table("users")
            .select("id, email, phone_number, is_admin")
            .eq("id", user_id)
            .execute()
        )
        existing_rows = existing.data or []
        if not existing_rows:
            raise HTTPException(status_code=404, detail="User not found")
        existing_row = existing_rows[0]
        if existing_row.get("is_admin"):
            raise HTTPException(
                status_code=403, detail="Admin accounts cannot be edited here."
            )

        existing_email = existing_row.get("email")
        if "email" in payload.model_fields_set:
            next_email = payload.email
            if existing_email and next_email != existing_email:
                raise HTTPException(
                    status_code=400,
                    detail="Email cannot be changed once set. Contact support if correction is needed.",
                )
        else:
            next_email = existing_email

        next_phone = resolve_optional_phone(payload.phone_number)

        _require_user_contact(next_email, next_phone)

        update_payload = {
            "first_name": payload.first_name,
            "last_name": payload.last_name,
            "phone_number": next_phone,
        }
        if "email" in payload.model_fields_set:
            update_payload["email"] = next_email

        updated = (
            supabase.table("users").update(update_payload).eq("id", user_id).execute()
        )
        updated_rows = updated.data or []
        if not updated_rows:
            raise HTTPException(status_code=404, detail="User not found")

        if payload.phone_number is not None:
            _sync_auth_phone(user_id, next_phone)

        if (
            "email" in payload.model_fields_set
            and next_email
            and next_email != existing_email
        ):
            try:
                _sync_auth_email(user_id, next_email)
            except Exception as auth_error:
                message = str(auth_error)
                if "already" in message.lower() and "registered" in message.lower():
                    raise HTTPException(
                        status_code=409,
                        detail="A user with that email already exists.",
                    )
                raise HTTPException(status_code=400, detail=message)

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
        normalized_phone = resolve_optional_phone(payload.phone_number)

        user_metadata = {
            key: value
            for key, value in {
                "first_name": payload.first_name,
                "last_name": payload.last_name,
                "phone_number": normalized_phone,
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
            "phone_number": normalized_phone,
        }

        upserted = (
            supabase.table("users").upsert(profile_payload, on_conflict="id").execute()
        )
        upserted_rows = upserted.data or []

        if normalized_phone:
            _sync_auth_phone(invited_user.id, normalized_phone)

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


@router.post("/users/{user_id}/invite")
async def send_user_invite(user_id: str, payload: UserSendInvite):
    try:
        user_row = _fetch_rider_user_row(user_id)
        try:
            invite_email = resolve_invite_email(user_row)
        except ValueError as contact_error:
            raise HTTPException(status_code=400, detail=str(contact_error))

        user_metadata = _user_metadata_from_row(user_row)
        site_url = _resolve_invite_redirect_base(payload.redirect_base_url)
        redirect_to = f"{site_url}/accept-invite"
        display_label = invite_link_label(user_row)

        if payload.channel == "link":
            _ensure_auth_invite_email(user_id, invite_email, user_row)
            action_link = _mint_accept_invite_link(
                invite_email, user_metadata, payload.redirect_base_url
            )
            return {
                "email": display_label,
                "action_link": action_link,
                "message": "Invite link generated.",
            }

        real_email = (user_row.get("email") or "").strip()
        if not real_email:
            raise HTTPException(
                status_code=400,
                detail="User has no email address. Add an email before sending an email invite.",
            )

        try:
            invite_options = {"redirect_to": redirect_to}
            if user_metadata:
                invite_options["data"] = user_metadata
            supabase.auth.admin.invite_user_by_email(real_email, invite_options)
        except Exception as invite_error:
            raise HTTPException(status_code=400, detail=str(invite_error))

        return {
            "email": real_email,
            "message": f"Invitation email sent to {real_email}.",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/users/{user_id}/resend-invite")
async def resend_invite(user_id: str, payload: UserResendInvite):
    """Backward-compatible alias for generating an invite link."""
    result = await send_user_invite(
        user_id,
        UserSendInvite(channel="link", redirect_base_url=payload.redirect_base_url),
    )
    return {
        **result,
        "message": "Fresh invite link generated.",
    }


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


def _fetch_invoice_users_by_id(owner_ids: list[str]) -> dict:
    if not owner_ids:
        return {}
    users_response = (
        supabase.table("users")
        .select("id, email, first_name, last_name, phone_number")
        .in_("id", owner_ids)
        .execute()
    )
    return {user["id"]: user for user in (users_response.data or [])}


def _fetch_invoice_bikes_by_id(bike_ids: list[str]) -> dict:
    if not bike_ids:
        return {}
    bikes_response = (
        supabase.table("bikes")
        .select("id, owner_id, year, make, model, vin, license_plate")
        .in_("id", bike_ids)
        .execute()
    )
    return {bike["id"]: bike for bike in (bikes_response.data or [])}


def _line_item_subtotal(line_item: dict) -> float:
    return float(line_item.get("unit_price") or 0) * float(line_item.get("quantity") or 0)


def _summarize_line_items(line_items: list[dict]) -> dict:
    return {
        "line_item_count": len(line_items),
        "invoice_subtotal": sum(_line_item_subtotal(item) for item in line_items),
    }


def _compute_line_item_summaries(invoice_ids: list[str]) -> dict[str, dict]:
    if not invoice_ids:
        return {}

    line_items_response = (
        supabase.table("invoice_line_items")
        .select("invoice_id, unit_price, quantity")
        .in_("invoice_id", invoice_ids)
        .execute()
    )

    summaries: dict[str, dict] = {}
    for item in line_items_response.data or []:
        invoice_id = item.get("invoice_id")
        if not invoice_id:
            continue
        entry = summaries.setdefault(
            invoice_id,
            {"line_item_count": 0, "invoice_subtotal": 0.0},
        )
        entry["line_item_count"] += 1
        entry["invoice_subtotal"] += _line_item_subtotal(item)

    return summaries


def _fetch_line_items_by_invoice(invoice_ids: list[str]) -> dict[str, list[dict]]:
    if not invoice_ids:
        return {}

    line_items_response = (
        supabase.table("invoice_line_items")
        .select("*")
        .in_("invoice_id", invoice_ids)
        .order("created_at", desc=False)
        .execute()
    )

    line_items_by_invoice: dict[str, list[dict]] = {}
    for item in line_items_response.data or []:
        invoice_id = item.get("invoice_id")
        if not invoice_id:
            continue
        line_items_by_invoice.setdefault(invoice_id, []).append(item)

    return line_items_by_invoice


def _hydrate_invoice(
    invoice: dict,
    users_by_id: dict,
    bikes_by_id: dict,
    line_items: list[dict],
) -> dict:
    summary = _summarize_line_items(line_items)
    return {
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
        "line_items": line_items,
        **summary,
    }


def _hydrate_invoice_list(
    invoices: list[dict],
    include_line_items: bool,
) -> list[dict]:
    if not invoices:
        return []

    invoice_ids = [invoice["id"] for invoice in invoices]
    owner_ids = list(
        {invoice["owner_id"] for invoice in invoices if invoice.get("owner_id")}
    )
    bike_ids = list(
        {invoice["bike_id"] for invoice in invoices if invoice.get("bike_id")}
    )

    users_by_id = _fetch_invoice_users_by_id(owner_ids)
    bikes_by_id = _fetch_invoice_bikes_by_id(bike_ids)

    if include_line_items:
        line_items_by_invoice = _fetch_line_items_by_invoice(invoice_ids)
        return [
            _hydrate_invoice(
                invoice,
                users_by_id,
                bikes_by_id,
                line_items_by_invoice.get(invoice["id"], []),
            )
            for invoice in invoices
        ]

    summaries = _compute_line_item_summaries(invoice_ids)
    hydrated_invoices = []
    for invoice in invoices:
        summary = summaries.get(
            invoice["id"],
            {"line_item_count": 0, "invoice_subtotal": 0.0},
        )
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
                "line_items": [],
                **summary,
            }
        )

    return hydrated_invoices


VALID_INVOICE_STATUSES = {
    "draft",
    "estimate",
    "in_progress",
    "completed",
    "paid",
    "void",
}


@router.get("/invoices")
async def list_invoices(
    include_line_items: bool = Query(True),
    status: list[str] | None = Query(None),
):
    try:
        invoices_query = supabase.table("invoices").select("*")
        if status:
            filtered_statuses = [
                value for value in status if value in VALID_INVOICE_STATUSES
            ]
            if filtered_statuses:
                invoices_query = invoices_query.in_("status", filtered_statuses)
        invoices_response = invoices_query.order("created_at", desc=True).execute()
        invoices = invoices_response.data or []
        return _hydrate_invoice_list(invoices, include_line_items)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/invoices/{invoice_id}")
async def get_invoice(invoice_id: str):
    try:
        invoice_response = (
            supabase.table("invoices").select("*").eq("id", invoice_id).execute()
        )
        invoice_rows = invoice_response.data or []
        if not invoice_rows:
            raise HTTPException(status_code=404, detail="Invoice not found")

        hydrated = _hydrate_invoice_list([invoice_rows[0]], include_line_items=True)
        return hydrated[0]
    except HTTPException:
        raise
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


def _normalize_caption(value: str | None) -> str | None:
    normalized = (value or "").strip()
    return normalized or None


@router.post("/invoices/{invoice_id}/photos")
async def upload_invoice_photos(
    invoice_id: str,
    files: list[UploadFile] = File(...),
    caption: str | None = Form(None),
    captions: list[str] | None = Form(None),
    admin=Depends(verify_admin),
):
    try:
        invoice_response = (
            supabase.table("invoices").select("id").eq("id", invoice_id).execute()
        )
        if not (invoice_response.data or []):
            raise HTTPException(status_code=404, detail="Invoice not found")

        fallback_caption = _normalize_caption(caption)
        per_file_captions = [
            _normalize_caption(value) for value in (captions or [])
        ]
        created_rows: list[dict] = []

        for index, upload in enumerate(files):
            photo_caption = (
                per_file_captions[index]
                if index < len(per_file_captions)
                else fallback_caption
            )

            content_type = upload.content_type or "application/octet-stream"
            if not content_type.startswith(ALLOWED_PHOTO_MIME_PREFIX):
                raise HTTPException(
                    status_code=400,
                    detail=f"{upload.filename or 'File'} is not an image.",
                )

            data = await upload.read()
            if not data:
                raise HTTPException(
                    status_code=400,
                    detail=f"{upload.filename or 'File'} is empty.",
                )
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
                        "caption": photo_caption,
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


@router.patch("/invoices/{invoice_id}/photos/{photo_id}")
async def update_invoice_photo_caption(
    invoice_id: str,
    photo_id: str,
    payload: InvoicePhotoCaptionUpdate,
    admin=Depends(verify_admin),
):
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

        update_response = (
            supabase.table("invoice_photos")
            .update({"caption": payload.caption})
            .eq("id", photo_id)
            .eq("invoice_id", invoice_id)
            .execute()
        )
        updated_rows = update_response.data or []
        if not updated_rows:
            raise HTTPException(status_code=404, detail="Photo not found")

        return attach_signed_urls(updated_rows)[0]
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
