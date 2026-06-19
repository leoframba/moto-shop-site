from unittest.mock import MagicMock, patch


class TestPortalRoutes:
    def _auth_customer(self, mock_supabase, customer_user):
        mock_supabase.auth.get_user.return_value = type(
            "Response",
            (),
            {"user": customer_user},
        )()
        customer_user.id = "rider-1"

    def test_garage_strips_in_progress_invoice_details(
        self,
        client,
        mock_supabase,
        customer_user,
    ):
        self._auth_customer(mock_supabase, customer_user)

        settings_result = MagicMock()
        settings_result.data = [{"tax_rate": 8.25}]

        bikes_result = MagicMock()
        bikes_result.data = []

        invoices_result = MagicMock()
        invoices_result.data = [
            {
                "id": "inv-1",
                "invoice_number": 42,
                "status": "in_progress",
                "owner_id": "rider-1",
                "bike_id": None,
                "created_at": "2026-01-01T00:00:00Z",
                "mechanic_notes": "secret",
            }
        ]

        line_items_result = MagicMock()
        line_items_result.data = [
            {
                "id": "line-1",
                "invoice_id": "inv-1",
                "snapshot_name": "Labor",
            }
        ]

        def table_factory(name):
            mock_table = MagicMock()
            if name == "shop_settings":
                mock_table.select.return_value.eq.return_value.execute.return_value = (
                    settings_result
                )
            elif name == "bikes":
                mock_table.select.return_value.eq.return_value.order.return_value.execute.return_value = bikes_result
            elif name == "invoices":
                mock_table.select.return_value.eq.return_value.in_.return_value.order.return_value.execute.return_value = invoices_result
            elif name == "invoice_line_items":
                mock_table.select.return_value.in_.return_value.order.return_value.execute.return_value = line_items_result
            return mock_table

        with patch("routers.portal.supabase") as mock_portal_supabase:
            mock_portal_supabase.table.side_effect = table_factory

            response = client.get(
                "/api/portal/garage",
                headers={"Authorization": "Bearer customer-token"},
            )

        assert response.status_code == 200
        invoice = response.json()["invoices"][0]
        assert invoice["customer_view_level"] == "summary"
        assert invoice["line_items"] == []
        assert "mechanic_notes" not in invoice

    def test_print_rejects_estimate_invoice(
        self,
        client,
        mock_supabase,
        customer_user,
    ):
        self._auth_customer(mock_supabase, customer_user)

        invoice_result = MagicMock()
        invoice_result.data = [
            {
                "id": "inv-1",
                "invoice_number": 42,
                "status": "estimate",
                "owner_id": "rider-1",
            }
        ]

        mock_table = MagicMock()
        mock_table.select.return_value.eq.return_value.eq.return_value.in_.return_value.execute.return_value = invoice_result

        with patch("routers.portal.supabase") as mock_portal_supabase:
            mock_portal_supabase.table.return_value = mock_table

            response = client.get(
                "/api/portal/invoices/inv-1/print",
                headers={"Authorization": "Bearer customer-token"},
            )

        assert response.status_code == 403

    def test_photos_rejects_in_progress_invoice(
        self,
        client,
        mock_supabase,
        customer_user,
    ):
        self._auth_customer(mock_supabase, customer_user)

        invoice_result = MagicMock()
        invoice_result.data = [
            {
                "id": "inv-1",
                "status": "in_progress",
                "owner_id": "rider-1",
            }
        ]

        mock_table = MagicMock()
        mock_table.select.return_value.eq.return_value.eq.return_value.in_.return_value.execute.return_value = invoice_result

        with patch("routers.portal.supabase") as mock_portal_supabase:
            mock_portal_supabase.table.return_value = mock_table

            response = client.get(
                "/api/portal/invoices/inv-1/photos",
                headers={"Authorization": "Bearer customer-token"},
            )

        assert response.status_code == 404
