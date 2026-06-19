import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type {
	AdminUser,
	InvoiceBike,
	InvoiceCreatePayload,
	InvoiceRecord,
	InvoiceStatus,
	InvoiceWithRelations,
	LinePricingType,
	Part,
	Service,
} from "@/types";
import { authApiRequest } from "@/utils/api";
import {
	createDraftId,
	type DraftPartLine,
	type DraftServiceLine,
	getUserDisplayName,
} from "./invoiceHelpers";

interface UseInvoiceBuilderArgs {
	users: AdminUser[];
	bikes: InvoiceBike[];
	services: Service[];
	parts: Part[];
	shopHourlyRate: number;
	onSaved: (invoiceId: string) => void | Promise<void>;
}

export function useInvoiceBuilder({
	users,
	bikes,
	services,
	parts,
	shopHourlyRate,
	onSaved,
}: UseInvoiceBuilderArgs) {
	const [isOpen, setIsOpen] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
	const [lastCreatedInvoice, setLastCreatedInvoice] =
		useState<InvoiceRecord | null>(null);

	const [ownerId, setOwnerId] = useState("");
	const [bikeId, setBikeId] = useState("");
	const [status, setStatus] = useState<InvoiceStatus>("draft");
	const [odometerIn, setOdometerIn] = useState("");
	const [odometerOut, setOdometerOut] = useState("");
	const [mechanicNotes, setMechanicNotes] = useState("");

	const [serviceLines, setServiceLines] = useState<DraftServiceLine[]>([]);
	const [partLines, setPartLines] = useState<DraftPartLine[]>([]);

	const [isOwnerPickerOpen, setIsOwnerPickerOpen] = useState(false);
	const [isBikePickerOpen, setIsBikePickerOpen] = useState(false);
	const [servicePickerLineId, setServicePickerLineId] = useState<string | null>(
		null,
	);
	const [partPickerLineId, setPartPickerLineId] = useState<string | null>(null);

	const selectedBike = useMemo(
		() => bikes.find((bike) => bike.id === bikeId) ?? null,
		[bikes, bikeId],
	);

	useEffect(() => {
		if (!selectedBike?.owner_id) return;
		if (!ownerId) {
			setOwnerId(selectedBike.owner_id);
		}
	}, [selectedBike, ownerId]);

	useEffect(() => {
		if (!bikeId) return;
		const bikeStillValid = bikes.some(
			(bike) => bike.id === bikeId && (!ownerId || bike.owner_id === ownerId),
		);
		if (!bikeStillValid) {
			setBikeId("");
		}
	}, [bikeId, bikes, ownerId]);

	const selectedOwner = useMemo(
		() => users.find((user) => user.id === ownerId) ?? null,
		[users, ownerId],
	);

	const customerFields = useMemo(
		() => ({
			firstName: selectedOwner?.first_name ?? "",
			lastName: selectedOwner?.last_name ?? "",
			address: selectedOwner?.address ?? "",
			phone: selectedOwner?.phone_number ?? "",
		}),
		[selectedOwner],
	);

	const bikeFields = useMemo(
		() => ({
			year: selectedBike ? String(selectedBike.year ?? "") : "",
			make: selectedBike?.make ?? "",
			model: selectedBike?.model ?? "",
			license: selectedBike?.license_plate ?? "",
			vin: selectedBike?.vin ?? "",
		}),
		[selectedBike],
	);

	const servicesSubtotal = useMemo(
		() =>
			serviceLines.reduce(
				(sum, line) => sum + line.unit_price * line.quantity,
				0,
			),
		[serviceLines],
	);
	const partsSubtotal = useMemo(
		() =>
			partLines.reduce((sum, line) => sum + line.unit_price * line.quantity, 0),
		[partLines],
	);
	const invoiceTotal = servicesSubtotal + partsSubtotal;

	const isDirty =
		serviceLines.length > 0 ||
		partLines.length > 0 ||
		Boolean(ownerId) ||
		Boolean(bikeId) ||
		Boolean(odometerIn.trim()) ||
		Boolean(odometerOut.trim()) ||
		Boolean(mechanicNotes.trim());

	const resetBuilder = () => {
		setEditingInvoiceId(null);
		setOwnerId("");
		setBikeId("");
		setStatus("draft");
		setOdometerIn("");
		setOdometerOut("");
		setMechanicNotes("");
		setServiceLines([]);
		setPartLines([]);
	};

	const openForNewInvoice = () => {
		if (editingInvoiceId) {
			const shouldDiscardEdit = window.confirm(
				"You have an invoice edit in progress. Discard it and start a new invoice?",
			);
			if (!shouldDiscardEdit) return;
		}
		resetBuilder();
		setIsOpen(true);
	};

	const resumeOrOpen = () => {
		if (editingInvoiceId) {
			setIsOpen(true);
			return;
		}
		openForNewInvoice();
	};

	const discardDraft = () => {
		if (editingInvoiceId) {
			const confirmed = window.confirm("Discard the current invoice edit?");
			if (!confirmed) return;
		}
		resetBuilder();
		setIsOpen(false);
	};

	const close = () => setIsOpen(false);

	const startEdit = (invoice: InvoiceWithRelations) => {
		setEditingInvoiceId(invoice.id);
		setOwnerId(invoice.owner_id ?? "");
		setBikeId(invoice.bike_id ?? "");
		setStatus(invoice.status ?? "draft");
		setOdometerIn(
			invoice.odometer_in !== null && invoice.odometer_in !== undefined
				? String(invoice.odometer_in)
				: "",
		);
		setOdometerOut(
			invoice.odometer_out !== null && invoice.odometer_out !== undefined
				? String(invoice.odometer_out)
				: "",
		);
		setMechanicNotes(invoice.mechanic_notes ?? "");

		const nextServiceLines: DraftServiceLine[] = invoice.line_items
			.filter((line) => line.item_type === "service")
			.map((line) => {
				// Prefer the pricing type stored on the line item (lossless). Fall
				// back to the linked service for legacy rows created before the
				// column existed.
				const matchedService = line.service_id
					? services.find((service) => service.id === line.service_id)
					: undefined;
				const resolvedPricingType =
					line.pricing_type ??
					(matchedService?.pricing_type === "hourly" ? "hourly" : "fixed");
				return {
					id: createDraftId(),
					service_id: line.service_id ?? "",
					snapshot_name: line.snapshot_name,
					is_custom: !line.service_id,
					pricing_type: resolvedPricingType === "hourly" ? "hourly" : "fixed",
					unit_price: Number(line.unit_price),
					quantity: Number(line.quantity),
				};
			});

		const nextPartLines: DraftPartLine[] = invoice.line_items
			.filter((line) => line.item_type === "part")
			.map((line) => ({
				id: createDraftId(),
				part_id: line.part_id ?? "",
				snapshot_name: line.snapshot_name,
				is_custom: !line.part_id,
				unit_price: Number(line.unit_price),
				quantity: Number(line.quantity),
			}));

		setServiceLines(nextServiceLines);
		setPartLines(nextPartLines);
		setIsOpen(true);
	};

	const handleInvoiceDeleted = (invoiceId: string) => {
		if (editingInvoiceId === invoiceId) {
			resetBuilder();
			setIsOpen(false);
		}
	};

	const addServiceLine = () => {
		setServiceLines((prev) => [
			...prev,
			{
				id: createDraftId(),
				service_id: "",
				snapshot_name: "",
				is_custom: false,
				pricing_type: "",
				unit_price: 0,
				quantity: 1,
			},
		]);
	};

	const addPartLine = () => {
		setPartLines((prev) => [
			...prev,
			{
				id: createDraftId(),
				part_id: "",
				snapshot_name: "",
				is_custom: false,
				unit_price: 0,
				quantity: 1,
			},
		]);
	};

	const updateServiceLine = (
		lineId: string,
		field: keyof DraftServiceLine,
		value: string | number | boolean,
	) => {
		setServiceLines((prev) =>
			prev.map((line) =>
				line.id === lineId ? { ...line, [field]: value } : line,
			),
		);
	};

	const updatePartLine = (
		lineId: string,
		field: keyof DraftPartLine,
		value: string | number | boolean,
	) => {
		setPartLines((prev) =>
			prev.map((line) =>
				line.id === lineId ? { ...line, [field]: value } : line,
			),
		);
	};

	const updateServicePricingType = (
		lineId: string,
		nextPricingType: "fixed" | "hourly",
	) => {
		setServiceLines((prev) =>
			prev.map((line) => {
				if (line.id !== lineId) return line;
				if (nextPricingType === "hourly") {
					return {
						...line,
						pricing_type: "hourly",
						unit_price: Number(shopHourlyRate),
						quantity: Math.max(0.1, line.quantity || 1),
					};
				}
				return {
					...line,
					pricing_type: "fixed",
					quantity: Math.max(1, line.quantity || 1),
				};
			}),
		);
	};

	const removeServiceLine = (lineId: string) => {
		setServiceLines((prev) => prev.filter((line) => line.id !== lineId));
	};

	const removePartLine = (lineId: string) => {
		setPartLines((prev) => prev.filter((line) => line.id !== lineId));
	};

	const selectService = (lineId: string, serviceId: string) => {
		const selectedService = services.find(
			(service) => service.id === serviceId,
		);
		if (!selectedService) {
			updateServiceLine(lineId, "service_id", "");
			updateServiceLine(lineId, "snapshot_name", "");
			updateServiceLine(lineId, "is_custom", false);
			updateServiceLine(lineId, "pricing_type", "");
			updateServiceLine(lineId, "unit_price", 0);
			updateServiceLine(lineId, "quantity", 1);
			return;
		}

		const pricingType = selectedService.pricing_type ?? "hourly";
		const defaultHours = Number(selectedService.estimated_hours ?? 1);
		const defaultFixedPrice = Number(
			selectedService.fixed_price ?? selectedService.calculated_price ?? 0,
		);

		setServiceLines((prev) =>
			prev.map((line) =>
				line.id === lineId
					? {
							...line,
							service_id: serviceId,
							snapshot_name: selectedService.name,
							is_custom: false,
							pricing_type: pricingType,
							unit_price:
								pricingType === "hourly"
									? Number(shopHourlyRate)
									: defaultFixedPrice,
							quantity: pricingType === "hourly" ? defaultHours : 1,
						}
					: line,
			),
		);
		setServicePickerLineId(null);
	};

	const selectPart = (lineId: string, partId: string, partOverride?: Part) => {
		const duplicatePartAlreadySelected = partLines.some(
			(line) => line.id !== lineId && line.part_id === partId,
		);
		if (duplicatePartAlreadySelected) {
			toast.warning("That part is already added to this invoice.");
			return;
		}

		const selectedPart =
			partOverride ?? parts.find((part) => part.id === partId);
		if (!selectedPart) {
			updatePartLine(lineId, "part_id", "");
			updatePartLine(lineId, "snapshot_name", "");
			updatePartLine(lineId, "is_custom", false);
			updatePartLine(lineId, "unit_price", 0);
			return;
		}

		setPartLines((prev) =>
			prev.map((line) =>
				line.id === lineId
					? {
							...line,
							part_id: partId,
							snapshot_name: selectedPart.description,
							is_custom: false,
							unit_price: Number(selectedPart.base_price),
						}
					: line,
			),
		);
		setPartPickerLineId(null);
	};

	const confirmCustomService = (lineId: string, customName: string) => {
		const trimmed = customName.trim();
		if (!trimmed) {
			toast.warning("Enter a custom service name first.");
			return false;
		}
		setServiceLines((prev) =>
			prev.map((line) =>
				line.id === lineId
					? {
							...line,
							service_id: "",
							snapshot_name: trimmed,
							is_custom: true,
							pricing_type: "fixed",
							unit_price: 0,
							quantity: 1,
						}
					: line,
			),
		);
		setServicePickerLineId(null);
		return true;
	};

	const confirmCustomPart = (lineId: string, customName: string) => {
		const trimmed = customName.trim();
		if (!trimmed) {
			toast.warning("Enter a custom part name first.");
			return false;
		}
		setPartLines((prev) =>
			prev.map((line) =>
				line.id === lineId
					? {
							...line,
							part_id: "",
							snapshot_name: trimmed,
							is_custom: true,
							unit_price: 0,
							quantity: 1,
						}
					: line,
			),
		);
		setPartPickerLineId(null);
		return true;
	};

	const save = async () => {
		if (serviceLines.length === 0 && partLines.length === 0) {
			toast.warning("Add at least one service or part line item.");
			return;
		}

		for (const line of serviceLines) {
			if (!line.snapshot_name.trim()) {
				toast.warning("Every service line needs a name.");
				return;
			}
			if (line.unit_price < 0 || line.quantity <= 0) {
				toast.warning(
					`"${line.snapshot_name.trim()}" needs a positive amount.`,
				);
				return;
			}
			if (line.unit_price * line.quantity <= 0) {
				toast.warning(
					`"${line.snapshot_name.trim()}" total must be greater than $0.`,
				);
				return;
			}
		}
		for (const line of partLines) {
			if (!line.snapshot_name.trim()) {
				toast.warning("Every part line needs a name.");
				return;
			}
			if (line.unit_price < 0 || line.quantity <= 0) {
				toast.warning(
					`"${line.snapshot_name.trim()}" needs a positive amount.`,
				);
				return;
			}
			if (line.unit_price * line.quantity <= 0) {
				toast.warning(
					`"${line.snapshot_name.trim()}" total must be greater than $0.`,
				);
				return;
			}
		}

		const selectedPartIds = partLines
			.map((line) => line.part_id)
			.filter((partId): partId is string => Boolean(partId));
		if (new Set(selectedPartIds).size !== selectedPartIds.length) {
			toast.warning("Duplicate parts are not allowed on the same invoice.");
			return;
		}

		const payload: InvoiceCreatePayload = {
			owner_id: ownerId || null,
			bike_id: bikeId || null,
			status,
			odometer_in: odometerIn.trim() ? parseInt(odometerIn, 10) : null,
			odometer_out: odometerOut.trim() ? parseInt(odometerOut, 10) : null,
			mechanic_notes: mechanicNotes.trim() || null,
			line_items: [
				...serviceLines.map((line) => ({
					item_type: "service" as const,
					service_id: line.service_id || null,
					snapshot_name: line.snapshot_name.trim(),
					pricing_type: (line.pricing_type === "hourly"
						? "hourly"
						: "fixed") as LinePricingType,
					unit_price: line.unit_price,
					quantity: line.quantity,
				})),
				...partLines.map((line) => ({
					item_type: "part" as const,
					part_id: line.part_id || null,
					snapshot_name: line.snapshot_name.trim(),
					unit_price: line.unit_price,
					quantity: line.quantity,
				})),
			],
		};

		setIsSaving(true);
		try {
			const response = await authApiRequest<{ invoice: InvoiceRecord }>(
				editingInvoiceId
					? `/api/admin/invoices/${editingInvoiceId}`
					: "/api/admin/invoices",
				{
					method: editingInvoiceId ? "PATCH" : "POST",
					body: JSON.stringify(payload),
				},
			);

			if (editingInvoiceId) {
				toast.success(`Invoice #${response.invoice.invoice_number} updated.`);
				setLastCreatedInvoice(null);
			} else {
				setLastCreatedInvoice(response.invoice);
				toast.success(`Invoice #${response.invoice.invoice_number} created.`);
			}
			resetBuilder();
			setIsOpen(false);
			await onSaved(response.invoice.id);
		} catch (error) {
			console.error(error);
			toast.error(
				editingInvoiceId
					? "Failed to update invoice."
					: "Failed to create invoice.",
			);
		} finally {
			setIsSaving(false);
		}
	};

	const ownerLabel = ownerId
		? getUserDisplayName(
				users.find((user) => user.id === ownerId) ?? {
					id: "",
					email: "Unknown owner",
				},
			)
		: "Select owner";

	return {
		// open / mode state
		isOpen,
		isSaving,
		editingInvoiceId,
		lastCreatedInvoice,
		// links & info
		ownerId,
		bikeId,
		status,
		ownerLabel,
		odometerIn,
		odometerOut,
		mechanicNotes,
		isDirty,
		setOwnerId,
		setBikeId,
		setStatus,
		setOdometerIn,
		setOdometerOut,
		setMechanicNotes,
		customerFields,
		bikeFields,
		// line items
		serviceLines,
		partLines,
		servicesSubtotal,
		partsSubtotal,
		invoiceTotal,
		addServiceLine,
		addPartLine,
		updateServiceLine,
		updatePartLine,
		updateServicePricingType,
		removeServiceLine,
		removePartLine,
		selectService,
		selectPart,
		confirmCustomService,
		confirmCustomPart,
		// picker open state
		isOwnerPickerOpen,
		isBikePickerOpen,
		servicePickerLineId,
		partPickerLineId,
		setIsOwnerPickerOpen,
		setIsBikePickerOpen,
		setServicePickerLineId,
		setPartPickerLineId,
		// lifecycle
		openForNewInvoice,
		resumeOrOpen,
		discardDraft,
		close,
		startEdit,
		handleInvoiceDeleted,
		resetBuilder,
		save,
	};
}

export type InvoiceBuilder = ReturnType<typeof useInvoiceBuilder>;
