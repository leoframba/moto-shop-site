"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FiPrinter } from "react-icons/fi";
import { toast } from "sonner";
import GaragePhotos from "@/components/account/GaragePhotos";
import { buildInvoicePrintHtml } from "@/components/admin/invoices/buildInvoicePrintHtml";
import {
	calculateLineTotal,
	formatDateTime,
	getInvoiceStatusTagClasses,
	toCurrency,
	toStatusLabel,
} from "@/components/admin/invoices/invoiceHelpers";
import type {
	CustomerInvoiceViewLevel,
	InvoiceBike,
	InvoiceWithRelations,
	ShopSettings,
} from "@/types";
import { authApiRequest } from "@/utils/api";

interface GarageResponse {
	tax_rate: number;
	bikes: InvoiceBike[];
	invoices: InvoiceWithRelations[];
}

interface InvoicePrintResponse {
	invoice: InvoiceWithRelations;
	shop_settings: ShopSettings;
}

const getBikeLabel = (bike: InvoiceBike): string =>
	`${bike.year} ${bike.make} ${bike.model}`.trim();

const getCustomerViewLevel = (
	invoice: InvoiceWithRelations,
): CustomerInvoiceViewLevel => {
	if (invoice.customer_view_level) return invoice.customer_view_level;
	if (invoice.status === "in_progress") return "summary";
	if (invoice.status === "estimate") return "estimate";
	if (invoice.status === "completed" || invoice.status === "paid")
		return "full";
	return "summary";
};

const sumParts = (invoice: InvoiceWithRelations): number =>
	invoice.line_items
		.filter((line) => line.item_type === "part")
		.reduce((total, line) => total + calculateLineTotal(line), 0);

const sumAll = (invoice: InvoiceWithRelations): number =>
	invoice.line_items.reduce(
		(total, line) => total + calculateLineTotal(line),
		0,
	);

