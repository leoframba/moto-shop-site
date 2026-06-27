"use client";

import { useEffect, useMemo, useState } from "react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import {
	adminCardHeadingClass,
	adminLoadingStateClass,
	adminPageSubtitleClass,
	adminPageTitleClass,
} from "@/components/admin/adminUi";
import {
	formatDateTime,
	getInvoiceOwnerLabel,
	getInvoiceStatusTagClasses,
	INVOICE_STATUSES,
	openDatetimePicker,
	toCurrency,
	toStatusLabel,
} from "@/components/admin/invoices/invoiceHelpers";
import {
	invoiceDateFieldClass,
	invoiceHintClass,
	invoiceLabelClass,
	invoiceSubheadingClass,
} from "@/components/admin/invoices/invoiceUi";
import { useInvoicesDataContext } from "@/components/admin/invoices/InvoicesDataProvider";
import {
	aggregateLineItemContributions,
	aggregateStatsBoardTotals,
	filterInvoicesForStatsBoard,
	formatStatsDateRangeLabel,
	getDefaultStatsDateRange,
	getInvoiceFinancialBreakdown,
	type StatsBreakdownCategory,
	type StatsLineItemContribution,
} from "@/components/admin/stats/statsBoardHelpers";
import type { InvoiceRecord } from "@/types";

const DEFAULT_STATUS_FILTERS: InvoiceRecord["status"][] = ["paid"];

const BREAKDOWN_CARDS: {
	category: StatsBreakdownCategory;
	label: string;
	accent: string;
	borderActive: string;
}[] = [
	{
		category: "service",
		label: "Services & Labor",
		accent: "text-blue-300",
		borderActive: "border-blue-600/60",
	},
	{
		category: "part",
		label: "Parts & Materials",
		accent: "text-violet-300",
		borderActive: "border-violet-600/60",
	},
	{
		category: "hazardous_waste",
		label: "Hazardous Waste",
		accent: "text-amber-300",
		borderActive: "border-amber-600/60",
	},
];

