import { describe, expect, it } from "vitest";
import type { InvoiceWithRelations } from "@/types";
import { mergeInvoicesById } from "./invoiceHelpers";

const invoice = (
	overrides: Partial<InvoiceWithRelations> = {},
): InvoiceWithRelations => ({
	id: "inv-1",
	invoice_number: 1001,
	status: "completed",
	owner_id: null,
	bike_id: null,
	mechanic_notes: null,
	line_items: [],
	line_item_count: 0,
	invoice_subtotal: 0,
	created_at: "2026-01-01T00:00:00Z",
	...overrides,
});

describe("mergeInvoicesById", () => {
	it("preserves loaded line items when merging a summary-only fetch", () => {
		const loaded = invoice({
			line_item_count: 2,
			invoice_subtotal: 150,
			line_items: [
				{
					id: "line-1",
					invoice_id: "inv-1",
					item_type: "service",
					service_id: "svc-1",
					part_id: null,
					employee_id: null,
					snapshot_name: "Oil Change",
					snapshot_part_number: null,
					is_custom: false,
					pricing_type: "fixed",
					unit_price: 75,
					quantity: 2,
					created_at: "2026-01-01T00:00:00Z",
				},
			],
		});
		const summaryOnly = invoice({
			status: "paid",
			line_item_count: 2,
			invoice_subtotal: 150,
			line_items: [],
		});

		const merged = mergeInvoicesById([loaded], [summaryOnly]);

		expect(merged).toHaveLength(1);
		expect(merged[0].status).toBe("paid");
		expect(merged[0].line_items).toEqual(loaded.line_items);
	});

	it("replaces line items when the incoming payload includes them", () => {
		const existing = invoice({
			line_items: [
				{
					id: "line-old",
					invoice_id: "inv-1",
					item_type: "part",
					service_id: null,
					part_id: "part-1",
					employee_id: null,
					snapshot_name: "Old Part",
					snapshot_part_number: "OLD",
					is_custom: false,
					pricing_type: null,
					unit_price: 10,
					quantity: 1,
					created_at: "2026-01-01T00:00:00Z",
				},
			],
		});
		const incoming = invoice({
			line_items: [
				{
					id: "line-new",
					invoice_id: "inv-1",
					item_type: "part",
					service_id: null,
					part_id: "part-2",
					employee_id: null,
					snapshot_name: "New Part",
					snapshot_part_number: "NEW",
					is_custom: false,
					pricing_type: null,
					unit_price: 20,
					quantity: 1,
					created_at: "2026-01-02T00:00:00Z",
				},
			],
		});

		const merged = mergeInvoicesById([existing], [incoming]);

		expect(merged[0].line_items).toEqual(incoming.line_items);
	});
});
