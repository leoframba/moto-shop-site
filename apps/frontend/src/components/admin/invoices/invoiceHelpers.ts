import type {
	AdminUser,
	InvoiceBike,
	InvoiceLineItemRecord,
	InvoiceRecord,
	InvoiceWithRelations,
	Part,
	Service,
	ShopSettings,
} from "@/types";

export interface DraftServiceLine {
	id: string;
	service_id: string;
	snapshot_name: string;
	is_custom: boolean;
	pricing_type: Service["pricing_type"] | "";
	unit_price: number;
	quantity: number;
}

export interface DraftPartLine {
	id: string;
	part_id: string;
	snapshot_name: string;
	snapshot_part_number: string;
	is_custom: boolean;
	unit_price: number;
	quantity: number;
}

export const HAZARDOUS_WASTE_LINE_NAME = "Hazardous Waste Disposal";

export const INVOICE_STATUSES: InvoiceRecord["status"][] = [
	"draft",
	"estimate",
	"in_progress",
	"completed",
	"paid",
	"void",
];

export const DEFAULT_SHOP_SETTINGS: ShopSettings = {
	id: 1,
	shop_name: "Moto Shop",
	shop_address: null,
	shop_phone: null,
	shop_email: null,
	bar_number: null,
	hourly_rate: 0,
	tax_rate: 0,
	hazardous_waste_rate: 0,
};

export const createDraftId = (): string => {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
		return crypto.randomUUID();
	}
	return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export const getUserDisplayName = (user: AdminUser): string => {
	const fullName = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();
	return fullName || user.email;
};

export const toCurrency = (value: number): string => `$${value.toFixed(2)}`;

export const parseNumberInput = (value: string, fallback = 0): number => {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
};

export const calculateLineTotal = (line: InvoiceLineItemRecord): number =>
	Number(line.unit_price) * Number(line.quantity);

export const calculateInvoiceTotal = (invoice: InvoiceWithRelations): number =>
	invoice.line_items.reduce((sum, line) => sum + calculateLineTotal(line), 0);

export const getInvoiceCustomerSnapshot = (
	invoice: InvoiceWithRelations,
): {
	name: string;
	email: string;
	phone: string;
	address: string;
} => {
	const snapshotName =
		`${invoice.customer_first_name ?? ""} ${invoice.customer_last_name ?? ""}`.trim();
	const hasSnapshot = Boolean(
		snapshotName ||
			invoice.customer_email?.trim() ||
			invoice.customer_phone?.trim() ||
			invoice.customer_address?.trim(),
	);

	if (hasSnapshot) {
		return {
			name: snapshotName || "Walk-in Customer",
			email: invoice.customer_email?.trim() ?? "",
			phone: invoice.customer_phone?.trim() ?? "",
			address: invoice.customer_address?.trim() ?? "",
		};
	}

	if (invoice.owner) {
		return {
			name: getUserDisplayName(invoice.owner),
			email: invoice.owner.email ?? "",
			phone: invoice.owner.phone_number ?? "",
			address: invoice.owner.address?.trim() ?? "",
		};
	}

	return {
		name: "Walk-in Customer",
		email: "",
		phone: "",
		address: "",
	};
};

export const getInvoiceOwnerLabel = (invoice: InvoiceWithRelations): string => {
	if (invoice.owner) {
		return `${getUserDisplayName(invoice.owner)} (${invoice.owner.email})`;
	}

	const customer = getInvoiceCustomerSnapshot(invoice);
	if (customer.name === "Walk-in Customer") return "Unlinked";

	const contact = customer.email || customer.phone;
	return contact ? `${customer.name} (${contact})` : customer.name;
};

export const getInvoiceBikeLabel = (invoice: InvoiceWithRelations): string => {
	if (!invoice.bike) return "Unlinked";
	return `${invoice.bike.year} ${invoice.bike.make} ${invoice.bike.model}`;
};

export const getBikeDisplayLabel = (bike: InvoiceBike): string =>
	`${bike.year} ${bike.make} ${bike.model}`;

export interface InvoiceEntityFilters {
	userId: string;
	bikeId: string;
}

/** Current bike owner plus anyone who has an invoice linked to this bike. */
export const getViableOwnerIdsForBike = (
	bikeId: string,
	invoices: InvoiceWithRelations[],
	bikes: InvoiceBike[],
): string[] => {
	const ownerIds = new Set<string>();
	const bike = bikes.find((entry) => entry.id === bikeId);
	if (bike?.owner_id) {
		ownerIds.add(bike.owner_id);
	}
	for (const invoice of invoices) {
		if (invoice.bike_id === bikeId && invoice.owner_id) {
			ownerIds.add(invoice.owner_id);
		}
	}
	return [...ownerIds];
};

export const getBikesOwnedByUser = (
	userId: string,
	bikes: InvoiceBike[],
): InvoiceBike[] => bikes.filter((bike) => bike.owner_id === userId);

export const invoiceMatchesEntityFilters = (
	invoice: InvoiceWithRelations,
	filters: InvoiceEntityFilters,
): boolean => {
	if (filters.userId && invoice.owner_id !== filters.userId) {
		return false;
	}
	if (filters.bikeId && invoice.bike_id !== filters.bikeId) {
		return false;
	}
	return true;
};

