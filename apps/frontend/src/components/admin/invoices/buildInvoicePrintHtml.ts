import type { InvoiceWithRelations, ShopSettings } from "@/types";
import { calculateLineTotal, getUserDisplayName } from "./invoiceHelpers";

const escapeHtml = (value: unknown): string =>
	String(value ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");

export const buildInvoicePrintHtml = (
	invoice: InvoiceWithRelations,
	shopSettings: ShopSettings,
): string => {
	const safeLineItems = invoice.line_items ?? [];
	const services = safeLineItems.filter((line) => line.item_type === "service");
	const parts = safeLineItems.filter((line) => line.item_type === "part");
	const servicesSubtotal = services.reduce(
		(sum, line) => sum + calculateLineTotal(line),
		0,
	);
	const partsSubtotal = parts.reduce(
		(sum, line) => sum + calculateLineTotal(line),
		0,
	);
	const subtotal = servicesSubtotal + partsSubtotal;
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

	const owner = invoice.owner;
	const bike = invoice.bike;
	const mechanicNotes = escapeHtml(invoice.mechanic_notes ?? "").trim();
	const createdDate = invoice.created_at
		? new Date(invoice.created_at).toLocaleDateString()
		: "N/A";
	const statusLabel = String(invoice.status ?? "draft")
		.replaceAll("_", " ")
		.toUpperCase();

	const renderRows = (items: typeof safeLineItems) => {
		if (items.length === 0) {
			return `<tr><td colspan="4" class="empty-row">No line items</td></tr>`;
		}
		return items
			.map(
				(line) => `<tr>
		<td class="num">${Number(line.quantity).toFixed(2)}</td>
		<td class="desc-cell">
			<div class="item-name">${escapeHtml(line.snapshot_name)}</div>
		</td>
		<td class="num">$${Number(line.unit_price).toFixed(2)}</td>
		<td class="num strong">$${calculateLineTotal(line).toFixed(2)}</td>
	</tr>`,
			)
			.join("");
	};

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
		padding: 28px;
		color: var(--text);
		font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
		font-size: 12px;
		line-height: 1.45;
		background: #fff;
	}
	.invoice {
		max-width: 900px;
		margin: 0 auto;
		border: 1px solid var(--line);
		padding: 18px;
	}
	.top {
		display: grid;
		grid-template-columns: 1.3fr 1fr;
		gap: 16px;
		border-bottom: 2px solid var(--brand);
		padding-bottom: 12px;
		margin-bottom: 14px;
	}
	.h1 {
		font-size: 24px;
		font-weight: 800;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		margin: 0 0 4px;
	}
	.muted { color: var(--muted); }
	.meta {
		border: 1px solid var(--line);
		padding: 10px;
	}
	.meta-row {
		display: flex;
		justify-content: space-between;
		gap: 8px;
		padding: 2px 0;
	}
	.status-pill {
		display: inline-block;
		background: var(--soft);
		border: 1px solid var(--line);
		font-weight: 700;
		padding: 2px 8px;
		letter-spacing: 0.04em;
	}
	.grid-2 {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
		margin-bottom: 12px;
	}
	.card {
		border: 1px solid var(--line);
		padding: 10px;
		min-height: 96px;
	}
	.card-title {
		font-size: 11px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--muted);
		margin: 0 0 6px;
	}
	.kv {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 8px;
		border: 1px solid var(--line);
		background: var(--soft);
		padding: 10px;
		margin-bottom: 12px;
	}
	.kv-item .label {
		display: block;
		font-size: 10px;
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.kv-item .val {
		display: block;
		font-size: 12px;
		font-weight: 700;
		margin-top: 1px;
	}
	.section { margin-top: 14px; }
	.section-title {
		font-size: 13px;
		font-weight: 800;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		margin: 0 0 6px;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		border: 1px solid var(--line);
	}
	th, td {
		padding: 7px 8px;
		border-bottom: 1px solid var(--line);
	}
	th {
		background: var(--soft);
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		text-align: left;
	}
	.num { text-align: right; white-space: nowrap; }
	.strong { font-weight: 700; }
	.empty-row { text-align: center; color: var(--muted); padding: 12px; }
	.item-name { font-weight: 600; }
	.subtotal {
		border: 1px solid var(--line);
		border-top: none;
		padding: 7px 8px;
		text-align: right;
		font-weight: 700;
		background: var(--soft);
	}
	.notes {
		border: 1px solid var(--line);
		padding: 10px;
		background: #fff;
		margin-top: 8px;
	}
	.notes pre {
		margin: 0;
		white-space: pre-wrap;
		font-family: inherit;
	}
	.totals {
		margin-top: 14px;
		margin-left: auto;
		width: 320px;
		border: 1px solid var(--line);
	}
	.totals-row {
		display: flex;
		justify-content: space-between;
		padding: 7px 10px;
		border-bottom: 1px solid var(--line);
	}
	.totals-row:last-child { border-bottom: 0; }
	.totals-row.grand {
		background: var(--soft);
		font-size: 14px;
		font-weight: 800;
	}
	.footer {
		margin-top: 16px;
		padding-top: 8px;
		border-top: 1px dashed var(--line);
		font-size: 11px;
		color: var(--muted);
		text-align: center;
	}
	.footer-fine {
		margin-top: 4px;
		font-size: 9px;
		letter-spacing: 0.02em;
	}
	@media print {
		body { padding: 0; }
		.invoice { border: 0; padding: 0; }
		th, .kv, .subtotal, .totals-row.grand {
			-webkit-print-color-adjust: exact;
			print-color-adjust: exact;
		}
	}
	</style>
</head>
<body>
	<div class="invoice">
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
				<p class="card-title">Customer</p>
				<div><strong>${owner ? escapeHtml(getUserDisplayName(owner)) : "Walk-in Customer"}</strong></div>
				<div>${owner?.email ? escapeHtml(owner.email) : "No email on file"}</div>
				<div>${owner?.phone_number ? escapeHtml(owner.phone_number) : ""}</div>
			</div>
			<div class="card">
				<p class="card-title">Service Provider</p>
				<div><strong>${safeShopName}</strong></div>
				<div>Motorcycle Service & Repair</div>
				${safeShopAddress ? `<div>${safeShopAddress}</div>` : ""}
				${safeShopPhone ? `<div>${safeShopPhone}</div>` : ""}
				${safeShopEmail ? `<div>${safeShopEmail}</div>` : ""}
			</div>
		</section>

		<section class="kv">
			<div class="kv-item"><span class="label">Year</span><span class="val">${bike?.year ?? "N/A"}</span></div>
			<div class="kv-item"><span class="label">Make</span><span class="val">${bike ? escapeHtml(bike.make) : "N/A"}</span></div>
			<div class="kv-item"><span class="label">Model</span><span class="val">${bike ? escapeHtml(bike.model) : "N/A"}</span></div>
			<div class="kv-item"><span class="label">License</span><span class="val">${bike?.license_plate ? escapeHtml(bike.license_plate) : "N/A"}</span></div>
			<div class="kv-item"><span class="label">VIN</span><span class="val">${bike?.vin ? escapeHtml(bike.vin) : "N/A"}</span></div>
			<div class="kv-item"><span class="label">Odometer In</span><span class="val">${invoice.odometer_in ?? "N/A"}</span></div>
			<div class="kv-item"><span class="label">Odometer Out</span><span class="val">${invoice.odometer_out ?? "N/A"}</span></div>
			<div class="kv-item"><span class="label">Line Items</span><span class="val">${safeLineItems.length}</span></div>
		</section>

		<section class="section">
			<h2 class="section-title">Labor & Services</h2>
			<table>
				<thead>
					<tr>
						<th class="num">Qty</th>
						<th>Description</th>
						<th class="num">Unit</th>
						<th class="num">Total</th>
					</tr>
				</thead>
				<tbody>${renderRows(services)}</tbody>
			</table>
			<div class="subtotal">Labor Total: $${servicesSubtotal.toFixed(2)}</div>
		</section>

		<section class="section">
			<h2 class="section-title">Parts & Materials</h2>
			<table>
				<thead>
					<tr>
						<th class="num">Qty</th>
						<th>Description</th>
						<th class="num">Unit</th>
						<th class="num">Total</th>
					</tr>
				</thead>
				<tbody>${renderRows(parts)}</tbody>
			</table>
			<div class="subtotal">Parts Total: $${partsSubtotal.toFixed(2)}</div>
		</section>

		<section class="section">
			<h2 class="section-title">Mechanic Notes</h2>
			<div class="notes">
				<pre>${mechanicNotes || "No notes provided."}</pre>
			</div>
		</section>

		<section class="totals">
			<div class="totals-row"><span>Labor subtotal</span><strong>$${servicesSubtotal.toFixed(2)}</strong></div>
			<div class="totals-row"><span>Parts subtotal</span><strong>$${partsSubtotal.toFixed(2)}</strong></div>
			<div class="totals-row"><span>Subtotal</span><strong>$${subtotal.toFixed(2)}</strong></div>
			<div class="totals-row"><span>Sales tax &middot; parts only (${normalizedTaxRate.toFixed(3)}%)</span><strong>$${salesTax.toFixed(2)}</strong></div>
			<div class="totals-row grand"><span>Total Due</span><span>$${grandTotal.toFixed(2)}</span></div>
		</section>

		<footer class="footer">
			<div>Thank you for choosing ${safeShopName}.</div>
			<div class="footer-fine">Labor is not subject to sales tax. Please retain this invoice for your records.</div>
		</footer>
	</div>
	<script>window.onload = function () { window.print(); };</script>
</body>
</html>`;
};
