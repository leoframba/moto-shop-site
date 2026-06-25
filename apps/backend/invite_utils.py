"""Helpers for admin invite links (including phone-only riders)."""

INVITE_PLACEHOLDER_EMAIL_DOMAIN = "invite.advcycles.invalid"


def placeholder_invite_email(user_id: str) -> str:
    return f"{user_id}@{INVITE_PLACEHOLDER_EMAIL_DOMAIN}"


def is_placeholder_invite_email(email: str | None) -> bool:
    if not email:
        return False
    return email.strip().lower().endswith(f"@{INVITE_PLACEHOLDER_EMAIL_DOMAIN}")


def resolve_invite_email(user_row: dict) -> str:
    """Email address used with Supabase generate_link (real or internal placeholder)."""
    email = (user_row.get("email") or "").strip().lower()
    if email:
        return email

    phone = (user_row.get("phone_number") or "").strip()
    if phone:
        return placeholder_invite_email(user_row["id"])

    raise ValueError("User has no email or phone on file.")


def invite_link_label(user_row: dict) -> str:
    email = (user_row.get("email") or "").strip()
    if email:
        return email
    phone = (user_row.get("phone_number") or "").strip()
    if phone:
        return phone
    return "rider"