export const compareUsersByDisplayName = (
	a: AdminUser,
	b: AdminUser,
): number =>
	getUserDisplayName(a).localeCompare(getUserDisplayName(b), undefined, {
		sensitivity: "base",
	});

export const compareBikesByDisplayLabel = (
	a: InvoiceBike,
	b: InvoiceBike,
): number =>
	getBikeDisplayLabel(a).localeCompare(getBikeDisplayLabel(b), undefined, {
		sensitivity: "base",
	});

export const getPartLineDisplayLabel = (
	line: DraftPartLine,
	parts: Part[],
): string => {
	if (line.snapshot_name.trim()) {
		return line.snapshot_name.trim();
	}

	if (line.part_id) {
		const matchedPart = parts.find((part) => part.id === line.part_id);
		if (matchedPart) {
			return matchedPart.description;
		}
	}

	return line.is_custom ? "Custom part" : "Select part...";
};

export const getPartLinePartNumber = (
	line: Pick<DraftPartLine, "part_id" | "snapshot_part_number">,
	parts: Part[],
): string => {
	if (line.snapshot_part_number.trim()) {
		return line.snapshot_part_number.trim();
	}

	if (line.part_id) {
		const matchedPart = parts.find((part) => part.id === line.part_id);
		if (matchedPart?.part_number?.trim()) {
			return matchedPart.part_number.trim();
		}
	}

	return "";
};

const LEGACY_PART_SNAPSHOT_SEPARATOR = " — ";

export const parseLegacyPartSnapshot = (
	snapshotName: string,
): { description: string; partNumber: string } => {
	const trimmed = snapshotName.trim();
	const separatorIndex = trimmed.indexOf(LEGACY_PART_SNAPSHOT_SEPARATOR);
	if (separatorIndex > 0) {
		return {
			partNumber: trimmed.slice(0, separatorIndex).trim(),
			description: trimmed.slice(separatorIndex + LEGACY_PART_SNAPSHOT_SEPARATOR.length).trim(),
		};
	}
	return { description: trimmed, partNumber: "" };
};

export const resolvePartLineFromRecord = (
	line: InvoiceLineItemRecord,
	parts: Part[],
): Pick<
	DraftPartLine,
	"part_id" | "snapshot_name" | "snapshot_part_number" | "is_custom"
> => {
	const partId = line.part_id ?? "";
	const isCustom = !partId;
	const storedPartNumber = line.snapshot_part_number?.trim() ?? "";

	if (storedPartNumber || !line.snapshot_name.includes(LEGACY_PART_SNAPSHOT_SEPARATOR)) {
		if (partId) {
			const matchedPart = parts.find((part) => part.id === partId);
			return {
				part_id: partId,
				snapshot_name: line.snapshot_name.trim() || matchedPart?.description || "",
				snapshot_part_number:
					storedPartNumber || matchedPart?.part_number?.trim() || "",
				is_custom: false,
			};
		}

		return {
			part_id: "",
			snapshot_name: line.snapshot_name.trim(),
			snapshot_part_number: storedPartNumber,
			is_custom: true,
		};
	}

	const legacy = parseLegacyPartSnapshot(line.snapshot_name);
	return {
		part_id: partId,
		snapshot_name: legacy.description,
		snapshot_part_number: legacy.partNumber,
		is_custom: isCustom,
	};
};

export const getInvoiceStatusTagClasses = (
	status: InvoiceRecord["status"],
): string => {
	switch (status) {
		case "paid":
			return "bg-emerald-900/60 text-emerald-300 border border-emerald-700/60";
		case "completed":
			return "bg-blue-900/60 text-blue-300 border border-blue-700/60";
		case "in_progress":
			return "bg-amber-900/60 text-amber-300 border border-amber-700/60";
		case "estimate":
			return "bg-violet-900/60 text-violet-300 border border-violet-700/60";
		case "void":
			return "bg-rose-900/60 text-rose-300 border border-rose-700/60";
		default:
			return "bg-neutral-800 text-neutral-300 border border-neutral-700";
	}
};

export const toStatusLabel = (status: InvoiceRecord["status"]): string =>
	status.replaceAll("_", " ");

export const formatDateTime = (value?: string): string => {
	if (!value) return "N/A";
	return new Date(value).toLocaleString();
};

/** Value for `<input type="datetime-local" />` in local time. */
export const toDatetimeLocalInputValue = (iso?: string | null): string => {
	const date = iso ? new Date(iso) : new Date();
	if (Number.isNaN(date.getTime())) return "";

	const pad = (part: number) => String(part).padStart(2, "0");
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const datetimeLocalValueToIso = (value: string): string | null => {
	const trimmed = value.trim();
	if (!trimmed) return null;

	const date = new Date(trimmed);
	if (Number.isNaN(date.getTime())) return null;

	return date.toISOString();
};

export const openDatetimePicker = (
	input: HTMLInputElement | null | undefined,
): void => {
	if (!input || typeof input.showPicker !== "function") return;
	try {
		input.showPicker();
	} catch {
		// Some browsers block showPicker outside a direct user gesture.
	}
};

export const isInvoiceNumberTaken = (
	invoiceNumber: number,
	invoices: Pick<InvoiceWithRelations, "id" | "invoice_number">[],
	excludeInvoiceId?: string | null,
): boolean =>
	invoices.some(
		(invoice) =>
			invoice.invoice_number === invoiceNumber &&
			invoice.id !== excludeInvoiceId,
	);
