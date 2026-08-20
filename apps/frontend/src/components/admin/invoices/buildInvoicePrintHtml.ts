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
	/** Estimated print height in row units (wrapped descriptions may exceed 1). */
	weight?: number;
};

const isLineItemRow = (row: LineItemTableRow): boolean =>
	!row.isGroupHead && !row.isSubtotal;

export const getLineItemRowWeight = (row: LineItemTableRow): number =>
	row.weight ?? 1;

export const sumLineItemRowWeights = (rows: LineItemTableRow[]): number =>
	rows.reduce((total, row) => total + getLineItemRowWeight(row), 0);

const DESC_COL_CHARS = 38;
const PART_NUM_COL_CHARS = 16;

const estimatePartDescriptionForPrint = (line: InvoiceLineItemRecord): string => {
	const stored = line.snapshot_part_number?.trim();
	if (stored || !line.snapshot_name.includes(" — ")) {
		return line.snapshot_name;
	}
	return parseLegacyPartSnapshot(line.snapshot_name).description;
};

const estimatePartNumberForPrint = (line: InvoiceLineItemRecord): string => {
	const stored = line.snapshot_part_number?.trim();
	if (stored) return stored;
	if (!line.snapshot_name.includes(" — ")) return "";
	return parseLegacyPartSnapshot(line.snapshot_name).partNumber;
};

/** Estimate how many budget rows a line item will occupy when printed. */
export const estimateLineItemRowWeight = (
	line: InvoiceLineItemRecord,
): number => {
	const description =
		line.item_type === "part"
			? estimatePartDescriptionForPrint(line)
			: line.snapshot_name;
	const partNumber =
		line.item_type === "part" ? estimatePartNumberForPrint(line) : "";
	const descLines = Math.max(1, Math.ceil(description.length / DESC_COL_CHARS));
	const partLines = Math.max(
		1,
		Math.ceil(partNumber.length / PART_NUM_COL_CHARS),
	);
	return Math.max(descLines, partLines);
};

// --- Page-1 layout budget (letter paper, 0.4in margins) -------------------
// Row units approximate ~22px of printable height. The totals box is pinned in
// a fixed-height footer region; mechanic notes fill the space to its left inside
// that same region (capped so totals never move to page two).
export const PAGE_ROW_CAPACITY = 47;
export const SUMMARY_PIN_ROWS_TOTALS_ONLY = 7;
/** Upper cap when many mechanic notes share the pinned region with totals. */
export const SUMMARY_PIN_ROWS_MAX = 12;
export const NOTE_HEADING_ROWS = 1;
export const HEADER_ROWS = 9;
export const BIKE_ROWS = 2;
/** Extra slack for wrapped part names / table rows that run taller than one unit. */
export const BUDGET_SAFETY_ROWS = 3;
// Mechanic-note lines are shorter than a table row; each row unit fits ~1.6 lines.
export const NOTE_LINES_PER_ROW = 1.6;
// Narrow notes column beside the 280px totals box on page one.
export const NOTES_CHARS_PER_LINE_BESIDE_TOTALS = 78;

export const getBodyRowCapacity = (summaryPinRows: number): number =>
	PAGE_ROW_CAPACITY - summaryPinRows;

export const summaryPinHeightIn = (summaryPinRows: number): string =>
	`${((summaryPinRows * 22) / 96).toFixed(2)}in`;

export const countWrappedNoteLines = (
	rawNotes: string,
	charsPerLine: number,
): number => {
	if (!rawNotes.trim()) return 0;
	return rawNotes
		.split("\n")
		.reduce(
			(sum, line) => sum + Math.max(1, Math.ceil(line.length / charsPerLine)),
			0,
		);
};

/**
 * Size the pinned summary region to fit the first-page notes beside totals.
 * Short notes keep the compact totals-only height so line items can run lower.
 */
