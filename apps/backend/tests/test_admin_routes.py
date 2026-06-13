from unittest.mock import MagicMock, patch



class TestAdminRoutes:
    def test_create_category_requires_bearer_token(self, client):
        response = client.post(
            "/api/admin/categories",
            json={"name": "Diagnostics"},
        )

        assert response.status_code == 401

    def test_create_category_rejects_customer_token(
        self,
        client,
        mock_supabase,
        customer_user,
    ):
        mock_supabase.auth.get_user.return_value = type(
            "Response",
            (),
            {"user": customer_user},
        )()

        response = client.post(
            "/api/admin/categories",
            json={"name": "Diagnostics"},
            headers={"Authorization": "Bearer customer-token"},
        )

        assert response.status_code == 403
        assert response.json()["detail"] == "Admin access required"

    def test_create_category_accepts_admin_token(
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

        insert_result = MagicMock()
        insert_result.data = [{"id": "cat-1", "name": "Diagnostics"}]

        mock_table = MagicMock()
        mock_table.insert.return_value.execute.return_value = insert_result

        with patch("routers.admin.supabase") as mock_admin_supabase:
            mock_admin_supabase.table.return_value = mock_table

            response = client.post(
                "/api/admin/categories",
                json={"name": "Diagnostics"},
                headers={"Authorization": "Bearer admin-token"},
            )

        assert response.status_code == 200
        assert response.json()["name"] == "Diagnostics"

    def test_delete_service_requires_admin(self, client, mock_supabase, customer_user):
        mock_supabase.auth.get_user.return_value = type(
            "Response",
            (),
            {"user": customer_user},
        )()

        response = client.delete(
            "/api/admin/services/service-1",
            headers={"Authorization": "Bearer customer-token"},
        )

        assert response.status_code == 403
