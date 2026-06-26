import type {
	InvoiceLineItemRecord,
	InvoiceWithRelations,
	ShopSettings,
} from "@/types";
import {
	calculateLineTotal,
	getInvoiceCustomerSnapshot,
	parseLegacyPartSnapshot,
} from "./invoiceHelpers";

const escapeHtml = (value: unknown): string =>
	String(value ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");

type LineItemTableRow = {
	html: string;
	groupTitle?: string;
	isGroupHead?: boolean;
	isSubtotal?: boolean;
};

const isLineItemRow = (row: LineItemTableRow): boolean =>
	!row.isGroupHead && !row.isSubtotal;

// --- Page-1 layout budget (letter paper, 0.4in margins) -------------------
// All values are in "line-item-row" height units (~22px). Tune these if the
// summary ever slips off page one or page one looks too sparse/crowded.
const PAGE_ROW_CAPACITY = 41;
const HEADER_ROWS = 9;
const BIKE_ROWS = 2;
const SUMMARY_RESERVE_ROWS = 7;
// A mechanic-notes line is shorter than a line-item row, so each reserved row
// fits a little under two wrapped note lines.
const NOTE_LINES_PER_ROW = 1.5;
// Approx characters per wrapped line in the notes column when it sits beside
// the totals box on page one.
const NOTES_CHARS_PER_LINE = 80;

const getTopContentRows = (hasBike: boolean): number =>
	HEADER_ROWS + (hasBike ? BIKE_ROWS : 0);

/** Rough row budget for line items on page one. */
const getFirstPageLineItemRowBudget = (
	hasBike: boolean,
	groupCount: number,
): number => {
	// Reserve a row per group so each group's subtotal (e.g. the parts total)
	// always has room beside its items on page one instead of being clipped
	// behind the summary or orphaned onto a second page by itself.
	const subtotalReserve = groupCount;
	return Math.max(
		4,
		PAGE_ROW_CAPACITY -
			getTopContentRows(hasBike) -
			SUMMARY_RESERVE_ROWS -
			subtotalReserve,
	);
};

/**
 * How many wrapped note lines fit beside the totals on page one, based on the
 * vertical space left after the header, bike, and first-page line items.
 */
const getFirstPageNoteLineCapacity = (
	hasBike: boolean,
	firstPageLineItemCount: number,
): number => {
	const summaryRegionRows = Math.max(
		SUMMARY_RESERVE_ROWS,
		PAGE_ROW_CAPACITY - getTopContentRows(hasBike) - firstPageLineItemCount,
	);
	return Math.max(0, Math.floor(summaryRegionRows * NOTE_LINES_PER_ROW));
};

/**
 * Split raw (unescaped) notes into the chunk that fits beside the totals on
 * page one and the remainder that flows onto the continuation page. Splits on
 * line boundaries where possible, only hard-wrapping a single line that is too
 * long to fit on its own.
 */
const splitNotesForFirstPage = (
	rawNotes: string,
	charsPerLine: number,
	maxLines: number,
): { firstPage: string; continuation: string } => {
	if (maxLines <= 0) {
		return { firstPage: "", continuation: rawNotes };
	}

	const rawLines = rawNotes.split("\n");
	const firstLines: string[] = [];
	let usedLines = 0;
	let index = 0;

	for (; index < rawLines.length; index += 1) {
		const line = rawLines[index];
		const wrappedHeight = Math.max(1, Math.ceil(line.length / charsPerLine));

		if (usedLines + wrappedHeight <= maxLines) {
			firstLines.push(line);
			usedLines += wrappedHeight;
			continue;
		}

		// This line does not fully fit. If at least one wrapped row is still
		// available and the line is long enough to wrap, hard-split it.
		const remainingRows = maxLines - usedLines;
		if (remainingRows >= 1 && line.length > charsPerLine) {
			const cutChars = remainingRows * charsPerLine;
			firstLines.push(line.slice(0, cutChars));
			rawLines[index] = line.slice(cutChars);
		}
		break;
	}

	return {
		firstPage: firstLines.join("\n"),
		continuation: rawLines.slice(index).join("\n"),
	};
};

const splitLineItemRows = (
	rows: LineItemTableRow[],
	budget: number,
): { firstPage: LineItemTableRow[]; continuation: LineItemTableRow[] } => {
	if (rows.length <= budget) {
		return { firstPage: rows, continuation: [] };
	}

	// Never end page one on a dangling group header with no rows beneath it.
	let cut = budget;
	while (cut > 1 && rows[cut - 1]?.isGroupHead) {
		cut -= 1;
	}

	const firstPage = rows.slice(0, cut);
	let continuation = rows.slice(cut);

	// If the only overflow is trailing subtotal/header rows (no real line
	// items), keep them with their items on page one. The per-group reserve in
	// the budget guarantees there is room, so the parts total never ends up
	// alone on a second page.
	if (continuation.length > 0 && !continuation.some(isLineItemRow)) {
		return { firstPage: rows, continuation: [] };
	}

	const firstContinuation = continuation[0];

	if (firstContinuation?.groupTitle && !firstContinuation.isGroupHead) {
		const title = escapeHtml(firstContinuation.groupTitle);
		continuation = [
			{
				html: `<tr class="group-head"><th colspan="5">${title} (continued)</th></tr>`,
				groupTitle: firstContinuation.groupTitle,
				isGroupHead: true,
			},
			...continuation,
		];
	}

	return { firstPage, continuation };
};

export const buildInvoicePrintHtml = (
	invoice: InvoiceWithRelations,
	shopSettings: ShopSettings,
): string => {
	const safeLineItems = invoice.line_items ?? [];
	const hazardousWaste = safeLineItems.filter(
		(line) => line.item_type === "hazardous_waste",
	);
	const services = safeLineItems.filter((line) => line.item_type === "service");
	const parts = safeLineItems.filter((line) => line.item_type === "part");
	const hazardousWasteSubtotal = hazardousWaste.reduce(
		(sum, line) => sum + calculateLineTotal(line),
		0,
	);
	const servicesSubtotal = services.reduce(
		(sum, line) => sum + calculateLineTotal(line),
		0,
	);
	const partsSubtotal = parts.reduce(
		(sum, line) => sum + calculateLineTotal(line),
		0,
	);
	const subtotal = hazardousWasteSubtotal + servicesSubtotal + partsSubtotal;
	const normalizedTaxRate = Number(shopSettings.tax_rate ?? 0);
	// Labor/services are not taxable — sales tax applies to parts only.
	const salesTax = Number(
		((partsSubtotal * normalizedTaxRate) / 100).toFixed(2),
	);
	const grandTotal = subtotal + salesTax;
	const safeShopName = escapeHtml(shopSettings.shop_name ?? "Moto Shop");
	const safeShopAddress = escapeHtml(shopSettings.shop_address ?? "");
	const safeShopPhone = escapeHtml(shopSettings.shop_phone ?? "");
	const safeShopEmail = escapeHtml(shopSettings.shop_email ?? "");
	const safeBarNumber = escapeHtml(shopSettings.bar_number ?? "");

	const bike = invoice.bike;
	const customer = getInvoiceCustomerSnapshot(invoice);
	const rawMechanicNotes = String(invoice.mechanic_notes ?? "").trim();
	const createdDate = invoice.created_at
		? new Date(invoice.created_at).toLocaleDateString()
		: "N/A";
	const statusLabel = String(invoice.status ?? "draft")
		.replaceAll("_", " ")
		.toUpperCase();

	const hasBike = Boolean(bike);
	const hasHazardousWaste = hazardousWaste.length > 0;
	const hasServices = services.length > 0;
	const hasParts = parts.length > 0;
	const hasNotes = rawMechanicNotes.length > 0;

	const renderLineItemRow = (line: (typeof safeLineItems)[number]) =>
		`<tr>
		<td class="num">${Number(line.quantity).toFixed(2)}</td>
		<td class="part-num"></td>
		<td class="desc-cell"><div class="item-name">${escapeHtml(line.snapshot_name)}</div></td>
		<td class="num">$${Number(line.unit_price).toFixed(2)}</td>
		<td class="num strong">$${calculateLineTotal(line).toFixed(2)}</td>
	</tr>`;

	const getPartLinePartNumberForPrint = (
		line: InvoiceLineItemRecord,
	): string => {
		const stored = line.snapshot_part_number?.trim();
		if (stored) return stored;
		if (!line.snapshot_name.includes(" — ")) return "";
		return parseLegacyPartSnapshot(line.snapshot_name).partNumber;
	};

	const getPartLineDescriptionForPrint = (
		line: InvoiceLineItemRecord,
	): string => {
		const stored = line.snapshot_part_number?.trim();
		if (stored || !line.snapshot_name.includes(" — ")) {
			return line.snapshot_name;
		}
		return parseLegacyPartSnapshot(line.snapshot_name).description;
	};

	const renderPartLineItemRow = (line: InvoiceLineItemRecord) => {
		const partNumber = getPartLinePartNumberForPrint(line);
		const description = getPartLineDescriptionForPrint(line);
		return `<tr>
		<td class="num">${Number(line.quantity).toFixed(2)}</td>
		<td class="part-num">${partNumber ? escapeHtml(partNumber) : "—"}</td>
		<td class="desc-cell"><div class="item-name">${escapeHtml(description)}</div></td>
		<td class="num">$${Number(line.unit_price).toFixed(2)}</td>
		<td class="num strong">$${calculateLineTotal(line).toFixed(2)}</td>
	</tr>`;
	};

	const renderGroupSubtotal = (label: string, amount: number) =>
		`<tr class="group-subtotal">
		<td colspan="4" class="subtotal-label">${label}</td>
		<td class="num strong">$${amount.toFixed(2)}</td>
	</tr>`;

	const buildLineItemGroupRows = (
		title: string,
		items: typeof safeLineItems,
		subtotalLabel: string,
		subtotal: number,
		itemRenderer: (line: InvoiceLineItemRecord) => string = renderLineItemRow,
	): LineItemTableRow[] => {
		if (items.length === 0) return [];
		return [
			{
				html: `<tr class="group-head"><th colspan="5">${escapeHtml(title)}</th></tr>`,
				groupTitle: title,
				isGroupHead: true,
			},
			...items.map((line) => ({
				html: itemRenderer(line),
				groupTitle: title,
			})),
			{
				html: renderGroupSubtotal(subtotalLabel, subtotal),
				groupTitle: title,
				isSubtotal: true,
			},
		];
	};

	const allLineItemRows: LineItemTableRow[] = [
		...(hasHazardousWaste
			? buildLineItemGroupRows(
					"Hazardous Waste Disposal",
					hazardousWaste,
					"Hazardous Waste Total",
					hazardousWasteSubtotal,
				)
			: []),
		...(hasServices
			? buildLineItemGroupRows(
					"Labor & Services",
					services,
					"Labor Total",
					servicesSubtotal,
				)
			: []),
		...(hasParts
			? buildLineItemGroupRows(
					"Parts & Materials",
					parts,
					"Parts Total",
					partsSubtotal,
					renderPartLineItemRow,
				)
			: []),
	];

	const lineItemGroupCount =
		(hasHazardousWaste ? 1 : 0) + (hasServices ? 1 : 0) + (hasParts ? 1 : 0);

	const {
		firstPage: firstPageLineItemRows,
		continuation: continuationLineItemRows,
	} = splitLineItemRows(
		allLineItemRows,
		getFirstPageLineItemRowBudget(hasBike, lineItemGroupCount),
	);

	// Split notes so the part that fits beside the totals stays on page one and
	// any overflow flows onto the continuation page. This keeps the summary
	// pinned to page one while long notes can run onto later pages.
	const { firstPage: firstPageNotes, continuation: continuationNotes } =
		hasNotes
			? splitNotesForFirstPage(
					rawMechanicNotes,
					NOTES_CHARS_PER_LINE,
					getFirstPageNoteLineCapacity(hasBike, firstPageLineItemRows.length),
				)
			: { firstPage: "", continuation: "" };

	const hasFirstPageNotes = firstPageNotes.length > 0;
	const hasContinuationNotes = continuationNotes.length > 0;
	const hasContinuation =
		continuationLineItemRows.length > 0 || hasContinuationNotes;

	const lineItemsTableHead = `<colgroup>
					<col class="col-qty" />
					<col class="col-part-num" />
					<col class="col-desc" />
					<col class="col-unit" />
					<col class="col-total" />
				</colgroup>
				<thead>
					<tr>
						<th class="num">Qty</th>
						<th>Part #</th>
						<th>Part name</th>
						<th class="num">Unit</th>
						<th class="num">Total</th>
					</tr>
				</thead>`;

	const renderLineItemsTable = (rows: LineItemTableRow[], extraClass = "") =>
		rows.length > 0
			? `<section class="section">
			<table class="line-items${extraClass ? ` ${extraClass}` : ""}">
				${lineItemsTableHead}
				<tbody>
					${rows.map((row) => row.html).join("")}
				</tbody>
			</table>
		</section>`
			: "";

	const firstPageLineItemsSection = renderLineItemsTable(firstPageLineItemRows);
	const continuationLineItemsSection = renderLineItemsTable(
		continuationLineItemRows,
		"line-items--continuation",
	);

	const bikeSection = hasBike
		? `<section class="kv">
			<div class="kv-item"><span class="label">Year</span><span class="val">${bike?.year ?? ""}</span></div>
			<div class="kv-item"><span class="label">Make</span><span class="val">${escapeHtml(bike?.make ?? "")}</span></div>
			<div class="kv-item"><span class="label">Model</span><span class="val">${escapeHtml(bike?.model ?? "")}</span></div>
			<div class="kv-item"><span class="label">License</span><span class="val">${bike?.license_plate ? escapeHtml(bike.license_plate) : "—"}</span></div>
			<div class="kv-item"><span class="label">VIN</span><span class="val">${bike?.vin ? escapeHtml(bike.vin) : "—"}</span></div>
			${invoice.odometer_in != null ? `<div class="kv-item"><span class="label">Odo In</span><span class="val">${invoice.odometer_in}</span></div>` : ""}
			${invoice.odometer_out != null ? `<div class="kv-item"><span class="label">Odo Out</span><span class="val">${invoice.odometer_out}</span></div>` : ""}
		</section>`
		: "";

	const taxRow =
		hasParts || salesTax > 0
			? `<div class="totals-row"><span>Sales tax &middot; parts only (${normalizedTaxRate.toFixed(3)}%)</span><strong>$${salesTax.toFixed(2)}</strong></div>`
			: "";

	const notesColumn = hasFirstPageNotes
		? `<div class="notes-column">
			<h2 class="section-title">Mechanic Notes</h2>
			<div class="notes"><pre>${escapeHtml(firstPageNotes)}</pre></div>
		</div>`
		: "";

	const continuationNotesSection = hasContinuationNotes
		? `<section class="section notes-section">
			<h2 class="section-title">Mechanic Notes${hasFirstPageNotes ? " (continued)" : ""}</h2>
			<div class="notes"><pre>${escapeHtml(continuationNotes)}</pre></div>
		</section>`
		: "";

	const continuationSection = hasContinuation
		? `<div class="invoice-continuation">
			${continuationLineItemsSection}
			${continuationNotesSection}
		</div>`
		: "";

	const footerSection = `<footer class="footer">
			<div>Thank you for choosing ${safeShopName}.</div>
			<div class="footer-fine">Labor is not subject to sales tax. Please retain this invoice for your records.</div>
		</footer>`;

	const summarySection = `<section class="summary-block${hasFirstPageNotes ? "" : " summary-block--totals-only"}">
		${notesColumn}
		<div class="summary-aside">
			<section class="totals">
				<div class="totals-row"><span>Subtotal</span><strong>$${subtotal.toFixed(2)}</strong></div>
				${taxRow}
				<div class="totals-row grand"><span>Total Due</span><span>$${grandTotal.toFixed(2)}</span></div>
			</section>
			${footerSection}
		</div>
	</section>`;

	const providerLines = [
		safeShopAddress ? `<div>${safeShopAddress}</div>` : "",
		safeBarNumber ? `<div>BAR# ${safeBarNumber}</div>` : "",
		safeShopPhone ? `<div>${safeShopPhone}</div>` : "",
		safeShopEmail ? `<div>${safeShopEmail}</div>` : "",
	]
		.filter(Boolean)
		.join("");

	return `<!doctype html>
<html lang="en">
<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<title>Invoice #${invoice.invoice_number}</title>
	<style>
	:root {
		--text: #111827;
		--muted: #6b7280;
		--line: #d1d5db;
		--soft: #f3f4f6;
		--brand: #111827;
	}
	* { box-sizing: border-box; }
	body {
		margin: 0;
		padding: 16px;
		color: var(--text);
		font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
		font-size: 11px;
		line-height: 1.35;
		background: #fff;
	}
	.invoice {
		max-width: 900px;
		margin: 0 auto;
		border: 1px solid var(--line);
		padding: 12px 14px;
	}
	.top {
		display: grid;
		grid-template-columns: 1.3fr 1fr;
		gap: 10px;
		border-bottom: 2px solid var(--brand);
		padding-bottom: 8px;
		margin-bottom: 8px;
	}
	.h1 {
		font-size: 20px;
		font-weight: 800;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		margin: 0 0 2px;
	}
	.muted { color: var(--muted); font-size: 10px; }
	.meta {
		border: 1px solid var(--line);
		padding: 6px 8px;
		font-size: 10px;
	}
	.meta-row {
		display: flex;
		justify-content: space-between;
		gap: 6px;
		padding: 1px 0;
	}
	.status-pill {
		display: inline-block;
		background: var(--soft);
		border: 1px solid var(--line);
		font-weight: 700;
		padding: 1px 6px;
		font-size: 9px;
		letter-spacing: 0.04em;
	}
	.grid-2 {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
		margin-bottom: 8px;
	}
	.card {
		border: 1px solid var(--line);
		padding: 6px 8px;
		font-size: 10px;
		line-height: 1.4;
	}
	.card-title {
		font-size: 9px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--muted);
		margin: 0 0 3px;
	}
	.kv {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 4px 8px;
		border: 1px solid var(--line);
		background: var(--soft);
		padding: 6px 8px;
		margin-bottom: 8px;
	}
	.kv-item .label {
		display: block;
		font-size: 8px;
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.kv-item .val {
		display: block;
		font-size: 10px;
		font-weight: 700;
		margin-top: 0;
	}
	.section { margin-top: 8px; }
	.section-compact { margin-top: 6px; }
	.section-title {
		font-size: 11px;
		font-weight: 800;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		margin: 0 0 4px;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		border: 1px solid var(--line);
	}
	.line-items {
		table-layout: fixed;
	}
	.col-qty { width: 10%; }
	.col-part-num { width: 18%; }
	.col-desc { width: 28%; }
	.col-unit { width: 14%; }
	.col-total { width: 14%; }
	th, td {
		padding: 4px 6px;
		border-bottom: 1px solid var(--line);
		font-size: 10px;
		vertical-align: top;
	}
	th {
		background: var(--soft);
		font-size: 8px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		text-align: left;
	}
	.group-head th {
		background: #e5e7eb;
		color: var(--brand);
		font-size: 9px;
		font-weight: 800;
		letter-spacing: 0.06em;
		padding-top: 6px;
		padding-bottom: 6px;
		text-align: left;
	}
	.group-subtotal td {
		background: var(--soft);
		border-bottom: 2px solid var(--line);
	}
	.subtotal-label {
		font-weight: 700;
		text-align: right;
	}
	.desc-cell {
		word-break: break-word;
		overflow-wrap: anywhere;
	}
	.num { text-align: right; white-space: nowrap; }
	.strong { font-weight: 700; }
	.item-name { font-weight: 600; }
	.part-num {
		font-weight: 600;
		word-break: break-word;
	}
	.notes {
		border: 1px solid var(--line);
		padding: 6px 8px;
		background: #fff;
	}
	.notes pre {
		margin: 0;
		white-space: pre-wrap;
		font-family: inherit;
		font-size: 10px;
		line-height: 1.35;
	}
	.summary-block {
		display: flex;
		gap: 12px;
		align-items: flex-end;
		margin-top: 8px;
	}
	.summary-block--totals-only {
		justify-content: flex-end;
	}
	.notes-column {
		flex: 1 1 auto;
		min-width: 0;
	}
	.notes-column .section-title {
		margin: 0 0 4px;
	}
	.summary-aside {
		flex: 0 0 280px;
		width: 280px;
	}
	.totals {
		width: 100%;
		border: 1px solid var(--line);
	}
	.totals-row {
		display: flex;
		justify-content: space-between;
		padding: 4px 8px;
		border-bottom: 1px solid var(--line);
		font-size: 10px;
	}
	.totals-row:last-child { border-bottom: 0; }
	.totals-row.grand {
		background: var(--soft);
		font-size: 12px;
		font-weight: 800;
	}
	.footer {
		margin-top: 8px;
		padding-top: 6px;
		border-top: 1px dashed var(--line);
		font-size: 9px;
		color: var(--muted);
		text-align: center;
	}
	.footer-fine {
		margin-top: 2px;
		font-size: 8px;
		letter-spacing: 0.02em;
	}
	@media print {
		@page {
			size: letter;
			margin: 0.4in;
		}
		body {
			padding: 0;
		}
		.invoice { border: 0; padding: 0; }
		/*
		 * Page 1 is a sticky-footer flex column: the body grows to fill the
		 * page so the summary is pinned to the bottom. Line items are
		 * row-budgeted into the continuation page, so page-1 content never
		 * overlaps the summary.
		 */
		.invoice-page-one {
			display: flex;
			flex-direction: column;
			min-height: 10.2in;
		}
		.invoice-page-one-body {
			flex: 1 1 auto;
		}
		.invoice-continuation {
			break-before: page;
			page-break-before: always;
		}
		.summary-block {
			flex-shrink: 0;
			break-inside: avoid;
			page-break-inside: avoid;
		}
		.summary-aside {
			break-inside: avoid;
			page-break-inside: avoid;
		}
		.line-items thead {
			display: table-header-group;
		}
		.line-items tr {
			break-inside: avoid;
			page-break-inside: avoid;
		}
		th, .kv, .group-head th, .group-subtotal td, .totals-row.grand {
			-webkit-print-color-adjust: exact;
			print-color-adjust: exact;
		}
		.totals,
		.summary-aside {
			break-inside: avoid;
			page-break-inside: avoid;
		}
	}
	</style>
</head>
<body>
	<div class="invoice">
		<div class="invoice-page-one">
			<div class="invoice-page-one-body">
				<header class="top">
					<div>
						<h1 class="h1">Service Invoice</h1>
						<div class="muted">${safeShopName}</div>
					</div>
					<div class="meta">
						<div class="meta-row"><span>Invoice #</span><strong>${invoice.invoice_number}</strong></div>
						<div class="meta-row"><span>Date</span><strong>${createdDate}</strong></div>
						<div class="meta-row"><span>Status</span><span class="status-pill">${escapeHtml(statusLabel)}</span></div>
					</div>
				</header>

				<section class="grid-2">
					<div class="card">
						<div><strong>${escapeHtml(customer.name)}</strong></div>
						${customer.email ? `<div>${escapeHtml(customer.email)}</div>` : ""}
						${customer.phone ? `<div>${escapeHtml(customer.phone)}</div>` : ""}
						${customer.address ? `<div>${escapeHtml(customer.address)}</div>` : ""}
					</div>
					<div class="card">
						<div><strong>${safeShopName}</strong></div>
						${providerLines}
					</div>
				</section>

				${bikeSection}
				${firstPageLineItemsSection}
			</div>
			${summarySection}
		</div>
		${continuationSection}
	</div>
	<script>window.onload = function () { window.print(); };</script>
</body>
</html>`;
};