export const getDynamicSummaryPinRows = (
	firstPageNoteWrappedLines: number,
): number => {
	if (firstPageNoteWrappedLines <= 0) {
		return SUMMARY_PIN_ROWS_TOTALS_ONLY;
	}

	const noteBlockRows =
		NOTE_HEADING_ROWS +
		Math.ceil(firstPageNoteWrappedLines / NOTE_LINES_PER_ROW);
	return Math.min(
		SUMMARY_PIN_ROWS_MAX,
		Math.max(SUMMARY_PIN_ROWS_TOTALS_ONLY, noteBlockRows),
	);
};

export const getMaxFirstPageNoteLineCapacity = (): number => {
	const noteRegionRows = SUMMARY_PIN_ROWS_MAX - NOTE_HEADING_ROWS;
	return Math.max(0, Math.floor(noteRegionRows * NOTE_LINES_PER_ROW));
};

export const getTopContentRows = (hasBike: boolean): number =>
	HEADER_ROWS + (hasBike ? BIKE_ROWS : 0);

/** Rough row budget for line items on page one. */
export const getFirstPageLineItemRowBudget = (
	hasBike: boolean,
	groupCount: number,
	summaryPinRows: number,
): number => {
	const subtotalReserve = groupCount;
	return Math.max(
		4,
		getBodyRowCapacity(summaryPinRows) -
		getTopContentRows(hasBike) -
		subtotalReserve -
		BUDGET_SAFETY_ROWS,
	);
};

/** @deprecated Use getMaxFirstPageNoteLineCapacity(). */
export const getFirstPageNoteLineCapacity = (hasNotes: boolean): number =>
	hasNotes ? getMaxFirstPageNoteLineCapacity() : 0;

/** @deprecated Use getDynamicSummaryPinRows(). */
export const getSummaryPinRows = (hasNotes: boolean): number =>
	hasNotes ? SUMMARY_PIN_ROWS_MAX : SUMMARY_PIN_ROWS_TOTALS_ONLY;

/**
 * Split raw (unescaped) notes into the chunk that fits in the page-one body and
 * the remainder that flows onto the continuation page. Splits on line boundaries
 * where possible, only hard-wrapping a single line that is too long to fit alone.
 */
