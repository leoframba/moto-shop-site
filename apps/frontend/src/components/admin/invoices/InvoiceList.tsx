"use client";

import { useEffect, useMemo, useState } from "react";
import { FiEdit2, FiPrinter, FiTrash2 } from "react-icons/fi";
import { toast } from "sonner";
import type {
	InvoiceRecord,
	InvoiceWithRelations,
	ShopSettings,
} from "@/types";
import { authApiRequest } from "@/utils/api";
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
		<section className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 mt-6">
			<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
				<h3 className="text-sm font-bold uppercase tracking-widest text-neutral-300">
					Created Invoices
				</h3>
				<div className="w-full md:w-auto flex flex-col gap-2">
					<input
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						placeholder="Search invoice #, owner, bike, VIN, plate"
						className="w-full md:w-[380px] bg-neutral-950 border border-neutral-700 rounded p-2.5 text-sm text-white focus:border-emerald-500 outline-none"
					/>
					<div className="flex flex-wrap gap-2">
						{INVOICE_STATUSES.map((status) => {
							const isActive = activeStatusFilters.includes(status);
							return (
								<button
									key={status}
									type="button"
									onClick={() => toggleStatusFilter(status)}
									className={`px-2 py-1 rounded text-[11px] uppercase tracking-widest font-bold transition-colors ${
										isActive
											? getInvoiceStatusTagClasses(status)
											: "bg-neutral-900 border border-neutral-800 text-neutral-500"
									}`}
								>
									{toStatusLabel(status)}
								</button>
							);
						})}
					</div>
				</div>
			</div>

			{filteredInvoices.length === 0 ? (
				<div className="border border-dashed border-neutral-800 rounded p-8 text-center text-neutral-500 text-sm uppercase tracking-widest">
					No invoices match your search.
				</div>
			) : (
				<div className="space-y-3 mb-4">
					{filteredInvoices.map((invoice) => {
						const isExpanded = expandedInvoiceIds.includes(invoice.id);
						const invoiceLinesCount = invoice.line_items.length;
						const statusLabel = toStatusLabel(invoice.status);

						return (
							<div
								key={invoice.id}
								className="bg-neutral-950 border border-neutral-800 rounded"
							>
								<div className="p-3 md:p-3.5 hover:bg-neutral-900/60 transition-colors rounded">
									<div className="flex items-start gap-2">
										<button
											type="button"
											onClick={() => toggleExpandedInvoice(invoice.id)}
											className="flex-1 text-left min-w-0"
										>
											<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-3">
												<div className="min-w-0">
													<p className="text-white font-bold text-sm md:text-base">
														Invoice #{invoice.invoice_number}
													</p>
													<p className="text-xs md:text-sm text-neutral-400 truncate">
														{getInvoiceOwnerLabel(invoice)}
													</p>
													<p className="text-xs text-neutral-500 truncate">
														{getInvoiceBikeLabel(invoice)}
													</p>
												</div>
												<div className="flex flex-wrap items-center gap-2 text-xs">
													<span className="text-neutral-400">
														{invoiceLinesCount}{" "}
														{invoiceLinesCount === 1 ? "item" : "items"}
													</span>
													<span className="text-emerald-400 font-semibold">
														{toCurrency(calculateInvoiceTotal(invoice))}
													</span>
													<span className="text-neutral-500 font-bold text-sm">
														{isExpanded ? "▾" : "▸"}
													</span>
												</div>
											</div>
										</button>
										<button
											type="button"
											onClick={() =>
												setStatusPickerInvoiceId((prev) =>
													prev === invoice.id ? null : invoice.id,
												)
											}
											className={`px-2 py-1 rounded uppercase tracking-widest font-bold text-xs ${getInvoiceStatusTagClasses(invoice.status)}`}
										>
											{statusLabel}
										</button>
									</div>
								</div>

								{statusPickerInvoiceId === invoice.id && (
									<div className="px-3 pb-2 md:px-3.5">
										<div className="flex flex-wrap gap-2">
											{INVOICE_STATUSES.map((statusOption) => (
												<button
													key={statusOption}
													type="button"
													disabled={statusUpdatingInvoiceId === invoice.id}
													onClick={() =>
														void updateInvoiceStatus(invoice.id, statusOption)
													}
													className={`px-2 py-1 rounded text-[11px] uppercase tracking-widest font-bold transition-colors ${
														invoice.status === statusOption
															? getInvoiceStatusTagClasses(statusOption)
															: "bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white"
													}`}
												>
													{toStatusLabel(statusOption)}
												</button>
											))}
										</div>
									</div>
								)}

								{isExpanded && (
									<div className="px-3 pb-3 md:px-3.5 md:pb-3.5">
										<div className="flex flex-wrap gap-2 mb-3">
											<button
												type="button"
												onClick={() => onEdit(invoice)}
												className="bg-blue-800/80 hover:bg-blue-700 px-3 py-2 rounded text-xs uppercase tracking-widest font-bold inline-flex items-center gap-2"
											>
												<FiEdit2 className="h-4 w-4" /> Edit
											</button>
											<button
												type="button"
												onClick={() => openPrintPreview(invoice)}
												className="bg-emerald-700 hover:bg-emerald-600 px-3 py-2 rounded text-xs uppercase tracking-widest font-bold inline-flex items-center gap-2"
											>
												<FiPrinter className="h-4 w-4" /> Print Preview
											</button>
											<button
												type="button"
												onClick={() => void handleDeleteInvoice(invoice)}
												disabled={deletingInvoiceId === invoice.id}
												className="bg-red-900/70 hover:bg-red-800/80 disabled:bg-neutral-700 px-3 py-2 rounded text-xs uppercase tracking-widest font-bold inline-flex items-center gap-2"
											>
												<FiTrash2 className="h-4 w-4" />
												{deletingInvoiceId === invoice.id
													? "Deleting..."
													: "Delete"}
											</button>
										</div>
										<div className="border border-neutral-800 rounded p-4 bg-black/20">
											<div className="grid md:grid-cols-2 gap-3 text-sm mb-4">
												<p className="text-neutral-400">
													<span className="text-neutral-500">Created:</span>{" "}
													{formatDateTime(invoice.created_at)}
												</p>
												<p className="text-neutral-400">
													<span className="text-neutral-500">Status:</span>{" "}
													{toStatusLabel(invoice.status)}
												</p>
												<p className="text-neutral-400">
													<span className="text-neutral-500">Owner:</span>{" "}
													{getInvoiceOwnerLabel(invoice)}
												</p>
												<p className="text-neutral-400">
													<span className="text-neutral-500">Bike:</span>{" "}
													{getInvoiceBikeLabel(invoice)}
												</p>
											</div>

											<div className="overflow-x-auto">
												<table className="w-full text-sm border border-neutral-800">
													<thead>
														<tr className="bg-neutral-900">
															<th className="text-left p-2 border-b border-neutral-800">
																Type
															</th>
															<th className="text-left p-2 border-b border-neutral-800">
																Item
															</th>
															<th className="text-right p-2 border-b border-neutral-800">
																Qty
															</th>
															<th className="text-right p-2 border-b border-neutral-800">
																Unit
															</th>
															<th className="text-right p-2 border-b border-neutral-800">
																Total
															</th>
														</tr>
													</thead>
													<tbody>
														{invoice.line_items.map((line) => (
															<tr
																key={line.id}
																className="border-b border-neutral-900"
															>
																<td className="p-2 uppercase text-neutral-400">
																	{line.item_type}
																</td>
																<td className="p-2 text-white">
																	{line.snapshot_name}
																</td>
																<td className="p-2 text-right text-neutral-300">
																	{Number(line.quantity).toFixed(2)}
																</td>
																<td className="p-2 text-right text-neutral-300">
																	{toCurrency(Number(line.unit_price))}
																</td>
																<td className="p-2 text-right text-emerald-400">
																	{toCurrency(calculateLineTotal(line))}
																</td>
															</tr>
														))}
													</tbody>
												</table>
											</div>

											<div className="mt-4 text-right">
												<p className="text-sm text-neutral-400">
													Invoice Total{" "}
													<span className="text-emerald-400 font-bold">
														{toCurrency(calculateInvoiceTotal(invoice))}
													</span>
												</p>
											</div>

											<InvoicePhotosManager invoiceId={invoice.id} />
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