function StatsContributionPanel({
	title,
	total,
	contributions,
	accentClass,
}: {
	title: string;
	total: number;
	contributions: StatsLineItemContribution[];
	accentClass: string;
}) {
	return (
		<div className="rounded-lg border border-neutral-700/60 bg-neutral-950 p-4">
			<div className="mb-4 flex flex-wrap items-end justify-between gap-2">
				<p className="text-xs font-bold uppercase tracking-widest text-neutral-300">
					{title} breakdown
				</p>
				<p className="text-xs text-neutral-400">
					{contributions.length}{" "}
					{contributions.length === 1 ? "line type" : "line types"}
				</p>
			</div>

			{contributions.length === 0 ? (
				<p className="text-sm text-neutral-400">
					No line items contributed to this total in the selected range.
				</p>
			) : (
				<div className="overflow-x-auto">
					<table className="min-w-full text-left text-sm">
						<thead>
							<tr className="border-b border-neutral-800 text-xs font-bold uppercase tracking-widest text-neutral-400">
								<th className="px-2 py-2">Item</th>
								<th className="px-2 py-2 text-right">Qty</th>
								<th className="px-2 py-2 text-right">Lines</th>
								<th className="px-2 py-2 text-right">Total</th>
								<th className="px-2 py-2 text-right">Share</th>
							</tr>
						</thead>
						<tbody>
							{contributions.map((entry) => {
								const share =
									total > 0 ? ((entry.total / total) * 100).toFixed(1) : "0.0";
								return (
									<tr
										key={entry.key}
										className="border-b border-neutral-800/80 text-neutral-200"
									>
										<td className="max-w-[16rem] truncate px-2 py-2.5 font-medium text-neutral-100">
											{entry.label}
										</td>
										<td className="px-2 py-2.5 text-right text-neutral-300">
											{entry.quantity}
										</td>
										<td className="px-2 py-2.5 text-right text-neutral-400">
											{entry.lineCount}
										</td>
										<td
											className={`px-2 py-2.5 text-right font-semibold ${accentClass}`}
										>
											{toCurrency(entry.total)}
										</td>
										<td className="px-2 py-2.5 text-right text-neutral-400">
											{share}%
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}

export default function AdminStatsBoardTab() {
	const data = useInvoicesDataContext();
	const defaultRange = useMemo(() => getDefaultStatsDateRange(), []);
	const [startDate, setStartDate] = useState(defaultRange.startDate);
	const [endDate, setEndDate] = useState(defaultRange.endDate);
	const [activeStatusFilters, setActiveStatusFilters] =
		useState<InvoiceRecord["status"][]>(DEFAULT_STATUS_FILTERS);
	const [expandedBreakdown, setExpandedBreakdown] =
		useState<StatsBreakdownCategory | null>(null);

	useEffect(() => {
		void data.ensureInvoiceLinesLoaded();
	}, [data.ensureInvoiceLinesLoaded]);

	const taxRate = Number(data.shopSettings.tax_rate ?? 0);
	const dateRangeInvalid = Boolean(startDate && endDate && startDate > endDate);

	const filteredInvoices = useMemo(() => {
		if (dateRangeInvalid || activeStatusFilters.length === 0) return [];
		return filterInvoicesForStatsBoard(data.invoices, {
			startDate,
			endDate,
			statuses: activeStatusFilters,
		}).sort(
			(a, b) =>
				new Date(b.created_at ?? 0).getTime() -
				new Date(a.created_at ?? 0).getTime(),
		);
	}, [
		activeStatusFilters,
		data.invoices,
		dateRangeInvalid,
		endDate,
		startDate,
	]);

	const totals = useMemo(
		() => aggregateStatsBoardTotals(filteredInvoices, taxRate),
		[filteredInvoices, taxRate],
	);

	const serviceContributions = useMemo(
		() =>
			aggregateLineItemContributions(
				filteredInvoices,
				"service",
				data.services,
				data.parts,
			),
		[filteredInvoices, data.services, data.parts],
	);

	const partContributions = useMemo(
		() =>
			aggregateLineItemContributions(
				filteredInvoices,
				"part",
				data.services,
				data.parts,
			),
		[filteredInvoices, data.services, data.parts],
	);

	const wasteContributions = useMemo(
		() =>
			aggregateLineItemContributions(
				filteredInvoices,
				"hazardous_waste",
				data.services,
				data.parts,
			),
		[filteredInvoices, data.services, data.parts],
	);

	const toggleBreakdown = (category: StatsBreakdownCategory) => {
		setExpandedBreakdown((current) => (current === category ? null : category));
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

	if (data.isLoading) {
		return (
			<div className="mx-auto max-w-5xl pb-20">
				<div className={adminLoadingStateClass}>Loading Stats Board...</div>
			</div>
		);
	}

	const breakdownValues: Record<StatsBreakdownCategory, number> = {
		service: totals.servicesSubtotal,
		part: totals.partsSubtotal,
		hazardous_waste: totals.hazardousWasteSubtotal,
	};

	const breakdownContributions: Record<
		StatsBreakdownCategory,
		StatsLineItemContribution[]
	> = {
		service: serviceContributions,
		part: partContributions,
		hazardous_waste: wasteContributions,
	};

	return (
		<div className="mx-auto max-w-5xl pb-20">
			<div className="mb-8">
				<h2 className={adminPageTitleClass}>Stats Board</h2>
				<p className={adminPageSubtitleClass}>
					Financial totals from invoices in a selected date range.
				</p>
			</div>

			<section className="mb-6 rounded-lg border border-neutral-800 bg-neutral-900 p-4 sm:p-5">
				<p className={invoiceSubheadingClass}>Filters</p>
				<div className="mt-4 grid gap-4 md:grid-cols-2">
					<div>
						<label htmlFor="stats-start-date" className={invoiceLabelClass}>
							Start date
						</label>
						<input
							id="stats-start-date"
							type="date"
							value={startDate}
							onChange={(event) => setStartDate(event.target.value)}
							onClick={(event) => openDatetimePicker(event.currentTarget)}
							className={invoiceDateFieldClass}
						/>
					</div>
					<div>
						<label htmlFor="stats-end-date" className={invoiceLabelClass}>
							End date
						</label>
						<input
							id="stats-end-date"
							type="date"
							value={endDate}
							onChange={(event) => setEndDate(event.target.value)}
							onClick={(event) => openDatetimePicker(event.currentTarget)}
							className={invoiceDateFieldClass}
						/>
					</div>
				</div>
				{dateRangeInvalid ? (
					<p className={`${invoiceHintClass} text-rose-300`}>
						Start date must be on or before the end date.
					</p>
				) : (
					<p className={invoiceHintClass}>
						Showing invoices dated{" "}
						{formatStatsDateRangeLabel(startDate, endDate)}.
					</p>
				)}

				<div className="mt-5">
					<p className={`${invoiceLabelClass} mb-2`}>Invoice status</p>
					<div className="flex flex-wrap gap-2">
						{INVOICE_STATUSES.map((status) => {
							const isActive = activeStatusFilters.includes(status);
							return (
								<button
									key={status}
									type="button"
									onClick={() => toggleStatusFilter(status)}
									className={`min-h-9 rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors ${
										isActive
											? getInvoiceStatusTagClasses(status)
											: "border border-neutral-800 bg-neutral-950 text-neutral-300 hover:text-neutral-200"
									}`}
								>
									{toStatusLabel(status)}
								</button>
							);
						})}
					</div>
				</div>
			</section>

			<section className="mb-6 rounded-lg border border-emerald-700/40 bg-emerald-950/20 p-5 sm:p-6">
				<p className="text-xs font-bold uppercase tracking-widest text-emerald-300">
					Grand Total
				</p>
				<p className="mt-2 text-4xl font-bold text-white sm:text-5xl">
					{toCurrency(totals.grandTotal)}
				</p>
				<p className="mt-2 text-sm text-neutral-300">
					{totals.invoiceCount}{" "}
					{totals.invoiceCount === 1 ? "invoice" : "invoices"} in range
				</p>
			</section>

			<section className="mb-6 rounded-lg border border-neutral-800 bg-neutral-900 p-4 sm:p-5">
				<p className={adminCardHeadingClass}>Breakdown</p>
				<p className="mb-4 text-xs text-neutral-400">
					Click a category total to see which items contributed.
				</p>
				<div className="grid gap-4 md:grid-cols-3">
					{BREAKDOWN_CARDS.map((item) => {
						const isExpanded = expandedBreakdown === item.category;
						const value = breakdownValues[item.category];
						return (
							<button
								key={item.category}
								type="button"
								onClick={() => toggleBreakdown(item.category)}
								aria-expanded={isExpanded}
								className={`rounded-lg border bg-neutral-950 p-4 text-left transition-colors hover:bg-neutral-900/80 ${
									isExpanded
										? item.borderActive
										: "border-neutral-700/60 hover:border-neutral-600"
								}`}
							>
								<div className="flex items-start justify-between gap-2">
									<p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
										{item.label}
									</p>
									{isExpanded ? (
										<FiChevronUp
											className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400"
											aria-hidden
										/>
									) : (
										<FiChevronDown
											className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400"
											aria-hidden
										/>
									)}
								</div>
								<p className={`mt-2 text-2xl font-bold ${item.accent}`}>
									{toCurrency(value)}
								</p>
								<p className="mt-2 text-[11px] uppercase tracking-widest text-neutral-500">
									{isExpanded ? "Hide breakdown" : "View breakdown"}
								</p>
							</button>
						);
					})}
				</div>

				{expandedBreakdown ? (
					<div className="mt-4">
						<StatsContributionPanel
							title={
								BREAKDOWN_CARDS.find(
									(item) => item.category === expandedBreakdown,
								)?.label ?? "Category"
							}
							total={breakdownValues[expandedBreakdown]}
							contributions={breakdownContributions[expandedBreakdown]}
							accentClass={
								BREAKDOWN_CARDS.find(
									(item) => item.category === expandedBreakdown,
								)?.accent ?? "text-neutral-100"
							}
						/>
					</div>
				) : null}

				<div className="mt-4 max-w-md space-y-2 rounded-lg border border-neutral-700/60 bg-neutral-950 p-4">
					<div className="flex justify-between text-sm">
						<span className="text-neutral-300">Subtotal</span>
						<span className="font-semibold text-neutral-50">
							{toCurrency(totals.subtotal)}
						</span>
					</div>
					<div className="flex justify-between text-sm">
						<span className="text-neutral-300">
							Sales tax · parts only ({taxRate.toFixed(3)}%)
						</span>
						<span className="font-semibold text-neutral-50">
							{toCurrency(totals.salesTax)}
						</span>
					</div>
					<div className="flex justify-between border-t border-neutral-700 pt-2 text-base">
						<span className="text-xs font-bold uppercase tracking-widest text-neutral-200">
							Grand Total
						</span>
						<span className="font-bold text-emerald-300">
							{toCurrency(totals.grandTotal)}
						</span>
					</div>
				</div>
			</section>

			<section className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 sm:p-5">
				<div className="mb-4 flex flex-wrap items-end justify-between gap-3">
					<p className={invoiceSubheadingClass}>Invoices in range</p>
					<span className="text-xs font-bold uppercase tracking-widest text-neutral-400">
						{filteredInvoices.length}{" "}
						{filteredInvoices.length === 1 ? "invoice" : "invoices"}
					</span>
				</div>

				{filteredInvoices.length === 0 ? (
					<div className="rounded-lg border border-dashed border-neutral-800 p-8 text-center text-sm uppercase tracking-widest text-neutral-400">
						No invoices match the selected date range and status filters.
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="min-w-full text-left text-sm">
							<thead>
								<tr className="border-b border-neutral-800 text-xs font-bold uppercase tracking-widest text-neutral-400">
									<th className="px-3 py-3">Invoice #</th>
									<th className="px-3 py-3">Date</th>
									<th className="px-3 py-3">Status</th>
									<th className="px-3 py-3">Customer</th>
									<th className="px-3 py-3 text-right">Services</th>
									<th className="px-3 py-3 text-right">Parts</th>
									<th className="px-3 py-3 text-right">Waste</th>
									<th className="px-3 py-3 text-right">Total</th>
								</tr>
							</thead>
							<tbody>
								{filteredInvoices.map((invoice) => {
									const breakdown = getInvoiceFinancialBreakdown(
										invoice,
										taxRate,
									);
									return (
										<tr
											key={invoice.id}
											className="border-b border-neutral-800/80 text-neutral-200"
										>
											<td className="px-3 py-3 font-semibold text-white">
												#{invoice.invoice_number}
											</td>
											<td className="px-3 py-3 text-neutral-300">
												{formatDateTime(invoice.created_at)}
											</td>
											<td className="px-3 py-3">
												<span
													className={`inline-flex rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${getInvoiceStatusTagClasses(invoice.status)}`}
												>
													{toStatusLabel(invoice.status)}
												</span>
											</td>
											<td className="max-w-[12rem] truncate px-3 py-3 text-neutral-300">
												{getInvoiceOwnerLabel(invoice)}
											</td>
											<td className="px-3 py-3 text-right text-blue-300">
												{toCurrency(breakdown.servicesSubtotal)}
											</td>
											<td className="px-3 py-3 text-right text-violet-300">
												{toCurrency(breakdown.partsSubtotal)}
											</td>
											<td className="px-3 py-3 text-right text-amber-300">
												{toCurrency(breakdown.hazardousWasteSubtotal)}
											</td>
											<td className="px-3 py-3 text-right font-semibold text-emerald-300">
												{toCurrency(breakdown.grandTotal)}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				)}
			</section>
		</div>
	);
}