export const splitNotesForFirstPage = (
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

export const splitLineItemRows = (
	rows: LineItemTableRow[],
	budget: number,
): { firstPage: LineItemTableRow[]; continuation: LineItemTableRow[] } => {
	if (rows.length === 0) {
		return { firstPage: [], continuation: [] };
	}

	if (sumLineItemRowWeights(rows) <= budget) {
		return { firstPage: rows, continuation: [] };
	}

	let usedWeight = 0;
	let cut = 0;
	for (const [index, row] of rows.entries()) {
		const weight = getLineItemRowWeight(row);
		if (usedWeight + weight > budget && cut > 0) {
			break;
		}
		usedWeight += weight;
		cut = index + 1;
	}

	if (cut === 0) {
		cut = 1;
	}

	// Never end page one on a dangling group header with no rows beneath it.
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
				weight: 1,
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
				weight: 1,
			},
			...items.map((line) => ({
				html: itemRenderer(line),
				groupTitle: title,
				weight: estimateLineItemRowWeight(line),
			})),
			{
				html: renderGroupSubtotal(subtotalLabel, subtotal),
				groupTitle: title,
				isSubtotal: true,
				weight: 1,
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

	// Split notes first so the summary pin can shrink when only a few lines fit
	// on page one, giving parts/services more vertical room on the first page.
	const { firstPage: firstPageNotes, continuation: continuationNotes } =
		hasNotes
			? splitNotesForFirstPage(
				rawMechanicNotes,
				NOTES_CHARS_PER_LINE_BESIDE_TOTALS,
				getMaxFirstPageNoteLineCapacity(),
			)
			: { firstPage: "", continuation: "" };

	const hasFirstPageNotes = firstPageNotes.length > 0;
	const summaryPinRows = getDynamicSummaryPinRows(
		hasFirstPageNotes
			? countWrappedNoteLines(
				firstPageNotes,
				NOTES_CHARS_PER_LINE_BESIDE_TOTALS,
			)
			: 0,
	);

	const {
		firstPage: firstPageLineItemRows,
		continuation: continuationLineItemRows,
	} = splitLineItemRows(
		allLineItemRows,
		getFirstPageLineItemRowBudget(
			hasBike,
			lineItemGroupCount,
			summaryPinRows,
		),
	);

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

	const summaryIntro = `<div class="summary-intro">
			<p class="summary-thanks">Thank you for choosing ${safeShopName}.</p>
			<p class="summary-retain">Please retain this invoice for your records.</p>
		</div>`;

	const summaryPin = `<div class="summary-pin${hasFirstPageNotes ? " summary-pin--with-notes" : " summary-pin--totals-only"}">
		<div class="summary-pin-row">
			${notesColumn}
			<div class="summary-aside">
				${summaryIntro}
				<section class="totals">
					<div class="totals-row"><span>Subtotal</span><strong>$${subtotal.toFixed(2)}</strong></div>
					${taxRow}
					<div class="totals-row grand"><span>Total Due</span><span>$${grandTotal.toFixed(2)}</span></div>
				</section>
			</div>
		</div>
	</div>`;

	const summaryPinHeight = summaryPinHeightIn(summaryPinRows);

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
		--print-page-height: 10.2in;
		--summary-pin-height: ${summaryPinHeight};
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
	.invoice-page-one {
		position: relative;
	}
	.invoice-page-one-body {
		padding-bottom: calc(var(--summary-pin-height) + 8px);
	}
	.summary-pin {
		position: absolute;
		right: 0;
		bottom: 0;
		left: 0;
		background: #fff;
	}
	.summary-pin-row {
		display: flex;
		gap: 12px;
		align-items: flex-end;
		width: 100%;
		height: 100%;
		max-height: 100%;
	}
	.summary-pin--totals-only .summary-pin-row {
		justify-content: flex-end;
	}
	.notes-column {
		flex: 1 1 auto;
		min-width: 0;
		max-height: 100%;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}
	.notes-column .section-title {
		flex: 0 0 auto;
		margin: 0 0 4px;
	}
	.notes-column .notes {
		flex: 1 1 auto;
		min-height: 0;
		overflow: hidden;
	}
	.summary-aside {
		flex: 0 0 280px;
		width: 280px;
	}
	.summary-intro {
		margin: 0 0 6px;
		text-align: center;
	}
	.summary-thanks,
	.summary-retain {
		margin: 0;
		font-size: 9px;
		color: var(--muted);
		line-height: 1.35;
	}
	.summary-retain {
		margin-top: 2px;
		font-size: 8px;
		letter-spacing: 0.02em;
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
		 * Page 1 uses a fixed printable height with the grand-total box pinned to
		 * the bottom. Mechanic notes share that pinned region on the left; their
		 * height is capped so totals never move to page two. Line items are
		 * row-budgeted into the continuation page when needed.
		 */
		.invoice-page-one {
			height: var(--print-page-height);
			max-height: var(--print-page-height);
			overflow: hidden;
			break-after: avoid;
			page-break-after: avoid;
		}
		.invoice-page-one-body {
			max-height: calc(var(--print-page-height) - var(--summary-pin-height));
			overflow: hidden;
			padding-bottom: 0;
		}
		.summary-pin {
			height: var(--summary-pin-height);
			break-inside: avoid;
			page-break-inside: avoid;
		}
		.invoice-continuation {
			break-before: page;
			page-break-before: always;
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
		.summary-pin,
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
			${summaryPin}
		</div>
		${continuationSection}
	</div>
	<script>window.onload = function () { window.print(); };</script>
</body>
</html>`;
};
