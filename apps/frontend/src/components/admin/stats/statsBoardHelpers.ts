import type {
	InvoiceLineItemRecord,
	InvoiceRecord,
	InvoiceWithRelations,
	Part,
	Service,
} from "@/types";
import { getPartDisplayLabel } from "../parts/partUtils";
import { calculateLineTotal } from "../invoices/invoiceHelpers";

export type StatsBreakdownCategory = "service" | "part" | "hazardous_waste";

export interface StatsLineItemContribution {
	key: string;
	label: string;
	total: number;
	quantity: number;
	lineCount: number;
}

export interface InvoiceFinancialBreakdown {
	servicesSubtotal: number;
	partsSubtotal: number;
	hazardousWasteSubtotal: number;
	subtotal: number;
	salesTax: number;
	grandTotal: number;
}

export interface StatsBoardTotals extends InvoiceFinancialBreakdown {
	invoiceCount: number;
}

const sumLinesByType = (
	lineItems: InvoiceLineItemRecord[],
	itemType: InvoiceLineItemRecord["item_type"],
): number =>
	lineItems
		.filter((line) => line.item_type === itemType)
		.reduce((sum, line) => sum + calculateLineTotal(line), 0);

export const getInvoiceFinancialBreakdown = (
	invoice: InvoiceWithRelations,
	taxRate: number,
): InvoiceFinancialBreakdown => {
	const lineItems = invoice.line_items ?? [];
	const hazardousWasteSubtotal = sumLinesByType(lineItems, "hazardous_waste");
	const servicesSubtotal = sumLinesByType(lineItems, "service");
	const partsSubtotal = sumLinesByType(lineItems, "part");
	const subtotal =
		hazardousWasteSubtotal + servicesSubtotal + partsSubtotal;
	const normalizedTaxRate = Number(taxRate ?? 0);
	const salesTax = Number(
		((partsSubtotal * normalizedTaxRate) / 100).toFixed(2),
	);
	const grandTotal = subtotal + salesTax;

	return {
		servicesSubtotal,
		partsSubtotal,
		hazardousWasteSubtotal,
		subtotal,
		salesTax,
		grandTotal,
	};
};

export const aggregateStatsBoardTotals = (
	invoices: InvoiceWithRelations[],
	taxRate: number,
): StatsBoardTotals => {
	const totals: StatsBoardTotals = {
		invoiceCount: invoices.length,
		servicesSubtotal: 0,
		partsSubtotal: 0,
		hazardousWasteSubtotal: 0,
		subtotal: 0,
		salesTax: 0,
		grandTotal: 0,
	};

	for (const invoice of invoices) {
		const breakdown = getInvoiceFinancialBreakdown(invoice, taxRate);
		totals.servicesSubtotal += breakdown.servicesSubtotal;
		totals.partsSubtotal += breakdown.partsSubtotal;
		totals.hazardousWasteSubtotal += breakdown.hazardousWasteSubtotal;
		totals.subtotal += breakdown.subtotal;
		totals.salesTax += breakdown.salesTax;
		totals.grandTotal += breakdown.grandTotal;
	}

	return totals;
};

const parseLocalDateStart = (value: string): Date => {
	const [year, month, day] = value.split("-").map(Number);
	return new Date(year, month - 1, day, 0, 0, 0, 0);
};

const parseLocalDateEnd = (value: string): Date => {
	const [year, month, day] = value.split("-").map(Number);
	return new Date(year, month - 1, day, 23, 59, 59, 999);
};

export const isInvoiceInDateRange = (
	invoice: InvoiceWithRelations,
	startDate: string,
	endDate: string,
): boolean => {
	if (!startDate || !endDate || !invoice.created_at) return false;

	const invoiceDate = new Date(invoice.created_at);
	if (Number.isNaN(invoiceDate.getTime())) return false;

	const start = parseLocalDateStart(startDate);
	const end = parseLocalDateEnd(endDate);
	if (start > end) return false;

	return invoiceDate >= start && invoiceDate <= end;
};

export const filterInvoicesForStatsBoard = (
	invoices: InvoiceWithRelations[],
	options: {
		startDate: string;
		endDate: string;
		statuses: InvoiceRecord["status"][];
	},
): InvoiceWithRelations[] =>
	invoices.filter(
		(invoice) =>
			options.statuses.includes(invoice.status) &&
			isInvoiceInDateRange(invoice, options.startDate, options.endDate),
	);

const formatDateInputValue = (date: Date): string => {
	const pad = (part: number) => String(part).padStart(2, "0");
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const getDefaultStatsDateRange = (): {
	startDate: string;
	endDate: string;
} => {
	const now = new Date();
	const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
	return {
		startDate: formatDateInputValue(startOfMonth),
		endDate: formatDateInputValue(now),
	};
};

export const formatStatsDateRangeLabel = (
	startDate: string,
	endDate: string,
): string => {
	const start = parseLocalDateStart(startDate);
	const end = parseLocalDateEnd(endDate);
	const formatter = new Intl.DateTimeFormat(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
	return `${formatter.format(start)} – ${formatter.format(end)}`;
};

const getLineItemGroupKey = (line: InvoiceLineItemRecord): string => {
	if (line.item_type === "service") {
		return line.service_id
			? `service:${line.service_id}`
			: `custom:${line.snapshot_name.trim() || "unnamed-service"}`;
	}
	if (line.item_type === "part") {
		return line.part_id
			? `part:${line.part_id}`
			: `custom:${line.snapshot_name.trim() || "unnamed-part"}`;
	}
	return `waste:${line.snapshot_name.trim() || "hazardous-waste"}`;
};

const getLineItemContributionLabel = (
	line: InvoiceLineItemRecord,
	services: Service[],
	parts: Part[],
): string => {
	if (line.item_type === "service") {
		if (line.service_id) {
			return (
				services.find((service) => service.id === line.service_id)?.name ??
				line.snapshot_name.trim()
			);
		}
		return line.snapshot_name.trim() || "Custom service";
	}

	if (line.item_type === "part") {
		if (line.part_id) {
			const part = parts.find((entry) => entry.id === line.part_id);
			if (part) return getPartDisplayLabel(part);
		}
		return line.snapshot_name.trim() || "Custom part";
	}

	return line.snapshot_name.trim() || "Hazardous waste";
};

export const aggregateLineItemContributions = (
	invoices: InvoiceWithRelations[],
	itemType: StatsBreakdownCategory,
	services: Service[],
	parts: Part[],
): StatsLineItemContribution[] => {
	const contributions = new Map<string, StatsLineItemContribution>();

	for (const invoice of invoices) {
		for (const line of invoice.line_items ?? []) {
			if (line.item_type !== itemType) continue;

			const key = getLineItemGroupKey(line);
			const lineTotal = calculateLineTotal(line);
			const quantity = Number(line.quantity);
			const existing = contributions.get(key);

			if (existing) {
				existing.total += lineTotal;
				existing.quantity += quantity;
				existing.lineCount += 1;
				continue;
			}

			contributions.set(key, {
				key,
				label: getLineItemContributionLabel(line, services, parts),
				total: lineTotal,
				quantity,
				lineCount: 1,
			});
		}
	}

	return [...contributions.values()].sort((a, b) => b.total - a.total);
};
