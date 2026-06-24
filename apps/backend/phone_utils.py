import re

from fastapi import HTTPException


def normalize_phone_to_e164(value: str | None) -> str | None:
    """Normalize a US phone string to E.164 (+1XXXXXXXXXX or +1XXXXXXXXXXX)."""
    if not value or not value.strip():
        return None

    digits_only = re.sub(r"\D", "", value)
    if len(digits_only) == 10:
        return f"+1{digits_only}"
    if len(digits_only) == 11:
        return f"+{digits_only}"
    return None


def resolve_optional_phone(value: str | None) -> str | None:
    """Return E.164 phone or None; raise 400 when a value is present but invalid."""
    if value is None or not value.strip():
        return None

    normalized = normalize_phone_to_e164(value)
    if normalized is None:
        raise HTTPException(
            status_code=400,
            detail="Please provide a valid 10-digit US phone number.",
        )
    return normalized


def sync_auth_phone(supabase_client, user_id: str, phone_number: str | None) -> None:
    """Set Supabase Auth phone so riders can sign in with phone + password."""
    if not phone_number:
        return
    supabase_client.auth.admin.update_user_by_id(
        user_id, {"phone": phone_number, "phone_confirm": True}
    )