export default function GarageTab() {
	const [bikes, setBikes] = useState<InvoiceBike[]>([]);
	const [invoices, setInvoices] = useState<InvoiceWithRelations[]>([]);
	const [taxRate, setTaxRate] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [expandedInvoiceIds, setExpandedInvoiceIds] = useState<string[]>([]);
	const [printingInvoiceId, setPrintingInvoiceId] = useState<string | null>(
		null,
	);

	const fetchGarage = useCallback(async () => {
		setIsLoading(true);
		try {
			const data = await authApiRequest<GarageResponse>("/api/portal/garage", {
				cache: "no-store",
			});
			setBikes(data.bikes ?? []);
			setInvoices(data.invoices ?? []);
			setTaxRate(Number(data.tax_rate ?? 0));
		} catch (error) {
			console.error(error);
			toast.error("Failed to load your garage.");
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		void fetchGarage();
	}, [fetchGarage]);

	const toggleInvoice = (invoiceId: string) => {
		setExpandedInvoiceIds((prev) =>
			prev.includes(invoiceId)
				? prev.filter((id) => id !== invoiceId)
				: [...prev, invoiceId],
		);
	};

	const openPrintPreview = async (invoiceId: string) => {
		setPrintingInvoiceId(invoiceId);
		try {
			const data = await authApiRequest<InvoicePrintResponse>(
				`/api/portal/invoices/${invoiceId}/print`,
				{ cache: "no-store" },
			);
			const printWindow = window.open("", "_blank", "width=960,height=720");
			if (!printWindow) {
				toast.error("Could not open print preview window.");
				return;
			}
			printWindow.document.open();
			printWindow.document.write(
				buildInvoicePrintHtml(
					{ ...data.invoice, line_items: data.invoice.line_items ?? [] },
					data.shop_settings,
				),
			);
			printWindow.document.close();
			printWindow.focus();
		} catch (error) {
			console.error(error);
			toast.error(
				error instanceof Error ? error.message : "Print preview failed.",
			);
		} finally {
			setPrintingInvoiceId(null);
		}
	};

	const lifetimeTotal = useMemo(
		() =>
			invoices.reduce((total, invoice) => {
				const viewLevel = getCustomerViewLevel(invoice);
				if (viewLevel !== "full") return total;
				const subtotal = sumAll(invoice);
				const tax = (sumParts(invoice) * taxRate) / 100;
				return total + subtotal + tax;
			}, 0),
		[invoices, taxRate],
	);

	if (isLoading) {
		return (
			<div className="text-center py-20 text-neutral-500 animate-pulse uppercase tracking-widest font-bold">
				Loading Your Garage...
			</div>
		);
	}

	return (
		<div className="max-w-3xl">
			<header className="mb-8">
				<h2 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tighter mb-2">
					Your <span className="text-red-600">Garage</span>
				</h2>
				<p className="text-neutral-400 text-sm">
					Your bikes and service history with the shop.
				</p>
			</header>

			<section className="mb-8">
				<h3 className="text-sm font-bold uppercase tracking-widest text-neutral-400 mb-3">
					Bikes
				</h3>
				{bikes.length === 0 ? (
					<div className="border border-dashed border-neutral-800 rounded-xl p-6 text-center text-neutral-500 text-sm">
						No bikes on file yet. The shop will add yours when you bring it in.
					</div>
				) : (
					<div className="grid sm:grid-cols-2 gap-3">
						{bikes.map((bike) => (
							<div
								key={bike.id}
								className="bg-neutral-900 border border-neutral-800 rounded-xl p-4"
							>
								<p className="text-white font-bold">{getBikeLabel(bike)}</p>
								<p className="text-xs text-neutral-500 mt-1">
									VIN: {bike.vin || "N/A"}
								</p>
								<p className="text-xs text-neutral-500">
									Plate: {bike.license_plate || "N/A"}
								</p>
							</div>
						))}
					</div>
				)}
			</section>

			<section>
				<div className="flex items-center justify-between mb-3">
					<h3 className="text-sm font-bold uppercase tracking-widest text-neutral-400">
						Service History
					</h3>
					{invoices.length > 0 && (
						<p className="text-xs text-neutral-500">
							Completed total{" "}
							<span className="text-red-500 font-bold">
								{toCurrency(lifetimeTotal)}
							</span>
						</p>
					)}
				</div>

				{invoices.length === 0 ? (
					<div className="border border-dashed border-neutral-800 rounded-xl p-8 text-center text-neutral-500 text-sm">
						No invoices yet. Your completed services will appear here.
					</div>
				) : (
					<div className="space-y-3">
						{invoices.map((invoice) => {
							const viewLevel = getCustomerViewLevel(invoice);
							const canExpand =
								viewLevel === "estimate" || viewLevel === "full";
							const canPrint = viewLevel === "full";
							const isExpanded =
								canExpand && expandedInvoiceIds.includes(invoice.id);
							const subtotal = sumAll(invoice);
							const partsSubtotal = sumParts(invoice);
							const servicesSubtotal = subtotal - partsSubtotal;
							const salesTax = Number(
								((partsSubtotal * taxRate) / 100).toFixed(2),
							);
							const grandTotal = subtotal + salesTax;

							const headerContent = (
								<div className="flex items-start justify-between gap-3">
									<div className="min-w-0">
										<p className="text-white font-bold">
											Invoice #{invoice.invoice_number}
										</p>
										<p className="text-xs text-neutral-500 truncate">
											{invoice.bike
												? getBikeLabel(invoice.bike)
												: "No bike linked"}
										</p>
										<p className="text-xs text-neutral-500">
											{formatDateTime(invoice.created_at)}
										</p>
									</div>
									<div className="flex flex-col items-end gap-1.5 shrink-0">
										<span
											className={`px-2 py-1 rounded uppercase tracking-widest font-bold text-[10px] ${getInvoiceStatusTagClasses(invoice.status)}`}
										>
											{toStatusLabel(invoice.status)}
										</span>
										{viewLevel === "summary" ? (
											<span className="text-xs text-neutral-500 text-right max-w-[10rem]">
												Details available when service is complete
											</span>
										) : (
											<span className="text-red-500 font-bold text-sm">
												{toCurrency(grandTotal)}
											</span>
										)}
										{canExpand && (
											<span className="text-neutral-500 text-xs">
												{isExpanded ? "Hide details ▾" : "View details ▸"}
											</span>
										)}
									</div>
								</div>
							);

							return (
								<div
									key={invoice.id}
									className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden"
								>
									{canExpand ? (
										<button
											type="button"
											onClick={() => toggleInvoice(invoice.id)}
											className="w-full text-left p-4 hover:bg-neutral-800/40 transition-colors"
										>
											{headerContent}
										</button>
									) : (
										<div className="p-4">{headerContent}</div>
									)}

									{isExpanded && (
										<div className="px-4 pb-4">
											<div className="overflow-x-auto rounded border border-neutral-800">
												<table className="w-full text-sm">
													<thead>
														<tr className="bg-neutral-950/60 text-neutral-400">
															<th className="text-left p-2 font-semibold">
																Item
															</th>
															<th className="text-right p-2 font-semibold">
																Qty
															</th>
															<th className="text-right p-2 font-semibold">
																Unit
															</th>
															<th className="text-right p-2 font-semibold">
																Total
															</th>
														</tr>
													</thead>
													<tbody>
														{invoice.line_items.map((line) => (
															<tr
																key={line.id}
																className="border-t border-neutral-800"
															>
																<td className="p-2 text-white">
																	{line.snapshot_name}
																</td>
																<td className="p-2 text-right text-neutral-300">
																	{Number(line.quantity).toFixed(2)}
																</td>
																<td className="p-2 text-right text-neutral-300">
																	{toCurrency(Number(line.unit_price))}
																</td>
																<td className="p-2 text-right text-neutral-200">
																	{toCurrency(calculateLineTotal(line))}
																</td>
															</tr>
														))}
													</tbody>
												</table>
											</div>

											{viewLevel === "full" && invoice.mechanic_notes && (
												<div className="mt-3 text-sm">
													<p className="text-neutral-500 uppercase tracking-widest text-[10px] font-bold mb-1">
														Notes
													</p>
													<p className="text-neutral-300 whitespace-pre-wrap">
														{invoice.mechanic_notes}
													</p>
												</div>
											)}

											<div className="mt-3 ml-auto max-w-xs space-y-1 text-sm">
												<div className="flex justify-between">
													<span className="text-neutral-400">Labor</span>
													<span className="text-neutral-200">
														{toCurrency(servicesSubtotal)}
													</span>
												</div>
												<div className="flex justify-between">
													<span className="text-neutral-400">Parts</span>
													<span className="text-neutral-200">
														{toCurrency(partsSubtotal)}
													</span>
												</div>
												<div className="flex justify-between">
													<span className="text-neutral-400">
														Sales tax · parts ({taxRate.toFixed(3)}%)
													</span>
													<span className="text-neutral-200">
														{toCurrency(salesTax)}
													</span>
												</div>
												<div className="flex justify-between border-t border-neutral-800 pt-1">
													<span className="text-white font-bold uppercase tracking-widest text-xs">
														Total
													</span>
													<span className="text-red-500 font-bold">
														{toCurrency(grandTotal)}
													</span>
												</div>
											</div>

											{canPrint && (
												<div className="mt-4 flex justify-end">
													<button
														type="button"
														onClick={() => void openPrintPreview(invoice.id)}
														disabled={printingInvoiceId === invoice.id}
														className="inline-flex items-center gap-2 rounded bg-neutral-800 px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-neutral-700 disabled:opacity-50"
													>
														<FiPrinter className="h-3.5 w-3.5" />
														{printingInvoiceId === invoice.id
															? "Opening..."
															: "Print"}
													</button>
												</div>
											)}

											{viewLevel === "full" && (
												<GaragePhotos invoiceId={invoice.id} />
											)}
										</div>
									)}
								</div>
							);
						})}
					</div>
				)}
			</section>
		</div>
	);
}
