from portal_invoice_view import serialize_customer_invoice


class TestPortalInvoiceView:
    def test_in_progress_returns_summary_only(self):
        result = serialize_customer_invoice(
            {
                "id": "inv-1",
                "invoice_number": 100,
                "status": "in_progress",
                "created_at": "2026-01-01T00:00:00Z",
                "bike_id": "bike-1",
                "owner_id": "user-1",
                "mechanic_notes": "secret",
                "odometer_in": 1200,
            },
            bike={"id": "bike-1", "year": 2020, "make": "Yamaha", "model": "MT-09"},
            line_items=[{"id": "line-1", "snapshot_name": "Oil change"}],
        )

        assert result["customer_view_level"] == "summary"
        assert result["line_items"] == []
        assert "mechanic_notes" not in result
        assert "odometer_in" not in result

    def test_estimate_includes_line_items_without_notes(self):
        result = serialize_customer_invoice(
            {
                "id": "inv-2",
                "invoice_number": 101,
                "status": "estimate",
                "mechanic_notes": "internal only",
            },
            bike=None,
            line_items=[{"id": "line-1", "snapshot_name": "Brake pads"}],
        )

        assert result["customer_view_level"] == "estimate"
        assert len(result["line_items"]) == 1
        assert result["mechanic_notes"] is None

    def test_completed_includes_notes_and_line_items(self):
        result = serialize_customer_invoice(
            {
                "id": "inv-3",
                "invoice_number": 102,
                "status": "completed",
                "mechanic_notes": "Replaced chain",
            },
            bike=None,
            line_items=[{"id": "line-1"}],
        )

        assert result["customer_view_level"] == "full"
        assert result["mechanic_notes"] == "Replaced chain"
        assert len(result["line_items"]) == 1
