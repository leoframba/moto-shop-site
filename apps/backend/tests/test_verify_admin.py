import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from dependencies import _is_admin_user, verify_admin


class TestIsAdminUser:
    def test_returns_true_for_admin_role(self, admin_user):
        assert _is_admin_user(admin_user) is True

    def test_returns_false_for_customer(self, customer_user):
        assert _is_admin_user(customer_user) is False

    def test_returns_false_when_app_metadata_missing(self):
        user = type("User", (), {"app_metadata": None})()
        assert _is_admin_user(user) is False


class TestVerifyAdmin:
    async def test_rejects_missing_user(self, mock_supabase):
        mock_supabase.auth.get_user.return_value = type(
            "Response",
            (),
            {"user": None},
        )()

        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials="invalid-token",
        )

        with pytest.raises(HTTPException) as exc_info:
            await verify_admin(credentials)

        assert exc_info.value.status_code == 401

    async def test_rejects_customer_with_403(self, mock_supabase, customer_user):
        mock_supabase.auth.get_user.return_value = type(
            "Response",
            (),
            {"user": customer_user},
        )()

        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials="customer-token",
        )

        with pytest.raises(HTTPException) as exc_info:
            await verify_admin(credentials)

        assert exc_info.value.status_code == 403
        assert exc_info.value.detail == "Admin access required"

    async def test_accepts_admin_user(self, mock_supabase, admin_user):
        mock_supabase.auth.get_user.return_value = type(
            "Response",
            (),
            {"user": admin_user},
        )()

        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials="admin-token",
        )

        result = await verify_admin(credentials)
        assert result is admin_user

    async def test_rejects_on_supabase_error(self, mock_supabase):
        mock_supabase.auth.get_user.side_effect = Exception("network error")

        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials="bad-token",
        )

        with pytest.raises(HTTPException) as exc_info:
            await verify_admin(credentials)

        assert exc_info.value.status_code == 401
