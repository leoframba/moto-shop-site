import { describe, expect, it } from "vitest";
import type { InvoiceLineItemRecord } from "@/types";
import {
	buildInvoicePrintHtml,
	estimateLineItemRowWeight,
	getDynamicSummaryPinRows,
	getFirstPageLineItemRowBudget,
	getMaxFirstPageNoteLineCapacity,
	SUMMARY_PIN_ROWS_TOTALS_ONLY,
	splitLineItemRows,
	splitNotesForFirstPage,
	sumLineItemRowWeights,
} from "./buildInvoicePrintHtml";

const partLine = (
	overrides: Partial<InvoiceLineItemRecord> = {},
): InvoiceLineItemRecord => ({
	id: "line-1",
	invoice_id: "inv-1",
	item_type: "part",
	part_id: "part-1",
	service_id: null,
	employee_id: null,
	snapshot_name: "Oil Filter",
	snapshot_part_number: "OF-123",
	is_custom: false,
	pricing_type: null,
	unit_price: 12,
	quantity: 1,
	created_at: "2026-01-01T00:00:00Z",
	...overrides,
});

const shopSettings = {
	id: 1,
	shop_name: "Moto Shop",
	shop_address: null,
	shop_phone: null,
	shop_email: null,
	bar_number: null,
	hourly_rate: 0,
	tax_rate: 8.25,
	hazardous_waste_rate: 0,
	pay_period_length: "bi-weekly" as const,
	anchor_date: "2026-06-17",
	timezone: "America/Los_Angeles",
	invoice_list_default_statuses: ["draft", "completed"] as const,
};

describe("buildInvoicePrintHtml layout helpers", () => {
	it("weights long part descriptions more than one row", () => {
		const short = estimateLineItemRowWeight(partLine());
		const long = estimateLineItemRowWeight(
			partLine({
				snapshot_name:
					"Premium synthetic motorcycle engine oil filter with extended life media",
				snapshot_part_number: "OF-123456789-EXTRA-LONG",
			}),
		);
		expect(long).toBeGreaterThan(short);
	});

	it("splits line items when weighted rows exceed the page-one budget", () => {
		const rows = Array.from({ length: 30 }, (_, index) => ({
			html: `<tr><td>${index}</td></tr>`,
			weight: 2,
		}));
		const budget = 20;
		const { firstPage, continuation } = splitLineItemRows(rows, budget);

		expect(sumLineItemRowWeights(firstPage)).toBeLessThanOrEqual(budget);
		expect(continuation.length).toBeGreaterThan(0);
		expect(firstPage.length + continuation.length).toBe(rows.length);
	});

	it("uses a compact summary pin for short first-page notes", () => {
		expect(getDynamicSummaryPinRows(0)).toBe(SUMMARY_PIN_ROWS_TOTALS_ONLY);
		expect(getDynamicSummaryPinRows(2)).toBe(SUMMARY_PIN_ROWS_TOTALS_ONLY);
		expect(getDynamicSummaryPinRows(20)).toBeGreaterThan(
			SUMMARY_PIN_ROWS_TOTALS_ONLY,
		);
		expect(
			getFirstPageLineItemRowBudget(
				true,
				2,
				getDynamicSummaryPinRows(2),
			),
		).toBeGreaterThan(
			getFirstPageLineItemRowBudget(
				true,
				2,
				getDynamicSummaryPinRows(20),
			),
		);
	});

	it("fits first-page notes beside totals inside the summary pin", () => {
		expect(getMaxFirstPageNoteLineCapacity()).toBeGreaterThan(0);
	});

	it("moves overflow mechanic notes to the continuation chunk", () => {
		const notes = Array.from({ length: 40 }, (_, index) => `Note line ${index}`)
			.join("\n");
		const { firstPage, continuation } = splitNotesForFirstPage(notes, 80, 6);

		expect(firstPage.length).toBeGreaterThan(0);
		expect(continuation.length).toBeGreaterThan(0);
		expect(`${firstPage}\n${continuation}`.trim()).toBe(notes);
	});

	it("right-aligns totals when no first-page notes are present", () => {
		const html = buildInvoicePrintHtml(
			{
				id: "inv-1",
				invoice_number: 1001,
				status: "completed",
				owner_id: null,
				bike_id: null,
				mechanic_notes: "",
				line_items: [partLine()],
				created_at: "2026-01-01T00:00:00Z",
			},
			shopSettings,
		);

		expect(html).toContain('summary-pin--totals-only');
		expect(html).not.toContain('class="notes-column"');
	});

	it("pins the grand total markup on page one", () => {
		const parts = Array.from({ length: 25 }, (_, index) =>
			partLine({
				id: `line-${index}`,
				snapshot_name: `Part number ${index} with a longer printed description`,
				snapshot_part_number: `PN-${index}`,
			}),
		);

		const html = buildInvoicePrintHtml(
			{
				id: "inv-1",
				invoice_number: 1001,
				status: "completed",
				owner_id: null,
				bike_id: null,
				mechanic_notes: Array.from(
					{ length: 30 },
					(_, index) => `Mechanic note line ${index}`,
				).join("\n"),
				line_items: parts,
				created_at: "2026-01-01T00:00:00Z",
			},
			shopSettings,
		);

		expect(html).toContain('class="summary-pin summary-pin--with-notes"');
		expect(html).toContain('class="notes-column"');
		expect(html).toContain("Total Due");
		expect(html).toContain("invoice-continuation");
		expect(html).toContain("Mechanic Notes (continued)");
	});
});
