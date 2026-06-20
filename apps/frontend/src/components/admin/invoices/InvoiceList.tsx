"use client";

import { useEffect, useMemo, useState } from "react";
import {
	FiChevronDown,
	FiChevronRight,
	FiEdit2,
	FiPrinter,
	FiTrash2,
} from "react-icons/fi";
import { toast } from "sonner";
import type {
	InvoiceRecord,
	InvoiceWithRelations,
	ShopSettings,
} from "@/types";
import { authApiRequest } from "@/utils/api";
import VoiceRecorder from "../voice_notes/VoiceRecorder";
import { buildInvoicePrintHtml } from "./buildInvoicePrintHtml";
import { InvoicePhotosManager } from "./InvoicePhotosManager";
import {
	calculateInvoiceTotal,
	calculateLineTotal,
	formatDateTime,
	getInvoiceBikeLabel,
	getInvoiceOwnerLabel,
	getInvoiceStatusTagClasses,
	INVOICE_STATUSES,
	toCurrency,
	toStatusLabel,
} from "./invoiceHelpers";
import {
	invoiceAccordionSectionClass,
	invoiceActionButtonClass,
	invoiceFieldInputClass,
	invoiceSubheadingClass,
} from "./invoiceUi";

interface VoiceNoteApiResponse {
	transcript: string;
	summaryBullets: string[];
	mechanicNotesBlock: string;
}

interface InvoiceListProps {
	invoices: InvoiceWithRelations[];
	shopSettings: ShopSettings;
	setInvoices: React.Dispatch<React.SetStateAction<InvoiceWithRelations[]>>;
	refetch: () => Promise<void>;
	onEdit: (invoice: InvoiceWithRelations) => void;
	onInvoiceDeleted: (invoiceId: string) => void;
	autoExpandInvoiceId: string | null;
}

