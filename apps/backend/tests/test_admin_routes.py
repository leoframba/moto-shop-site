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

    def test_list_users_filters_out_admin_accounts(
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

        users_result = MagicMock()
        users_result.data = [
            {"id": "user-1", "email": "customer@example.com", "is_admin": False},
            {"id": "user-2", "email": "admin@example.com", "is_admin": True},
        ]

        mock_table = MagicMock()
        mock_table.select.return_value.order.return_value.execute.return_value = (
            users_result
        )

        with patch("routers.admin.supabase") as mock_admin_supabase:
            mock_admin_supabase.table.return_value = mock_table

            response = client.get(
                "/api/admin/users",
                headers={"Authorization": "Bearer admin-token"},
            )

        assert response.status_code == 200
        assert response.json() == [
            {"id": "user-1", "email": "customer@example.com", "is_admin": False}
        ]

    def test_get_shop_settings_returns_row(
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

        settings_result = MagicMock()
        settings_result.data = [{"id": 1, "shop_name": "Moto Shop", "tax_rate": 8.625}]

        settings_table = MagicMock()
        settings_table.select.return_value.eq.return_value.execute.return_value = (
            settings_result
        )

        with patch("routers.admin.supabase") as mock_admin_supabase:
            mock_admin_supabase.table.return_value = settings_table

            response = client.get(
                "/api/admin/shop-settings",
                headers={"Authorization": "Bearer admin-token"},
            )

        assert response.status_code == 200
        assert response.json()["id"] == 1

    def test_update_shop_settings_updates_row(
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

        settings_result = MagicMock()
        settings_result.data = [{"id": 1, "shop_name": "Moto Shop Updated"}]

        settings_table = MagicMock()
        settings_table.update.return_value.eq.return_value.execute.return_value = (
            settings_result
        )

        with patch("routers.admin.supabase") as mock_admin_supabase:
            mock_admin_supabase.table.return_value = settings_table

            response = client.patch(
                "/api/admin/shop-settings",
                json={"shop_name": "Moto Shop Updated"},
                headers={"Authorization": "Bearer admin-token"},
            )

        assert response.status_code == 200
        assert response.json()["shop_name"] == "Moto Shop Updated"

    def test_create_part_accepts_admin_token(
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
        insert_result.data = [
            {
                "id": "part-1",
                "part_number": "CHAIN-001",
                "description": "520 chain",
                "base_price": 139.99,
            }
        ]

        mock_table = MagicMock()
        mock_table.insert.return_value.execute.return_value = insert_result

        with patch("routers.admin.supabase") as mock_admin_supabase:
            mock_admin_supabase.table.return_value = mock_table

            response = client.post(
                "/api/admin/parts",
                json={
                    "part_number": "chain-001",
                    "description": "520 chain",
                    "base_price": 139.99,
                },
                headers={"Authorization": "Bearer admin-token"},
            )

        assert response.status_code == 200
        assert response.json()["part_number"] == "CHAIN-001"
        mock_table.insert.assert_called_once_with(
            {
                "part_number": "CHAIN-001",
                "description": "520 chain",
                "base_price": 139.99,
            }
        )

    def test_create_part_accepts_null_part_number(
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
        insert_result.data = [
            {
                "id": "part-2",
                "part_number": None,
                "description": "Shop rag",
                "base_price": 2.5,
            }
        ]

        mock_table = MagicMock()
        mock_table.insert.return_value.execute.return_value = insert_result

        with patch("routers.admin.supabase") as mock_admin_supabase:
            mock_admin_supabase.table.return_value = mock_table

            response = client.post(
                "/api/admin/parts",
                json={
                    "description": "Shop rag",
                    "base_price": 2.5,
                },
                headers={"Authorization": "Bearer admin-token"},
            )

        assert response.status_code == 200
        assert response.json()["part_number"] is None
        mock_table.insert.assert_called_once_with(
            {
                "part_number": None,
                "description": "Shop rag",
                "base_price": 2.5,
            }
        )

    def test_create_part_rejects_duplicate_description(
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

        mock_table = MagicMock()
        mock_table.insert.return_value.execute.side_effect = Exception(
            'duplicate key value violates unique constraint "parts_description_unique"'
        )

        with patch("routers.admin.supabase") as mock_admin_supabase:
            mock_admin_supabase.table.return_value = mock_table

            response = client.post(
                "/api/admin/parts",
                json={
                    "description": "Shop rag",
                    "base_price": 2.5,
                },
                headers={"Authorization": "Bearer admin-token"},
            )

        assert response.status_code == 409
        assert response.json()["detail"] == (
            "A part with this description already exists."
        )

    def test_update_part_rejects_duplicate_part_number(
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

        mock_table = MagicMock()
        mock_table.update.return_value.eq.return_value.execute.side_effect = Exception(
            'duplicate key value violates unique constraint "parts_part_number_unique"'
        )

        with patch("routers.admin.supabase") as mock_admin_supabase:
            mock_admin_supabase.table.return_value = mock_table

            response = client.patch(
                "/api/admin/parts/part-1",
                json={
                    "part_number": "CHAIN-001",
                    "description": "520 chain",
                    "base_price": 139.99,
                },
                headers={"Authorization": "Bearer admin-token"},
            )

        assert response.status_code == 409
        assert response.json()["detail"] == (
            "A part with this part number already exists."
        )

    def test_create_invoice_creates_header_and_line_items(
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

        invoice_result = MagicMock()
        invoice_result.data = [
            {
                "id": "inv-1",
                "invoice_number": 1001,
                "status": "draft",
            }
        ]
        line_items_result = MagicMock()
        line_items_result.data = [
            {
                "id": "line-1",
                "invoice_id": "inv-1",
                "item_type": "service",
                "service_id": "svc-1",
                "snapshot_name": "Oil Change",
                "unit_price": 125,
                "quantity": 1,
            }
        ]

        invoice_table = MagicMock()
        invoice_table.insert.return_value.execute.return_value = invoice_result

        line_items_table = MagicMock()
        line_items_table.insert.return_value.execute.return_value = line_items_result

        def table_side_effect(name):
            if name == "invoices":
                return invoice_table
            if name == "invoice_line_items":
                return line_items_table
            return MagicMock()

        with patch("routers.admin.supabase") as mock_admin_supabase:
            mock_admin_supabase.table.side_effect = table_side_effect

            response = client.post(
                "/api/admin/invoices",
                json={
                    "owner_id": "owner-1",
                    "bike_id": "bike-1",
                    "odometer_in": 10000,
                    "odometer_out": 10020,
                    "mechanic_notes": "Test note",
                    "line_items": [
                        {
                            "item_type": "service",
                            "service_id": "svc-1",
                            "snapshot_name": "Oil Change",
                            "unit_price": 125,
                            "quantity": 1,
                        }
                    ],
                },
                headers={"Authorization": "Bearer admin-token"},
            )

        assert response.status_code == 200
        assert response.json()["invoice"]["id"] == "inv-1"
        assert len(response.json()["line_items"]) == 1

    def test_update_invoice_replaces_header_and_line_items(
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

        updated_invoice_result = MagicMock()
        updated_invoice_result.data = [
            {
                "id": "inv-1",
                "invoice_number": 1001,
                "status": "draft",
                "mechanic_notes": "Updated note",
            }
        ]
        deleted_line_items_result = MagicMock()
        deleted_line_items_result.data = [{"id": "line-old"}]
        inserted_line_items_result = MagicMock()
        inserted_line_items_result.data = [
            {
                "id": "line-new",
                "invoice_id": "inv-1",
                "item_type": "part",
                "part_id": "part-1",
                "snapshot_name": "Brake Pad",
                "unit_price": 55,
                "quantity": 2,
            }
        ]

        invoices_table = MagicMock()
        invoices_table.update.return_value.eq.return_value.execute.return_value = (
            updated_invoice_result
        )

        line_items_table = MagicMock()
        line_items_table.delete.return_value.eq.return_value.execute.return_value = (
            deleted_line_items_result
        )
        line_items_table.insert.return_value.execute.return_value = (
            inserted_line_items_result
        )

        def table_side_effect(name):
            if name == "invoices":
                return invoices_table
            if name == "invoice_line_items":
                return line_items_table
            return MagicMock()

        with patch("routers.admin.supabase") as mock_admin_supabase:
            mock_admin_supabase.table.side_effect = table_side_effect

            response = client.patch(
                "/api/admin/invoices/inv-1",
                json={
                    "owner_id": "owner-1",
                    "bike_id": "bike-1",
                    "odometer_in": 12345,
                    "odometer_out": 12360,
                    "mechanic_notes": "Updated note",
                    "line_items": [
                        {
                            "item_type": "part",
                            "part_id": "part-1",
                            "snapshot_name": "Brake Pad",
                            "unit_price": 55,
                            "quantity": 2,
                        }
                    ],
                },
                headers={"Authorization": "Bearer admin-token"},
            )

        assert response.status_code == 200
        assert response.json()["invoice"]["id"] == "inv-1"
        assert len(response.json()["line_items"]) == 1

    def test_delete_invoice_removes_invoice_and_line_items(
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

        deleted_line_items_result = MagicMock()
        deleted_line_items_result.data = [{"id": "line-1"}]
        deleted_invoice_result = MagicMock()
        deleted_invoice_result.data = [{"id": "inv-1"}]

        line_items_table = MagicMock()
        line_items_table.delete.return_value.eq.return_value.execute.return_value = (
            deleted_line_items_result
        )

        invoices_table = MagicMock()
        invoices_table.delete.return_value.eq.return_value.execute.return_value = (
            deleted_invoice_result
        )

        def table_side_effect(name):
            if name == "invoice_line_items":
                return line_items_table
            if name == "invoices":
                return invoices_table
            return MagicMock()

        with patch("routers.admin.supabase") as mock_admin_supabase:
            mock_admin_supabase.table.side_effect = table_side_effect

            response = client.delete(
                "/api/admin/invoices/inv-1",
                headers={"Authorization": "Bearer admin-token"},
            )

        assert response.status_code == 200
        assert response.json()["message"] == "Invoice deleted successfully"

    def test_update_invoice_status(
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

        update_result = MagicMock()
        update_result.data = [
            {
                "id": "inv-1",
                "invoice_number": 1001,
                "status": "paid",
            }
        ]

        invoices_table = MagicMock()
        invoices_table.update.return_value.eq.return_value.execute.return_value = (
            update_result
        )

        with patch("routers.admin.supabase") as mock_admin_supabase:
            mock_admin_supabase.table.return_value = invoices_table

            response = client.patch(
                "/api/admin/invoices/inv-1/status",
                json={"status": "paid"},
                headers={"Authorization": "Bearer admin-token"},
            )

        assert response.status_code == 200
        assert response.json()["status"] == "paid"

    def test_update_invoice_mechanic_notes(
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

        update_result = MagicMock()
        update_result.data = [
            {
                "id": "inv-1",
                "invoice_number": 1001,
                "mechanic_notes": "Replaced chain and sprockets.",
            }
        ]

        invoices_table = MagicMock()
        invoices_table.update.return_value.eq.return_value.select.return_value.execute.return_value = update_result

        with patch("routers.admin.supabase") as mock_admin_supabase:
            mock_admin_supabase.table.return_value = invoices_table

            response = client.patch(
                "/api/admin/invoices/inv-1/mechanic-notes",
                json={"mechanic_notes": "Replaced chain and sprockets."},
                headers={"Authorization": "Bearer admin-token"},
            )

        assert response.status_code == 200
        assert response.json()["mechanic_notes"] == "Replaced chain and sprockets."

    def test_summarize_invoice_voice_note(
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

        invoice_result = MagicMock()
        invoice_result.data = [{"id": "inv-1"}]

        invoices_table = MagicMock()
        invoices_table.select.return_value.eq.return_value.execute.return_value = (
            invoice_result
        )

        summary = MagicMock()
        summary.transcript = "Replaced the chain."
        summary.summaryBullets = ["New chain installed", "Adjusted tension"]

        with (
            patch("routers.admin.supabase") as mock_admin_supabase,
            patch(
                "routers.admin.summarize_voice_note",
                return_value=summary,
            ) as mock_summarize,
            patch(
                "routers.admin.format_voice_note_block",
                return_value="--- Voice note ---\n- New chain installed",
            ),
        ):
            mock_admin_supabase.table.return_value = invoices_table

            response = client.post(
                "/api/admin/invoices/inv-1/voice-note",
                json={
                    "audioBase64": "dGVzdA==",
                    "mimeType": "audio/webm",
                },
                headers={"Authorization": "Bearer admin-token"},
            )

        assert response.status_code == 200
        body = response.json()
        assert body["invoiceId"] == "inv-1"
        assert body["transcript"] == "Replaced the chain."
        assert body["summaryBullets"] == [
            "New chain installed",
            "Adjusted tension",
        ]
        mock_summarize.assert_called_once_with("dGVzdA==", "audio/webm")

    def test_list_invoices_returns_hydrated_relations(
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

        invoices_result = MagicMock()
        invoices_result.data = [
            {
                "id": "inv-1",
                "invoice_number": 1001,
                "owner_id": "user-1",
                "bike_id": "bike-1",
                "status": "draft",
            }
        ]

        line_items_result = MagicMock()
        line_items_result.data = [
            {
                "id": "line-1",
                "invoice_id": "inv-1",
                "item_type": "service",
                "snapshot_name": "Oil Change",
                "unit_price": 125,
                "quantity": 1,
            }
        ]

        users_result = MagicMock()
        users_result.data = [
            {
                "id": "user-1",
                "email": "customer@example.com",
                "first_name": "Customer",
                "last_name": "One",
                "phone_number": "555-1212",
            }
        ]

        bikes_result = MagicMock()
        bikes_result.data = [
            {
                "id": "bike-1",
                "owner_id": "user-1",
                "year": 2019,
                "make": "Yamaha",
                "model": "MT-09",
                "vin": "VIN123",
                "license_plate": "ABC123",
            }
        ]

        invoices_table = MagicMock()
        invoices_table.select.return_value.order.return_value.execute.return_value = (
            invoices_result
        )

        line_items_table = MagicMock()
        line_items_table.select.return_value.in_.return_value.order.return_value.execute.return_value = line_items_result

        users_table = MagicMock()
        users_table.select.return_value.in_.return_value.execute.return_value = (
            users_result
        )

        bikes_table = MagicMock()
        bikes_table.select.return_value.in_.return_value.execute.return_value = (
            bikes_result
        )

        def table_side_effect(name):
            if name == "invoices":
                return invoices_table
            if name == "invoice_line_items":
                return line_items_table
            if name == "users":
                return users_table
            if name == "bikes":
                return bikes_table
            return MagicMock()

        with patch("routers.admin.supabase") as mock_admin_supabase:
            mock_admin_supabase.table.side_effect = table_side_effect

            response = client.get(
                "/api/admin/invoices",
                headers={"Authorization": "Bearer admin-token"},
            )

        assert response.status_code == 200
        payload = response.json()
        assert len(payload) == 1
        assert payload[0]["owner"]["id"] == "user-1"
        assert payload[0]["bike"]["id"] == "bike-1"
        assert len(payload[0]["line_items"]) == 1
