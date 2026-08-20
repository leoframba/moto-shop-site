import uuid
from unittest.mock import MagicMock, patch


class TestCategoryRoutes:
    def test_delete_category_with_path_id_only(
        self,
        client,
        mock_supabase,
        admin_user,
    ):
        """DELETE must work with only the path param (no JSON body)."""
        mock_supabase.auth.get_user.return_value = type(
            "Response",
            (),
            {"user": admin_user},
        )()

        category_id = str(uuid.uuid4())
        delete_result = MagicMock()
        delete_result.data = [{"id": category_id, "name": "Diagnostics"}]

        mock_table = MagicMock()
        mock_table.delete.return_value.eq.return_value.execute.return_value = (
            delete_result
        )

        with patch("routers.admin.supabase") as mock_admin_supabase:
            mock_admin_supabase.table.return_value = mock_table

            response = client.delete(
                f"/api/admin/categories/{category_id}",
                headers={"Authorization": "Bearer admin-token"},
            )

        assert response.status_code == 200
        mock_table.delete.return_value.eq.assert_called_once_with("id", category_id)

    def test_update_category_uses_path_id(
        self,
        client,
        mock_supabase,
        admin_user,
    ):
        mock_supabase.auth.get_user.return_value = type(
            "Response",
            (),
            {"user": admin_user},
        )()

        category_id = str(uuid.uuid4())
        update_result = MagicMock()
        update_result.data = [{"id": category_id, "name": "Updated"}]

        mock_table = MagicMock()
        mock_table.update.return_value.eq.return_value.execute.return_value = (
            update_result
        )

        with patch("routers.admin.supabase") as mock_admin_supabase:
            mock_admin_supabase.table.return_value = mock_table

            response = client.patch(
                f"/api/admin/categories/{category_id}",
                json={"name": "Updated", "id": category_id},
                headers={"Authorization": "Bearer admin-token"},
            )

        assert response.status_code == 200
        eq_call = mock_table.update.return_value.eq.call_args
        assert eq_call is not None
        assert eq_call.args[0] == "id"
        assert str(eq_call.args[1]) == category_id

    def test_update_category_rejects_id_mismatch(
        self,
        client,
        mock_supabase,
        admin_user,
    ):
        mock_supabase.auth.get_user.return_value = type(
            "Response",
            (),
            {"user": admin_user},
        )()

        category_id = str(uuid.uuid4())
        other_id = str(uuid.uuid4())

        response = client.patch(
            f"/api/admin/categories/{category_id}",
            json={"name": "Updated", "id": other_id},
            headers={"Authorization": "Bearer admin-token"},
        )

        assert response.status_code == 400
        assert response.json()["detail"] == "Category id mismatch"
