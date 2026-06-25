from invite_utils import (
    invite_link_label,
    is_placeholder_invite_email,
    placeholder_invite_email,
    resolve_invite_email,
)


def test_resolve_invite_email_prefers_real_email():
    assert (
        resolve_invite_email(
            {
                "id": "user-1",
                "email": "Rider@Example.com",
                "phone_number": "+15551234567",
            }
        )
        == "rider@example.com"
    )


def test_resolve_invite_email_uses_placeholder_for_phone_only():
    user_id = "550e8400-e29b-41d4-a716-446655440000"
    assert resolve_invite_email(
        {
            "id": user_id,
            "email": None,
            "phone_number": "+15551234567",
        }
    ) == placeholder_invite_email(user_id)


def test_resolve_invite_email_requires_contact():
    try:
        resolve_invite_email({"id": "user-1", "email": None, "phone_number": None})
        assert False, "expected ValueError"
    except ValueError as error:
        assert "no email or phone" in str(error).lower()


def test_is_placeholder_invite_email():
    user_id = "550e8400-e29b-41d4-a716-446655440000"
    assert is_placeholder_invite_email(placeholder_invite_email(user_id))
    assert not is_placeholder_invite_email("rider@example.com")


def test_invite_link_label():
    assert (
        invite_link_label(
            {
                "email": "rider@example.com",
                "phone_number": "+15551234567",
            }
        )
        == "rider@example.com"
    )
    assert (
        invite_link_label(
            {
                "email": None,
                "phone_number": "+15551234567",
            }
        )
        == "+15551234567"
    )