export function InvoiceList({
	invoices,
	shopSettings,
	setInvoices,
	refetch,
	onEdit,
	onInvoiceDeleted,
	autoExpandInvoiceId,
}: InvoiceListProps) {
	const [expandedInvoiceIds, setExpandedInvoiceIds] = useState<string[]>([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [activeStatusFilters, setActiveStatusFilters] =
		useState<InvoiceRecord["status"][]>(INVOICE_STATUSES);
	const [statusPickerInvoiceId, setStatusPickerInvoiceId] = useState<
		string | null
	>(null);
	const [statusUpdatingInvoiceId, setStatusUpdatingInvoiceId] = useState<
		string | null
	>(null);
	const [deletingInvoiceId, setDeletingInvoiceId] = useState<string | null>(
		null,
	);
	const [mechanicNotesDrafts, setMechanicNotesDrafts] = useState<
		Record<string, string>
	>({});
	const [processingVoiceNoteInvoiceId, setProcessingVoiceNoteInvoiceId] =
		useState<string | null>(null);
	const [savingMechanicNotesInvoiceId, setSavingMechanicNotesInvoiceId] =
		useState<string | null>(null);

	useEffect(() => {
		setMechanicNotesDrafts((prev) => {
			const next = { ...prev };
			for (const invoice of invoices) {
				const serverNotes = invoice.mechanic_notes ?? "";
				if (!(invoice.id in next)) {
					next[invoice.id] = serverNotes;
				} else if (!prev[invoice.id]?.trim() && serverNotes) {
					next[invoice.id] = serverNotes;
				}
			}
			return next;
		});
	}, [invoices]);

	useEffect(() => {
		if (!autoExpandInvoiceId) return;
		setExpandedInvoiceIds((prev) =>
			prev.includes(autoExpandInvoiceId)
				? prev
				: [autoExpandInvoiceId, ...prev],
		);
	}, [autoExpandInvoiceId]);

	const toggleExpandedInvoice = (invoiceId: string) => {
		setExpandedInvoiceIds((prev) =>
			prev.includes(invoiceId)
				? prev.filter((existingId) => existingId !== invoiceId)
				: [...prev, invoiceId],
		);
	};

	const toggleStatusFilter = (status: InvoiceRecord["status"]) => {
		setActiveStatusFilters((prev) => {
			if (prev.includes(status)) {
				if (prev.length === 1) return prev;
				return prev.filter((current) => current !== status);
			}
			return [...prev, status];
		});
	};

	const updateInvoiceStatus = async (
		invoiceId: string,
		status: InvoiceRecord["status"],
	) => {
		setStatusUpdatingInvoiceId(invoiceId);
		try {
			await authApiRequest<InvoiceRecord>(
				`/api/admin/invoices/${invoiceId}/status`,
				{
					method: "PATCH",
					body: JSON.stringify({ status }),
				},
			);
			setInvoices((prev) =>
				prev.map((invoice) =>
					invoice.id === invoiceId ? { ...invoice, status } : invoice,
				),
			);
			toast.success(`Invoice marked as ${toStatusLabel(status)}.`);
			setStatusPickerInvoiceId(null);
		} catch (error) {
			console.error(error);
			toast.error("Failed to update invoice status.");
		} finally {
			setStatusUpdatingInvoiceId(null);
		}
	};

	const handleDeleteInvoice = async (invoice: InvoiceWithRelations) => {
		const confirmed = window.confirm(
			`Delete invoice #${invoice.invoice_number}? This cannot be undone.`,
		);
		if (!confirmed) return;

		setDeletingInvoiceId(invoice.id);
		try {
			await authApiRequest<{ message: string }>(
				`/api/admin/invoices/${invoice.id}`,
				{ method: "DELETE" },
			);
			toast.success(`Invoice #${invoice.invoice_number} deleted.`);
			onInvoiceDeleted(invoice.id);
			setExpandedInvoiceIds((prev) =>
				prev.filter((existingId) => existingId !== invoice.id),
			);
			await refetch();
		} catch (error) {
			console.error(error);
			toast.error("Failed to delete invoice.");
		} finally {
			setDeletingInvoiceId(null);
		}
	};

	const saveMechanicNotes = async (
		invoiceId: string,
		notes: string,
		options?: { silent?: boolean },
	) => {
		setSavingMechanicNotesInvoiceId(invoiceId);
		try {
			const updated = await authApiRequest<InvoiceRecord>(
				`/api/admin/invoices/${invoiceId}/mechanic-notes`,
				{
					method: "PATCH",
					body: JSON.stringify({ mechanic_notes: notes.trim() || null }),
				},
			);
			const savedNotes = updated.mechanic_notes ?? notes;
			setMechanicNotesDrafts((prev) => ({
				...prev,
				[invoiceId]: savedNotes,
			}));
			setInvoices((prev) =>
				prev.map((invoice) =>
					invoice.id === invoiceId
						? { ...invoice, mechanic_notes: savedNotes || null }
						: invoice,
				),
			);
			if (!options?.silent) {
				toast.success("Mechanic notes saved.");
			}
		} catch (error) {
			console.error(error);
			toast.error("Failed to save mechanic notes.");
			throw error;
		} finally {
			setSavingMechanicNotesInvoiceId(null);
		}
	};

	const handleVoiceRecordingComplete = async (
		invoice: InvoiceWithRelations,
		base64Audio: string,
		mimeType: string,
	) => {
		setProcessingVoiceNoteInvoiceId(invoice.id);
		const processingToast = toast.loading("Summarizing voice note…");

		try {
			const result = await authApiRequest<VoiceNoteApiResponse>(
				`/api/admin/invoices/${invoice.id}/voice-note`,
				{
					method: "POST",
					body: JSON.stringify({
						audioBase64: base64Audio,
						mimeType,
					}),
				},
			);

			const existingNotes =
				mechanicNotesDrafts[invoice.id] ?? invoice.mechanic_notes ?? "";
			const trimmedExisting = existingNotes.trim();
			const mergedNotes = trimmedExisting
				? `${trimmedExisting}\n\n${result.mechanicNotesBlock}`
				: result.mechanicNotesBlock;

			setMechanicNotesDrafts((prev) => ({
				...prev,
				[invoice.id]: mergedNotes,
			}));

			await saveMechanicNotes(invoice.id, mergedNotes, { silent: true });
			toast.success("Voice note summarized and saved.", {
				id: processingToast,
			});
		} catch (error) {
			console.error(error);
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to process voice note.",
				{ id: processingToast },
			);
		} finally {
			setProcessingVoiceNoteInvoiceId(null);
		}
	};

	const openPrintPreview = (invoice: InvoiceWithRelations) => {
		try {
			const printWindow = window.open("", "_blank", "width=960,height=720");
			if (!printWindow) {
				toast.error("Could not open print preview window.");
				return;
			}
			const invoiceForPrint: InvoiceWithRelations = {
				...invoice,
				line_items: invoice.line_items ?? [],
			};
			printWindow.document.open();
			printWindow.document.write(
				buildInvoicePrintHtml(invoiceForPrint, shopSettings),
			);
			printWindow.document.close();
			printWindow.focus();
		} catch (error) {
			console.error("Print preview error:", error);
			toast.error("Print preview failed to render.");
		}
	};

	const filteredInvoices = useMemo(() => {
		const query = searchTerm.trim().toLowerCase();
		const statusFiltered = invoices.filter((invoice) =>
			activeStatusFilters.includes(invoice.status),
		);
		if (!query) return statusFiltered;

		return statusFiltered.filter((invoice) => {
			const ownerText = getInvoiceOwnerLabel(invoice).toLowerCase();
			const bikeText = getInvoiceBikeLabel(invoice).toLowerCase();
			const vinText = (invoice.bike?.vin ?? "").toLowerCase();
			const plateText = (invoice.bike?.license_plate ?? "").toLowerCase();
			const invoiceNumberText = String(invoice.invoice_number);

			return (
				invoiceNumberText.includes(query) ||
				ownerText.includes(query) ||
				bikeText.includes(query) ||
				vinText.includes(query) ||
				plateText.includes(query)
			);
		});
	}, [activeStatusFilters, invoices, searchTerm]);

	return (
		<section className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 sm:p-5 mt-6">
			<div className="flex flex-col gap-4 mb-5">
				<input
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					placeholder="Search invoice #, owner, bike, VIN, plate"
					className={`${invoiceFieldInputClass} md:max-w-md`}
				/>
				<div className="flex flex-wrap gap-2">
					{INVOICE_STATUSES.map((status) => {
						const isActive = activeStatusFilters.includes(status);
						return (
							<button
								key={status}
								type="button"
								onClick={() => toggleStatusFilter(status)}
								className={`min-h-9 px-3 py-1.5 rounded-md text-xs uppercase tracking-widest font-bold transition-colors ${
									isActive
										? getInvoiceStatusTagClasses(status)
										: "bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-neutral-300"
								}`}
							>
								{toStatusLabel(status)}
							</button>
						);
					})}
				</div>
			</div>

			{filteredInvoices.length === 0 ? (
				<div className="border border-dashed border-neutral-800 rounded-lg p-8 sm:p-10 text-center text-neutral-300 text-sm uppercase tracking-widest">
					No invoices match your search.
				</div>
			) : (
				<div className="space-y-3 sm:space-y-4">
					{filteredInvoices.map((invoice) => {
						const isExpanded = expandedInvoiceIds.includes(invoice.id);
						const invoiceLinesCount = invoice.line_items.length;
						const statusLabel = toStatusLabel(invoice.status);

						return (
							<div
								key={invoice.id}
								className="overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950"
							>
								<div className="p-4 transition-colors sm:p-5 hover:bg-neutral-900/40">
									<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
										<button
											type="button"
											onClick={() => toggleExpandedInvoice(invoice.id)}
											className="flex min-w-0 flex-1 items-start gap-3 text-left"
											aria-expanded={isExpanded}
										>
											<span className="mt-0.5 shrink-0 text-neutral-300">
												{isExpanded ? (
													<FiChevronDown className="h-5 w-5" aria-hidden />
												) : (
													<FiChevronRight className="h-5 w-5" aria-hidden />
												)}
											</span>
											<div className="min-w-0 flex-1 space-y-1">
												<div className="flex flex-wrap items-center gap-x-3 gap-y-1">
													<p className="text-base font-bold text-white sm:text-lg">
														Invoice #{invoice.invoice_number}
													</p>
													<span className="text-sm font-semibold text-emerald-400">
														{toCurrency(calculateInvoiceTotal(invoice))}
													</span>
												</div>
												<p className="truncate text-sm text-neutral-300">
													{getInvoiceOwnerLabel(invoice)}
												</p>
												<p className="truncate text-xs text-neutral-300 sm:text-sm">
													{getInvoiceBikeLabel(invoice)}
												</p>
												<p className="text-xs text-neutral-300">
													{invoiceLinesCount}{" "}
													{invoiceLinesCount === 1 ? "item" : "items"}
												</p>
											</div>
										</button>
										<button
											type="button"
											onClick={() =>
												setStatusPickerInvoiceId((prev) =>
													prev === invoice.id ? null : invoice.id,
												)
											}
											className={`min-h-10 shrink-0 self-start rounded-md px-3 py-2 text-xs font-bold uppercase tracking-widest ${getInvoiceStatusTagClasses(invoice.status)}`}
										>
											{statusLabel}
										</button>
									</div>
								</div>

								{statusPickerInvoiceId === invoice.id && (
									<div className="border-t border-neutral-800 px-4 pb-4 sm:px-5 sm:pb-5">
										<div className={`${invoiceAccordionSectionClass} mt-4`}>
											<p className={invoiceSubheadingClass}>Update Status</p>
											<div className="flex flex-wrap gap-2">
												{INVOICE_STATUSES.map((statusOption) => (
													<button
														key={statusOption}
														type="button"
														disabled={statusUpdatingInvoiceId === invoice.id}
														onClick={() =>
															void updateInvoiceStatus(invoice.id, statusOption)
														}
														className={`min-h-9 rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors ${
															invoice.status === statusOption
																? getInvoiceStatusTagClasses(statusOption)
																: "border border-neutral-800 bg-neutral-950 text-neutral-300 hover:text-white"
														}`}
													>
														{toStatusLabel(statusOption)}
													</button>
												))}
											</div>
										</div>
									</div>
								)}

								{isExpanded && (
									<div className="space-y-4 border-t border-neutral-800 px-4 pb-4 pt-4 sm:space-y-5 sm:px-5 sm:pb-5 sm:pt-5">
										<div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
											<button
												type="button"
												onClick={() => onEdit(invoice)}
												className={`${invoiceActionButtonClass} bg-blue-800/80 hover:bg-blue-700`}
											>
												<FiEdit2 className="h-4 w-4" aria-hidden /> Edit
											</button>
											<button
												type="button"
												onClick={() => openPrintPreview(invoice)}
												className={`${invoiceActionButtonClass} bg-emerald-700 hover:bg-emerald-600`}
											>
												<FiPrinter className="h-4 w-4" aria-hidden /> Print
												Preview
											</button>
											<button
												type="button"
												onClick={() => void handleDeleteInvoice(invoice)}
												disabled={deletingInvoiceId === invoice.id}
												className={`${invoiceActionButtonClass} bg-red-900/70 hover:bg-red-800/80 disabled:cursor-not-allowed disabled:bg-neutral-800 disabled:opacity-60`}
											>
												<FiTrash2 className="h-4 w-4" aria-hidden />
												{deletingInvoiceId === invoice.id
													? "Deleting..."
													: "Delete"}
											</button>
										</div>

										<div className={invoiceAccordionSectionClass}>
											<p className={invoiceSubheadingClass}>Invoice Details</p>
											<dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
												<div className="space-y-1">
													<dt className="text-xs uppercase tracking-wider text-neutral-300">
														Created
													</dt>
													<dd className="text-neutral-200">
														{formatDateTime(invoice.created_at)}
													</dd>
												</div>
												<div className="space-y-1">
													<dt className="text-xs uppercase tracking-wider text-neutral-300">
														Status
													</dt>
													<dd className="text-neutral-200">
														{toStatusLabel(invoice.status)}
													</dd>
												</div>
												<div className="space-y-1">
													<dt className="text-xs uppercase tracking-wider text-neutral-300">
														Owner
													</dt>
													<dd className="break-words text-neutral-200">
														{getInvoiceOwnerLabel(invoice)}
													</dd>
												</div>
												<div className="space-y-1">
													<dt className="text-xs uppercase tracking-wider text-neutral-300">
														Bike
													</dt>
													<dd className="break-words text-neutral-200">
														{getInvoiceBikeLabel(invoice)}
													</dd>
												</div>
											</dl>
										</div>

										<div className={invoiceAccordionSectionClass}>
											<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
												<p className={invoiceSubheadingClass}>Line Items</p>
												<p className="text-sm text-neutral-300">
													Total{" "}
													<span className="font-bold text-emerald-400">
														{toCurrency(calculateInvoiceTotal(invoice))}
													</span>
												</p>
											</div>

											{invoice.line_items.length === 0 ? (
												<p className="text-sm text-neutral-300">
													No line items on this invoice.
												</p>
											) : (
												<>
													<div className="space-y-2 md:hidden">
														{invoice.line_items.map((line) => (
															<div
																key={line.id}
																className="rounded-md border border-neutral-800 bg-neutral-950 p-3"
															>
																<div className="mb-2 flex items-start justify-between gap-2">
																	<p className="font-medium text-white">
																		{line.snapshot_name}
																	</p>
																	<span className="shrink-0 rounded bg-neutral-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-300">
																		{line.item_type}
																	</span>
																</div>
																<div className="grid grid-cols-3 gap-2 text-xs">
																	<div>
																		<p className="text-neutral-300">Qty</p>
																		<p className="text-neutral-200">
																			{Number(line.quantity).toFixed(2)}
																		</p>
																	</div>
																	<div>
																		<p className="text-neutral-300">Unit</p>
																		<p className="text-neutral-200">
																			{toCurrency(Number(line.unit_price))}
																		</p>
																	</div>
																	<div className="text-right">
																		<p className="text-neutral-300">Total</p>
																		<p className="font-semibold text-emerald-400">
																			{toCurrency(calculateLineTotal(line))}
																		</p>
																	</div>
																</div>
															</div>
														))}
													</div>

													<div className="hidden overflow-x-auto md:block">
														<table className="w-full min-w-[520px] text-sm">
															<thead>
																<tr className="border-b border-neutral-800 text-left">
																	<th className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-neutral-300">
																		Type
																	</th>
																	<th className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-neutral-300">
																		Item
																	</th>
																	<th className="px-3 py-2 text-right text-xs font-bold uppercase tracking-wider text-neutral-300">
																		Qty
																	</th>
																	<th className="px-3 py-2 text-right text-xs font-bold uppercase tracking-wider text-neutral-300">
																		Unit
																	</th>
																	<th className="px-3 py-2 text-right text-xs font-bold uppercase tracking-wider text-neutral-300">
																		Total
																	</th>
																</tr>
															</thead>
															<tbody>
																{invoice.line_items.map((line) => (
																	<tr
																		key={line.id}
																		className="border-b border-neutral-800/70 last:border-b-0"
																	>
																		<td className="px-3 py-2.5 uppercase text-neutral-300">
																			{line.item_type}
																		</td>
																		<td className="px-3 py-2.5 text-white">
																			{line.snapshot_name}
																		</td>
																		<td className="px-3 py-2.5 text-right text-neutral-300">
																			{Number(line.quantity).toFixed(2)}
																		</td>
																		<td className="px-3 py-2.5 text-right text-neutral-300">
																			{toCurrency(Number(line.unit_price))}
																		</td>
																		<td className="px-3 py-2.5 text-right font-medium text-emerald-400">
																			{toCurrency(calculateLineTotal(line))}
																		</td>
																	</tr>
																))}
															</tbody>
														</table>
													</div>
												</>
											)}
										</div>

										<div
											className={`${invoiceAccordionSectionClass} space-y-4`}
										>
											<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
												<p className={invoiceSubheadingClass}>Mechanic Notes</p>
												<VoiceRecorder
													className={`${invoiceActionButtonClass} bg-neutral-800 hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50`}
													disabled={
														processingVoiceNoteInvoiceId === invoice.id ||
														savingMechanicNotesInvoiceId === invoice.id
													}
													buttonLabel={
														processingVoiceNoteInvoiceId === invoice.id
															? "Processing…"
															: "Record Voice Note"
													}
													onRecordingComplete={(base64Audio, mimeType) => {
														void handleVoiceRecordingComplete(
															invoice,
															base64Audio,
															mimeType,
														);
													}}
												/>
											</div>
											{processingVoiceNoteInvoiceId === invoice.id && (
												<p className="text-xs text-emerald-400">
													Gemini is transcribing and summarizing your note…
												</p>
											)}
											<div className="space-y-2">
												<label
													htmlFor={`mechanic-notes-${invoice.id}`}
													className="sr-only"
												>
													Mechanic notes for invoice #{invoice.invoice_number}
												</label>
												<textarea
													id={`mechanic-notes-${invoice.id}`}
													value={mechanicNotesDrafts[invoice.id] ?? ""}
													onChange={(event) =>
														setMechanicNotesDrafts((prev) => ({
															...prev,
															[invoice.id]: event.target.value,
														}))
													}
													placeholder="Add internal shop notes, diagnostics, or follow-ups…"
													rows={5}
													className={`${invoiceFieldInputClass} min-h-28 resize-y`}
												/>
												<button
													type="button"
													onClick={() =>
														void saveMechanicNotes(
															invoice.id,
															mechanicNotesDrafts[invoice.id] ?? "",
														)
													}
													disabled={
														savingMechanicNotesInvoiceId === invoice.id ||
														processingVoiceNoteInvoiceId === invoice.id
													}
													className={`${invoiceActionButtonClass} bg-neutral-800 hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50`}
												>
													{savingMechanicNotesInvoiceId === invoice.id
														? "Saving…"
														: "Save Notes"}
												</button>
											</div>
										</div>

										<div className={invoiceAccordionSectionClass}>
											<InvoicePhotosManager invoiceId={invoice.id} embedded />
										</div>
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}
		</section>
	);
}
