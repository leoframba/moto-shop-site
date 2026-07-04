from unittest.mock import MagicMock, patch


class TestPublicServicesRoute:
    def test_public_services_exclude_internal_and_hidden(self, client):
        settings_result = MagicMock()
        settings_result.data = [{"hourly_rate": 100.0}]

        services_result = MagicMock()
        services_result.data = [
            {
                "id": "svc-public",
                "name": "Oil Change",
                "description": "Visible",
                "category_id": "cat-1",
                "categories": {"id": "cat-1", "name": "Maintenance"},
                "pricing_type": "fixed",
                "fixed_price": 50.0,
                "is_hidden": False,
                "is_internal": False,
            },
            {
                "id": "svc-hidden",
                "name": "Draft Service",
                "description": "Hidden",
                "category_id": "cat-2",
                "categories": {"id": "cat-2", "name": "Draft"},
                "pricing_type": "fixed",
                "fixed_price": 25.0,
                "is_hidden": True,
                "is_internal": False,
            },
            {
                "id": "svc-internal",
                "name": "Frame Weld",
                "description": "Invoice only",
                "category_id": "cat-3",
                "categories": {"id": "cat-3", "name": "Shop Labor"},
                "pricing_type": "hourly",
                "estimated_hours": 2.0,
                "is_hidden": False,
                "is_internal": True,
            },
        ]

        categories_result = MagicMock()
        categories_result.data = [
            {"id": "cat-1", "name": "Maintenance"},
            {"id": "cat-2", "name": "Draft"},
            {"id": "cat-3", "name": "Shop Labor"},
        ]

        def table_side_effect(name):
            mock_table = MagicMock()
            if name == "shop_settings":
                mock_table.select.return_value.eq.return_value.execute.return_value = (
                    settings_result
                )
            elif name == "services":
                mock_table.select.return_value.execute.return_value = services_result
            elif name == "categories":
                mock_table.select.return_value.execute.return_value = categories_result
            return mock_table

        with patch("routers.public.supabase") as mock_public_supabase:
            mock_public_supabase.table.side_effect = table_side_effect

            response = client.get("/api/services")

        assert response.status_code == 200
        payload = response.json()
        assert len(payload["services"]) == 1
        assert payload["services"][0]["id"] == "svc-public"
        assert "is_hidden" not in payload["services"][0]
        assert "is_internal" not in payload["services"][0]
        assert len(payload["categories"]) == 1
        assert payload["categories"][0]["id"] == "cat-1"

    def test_public_services_tolerates_null_hourly_rate(self, client):
        settings_result = MagicMock()
        settings_result.data = [{"hourly_rate": None}]

        services_result = MagicMock()
        services_result.data = []
        categories_result = MagicMock()
        categories_result.data = []

        def table_side_effect(name):
            mock_table = MagicMock()
            if name == "shop_settings":
                mock_table.select.return_value.eq.return_value.execute.return_value = (
                    settings_result
                )
            elif name == "services":
                mock_table.select.return_value.execute.return_value = services_result
            elif name == "categories":
                mock_table.select.return_value.execute.return_value = categories_result
            return mock_table

        with patch("routers.public.supabase") as mock_public_supabase:
            mock_public_supabase.table.side_effect = table_side_effect

            response = client.get("/api/services")

        assert response.status_code == 200
        assert response.json()["hourly_rate"] == 0.0
