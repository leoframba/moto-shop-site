"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { toast } from "sonner";
import type { InvoiceRecord, LaborSummary, ShopSettings } from "@/types";
import { authApiRequest } from "@/utils/api";
import {
	getLaborDateRange,
	getPayPeriodOptions,
	type LaborViewRange,
	type PayPeriodOption,
} from "@/utils/payPeriodUtils";
import {
	getInvoiceStatusTagClasses,
	INVOICE_STATUSES,
	LABOR_DEFAULT_STATUS_FILTERS,
	toStatusLabel,
} from "./invoices/invoiceHelpers";
import { invoiceLabelClass } from "./invoices/invoiceUi";

const RANGE_OPTIONS: { value: LaborViewRange; label: string }[] = [
	{ value: "pay_period", label: "Current Pay Period" },
	{ value: "weekly", label: "Weekly" },
	{ value: "monthly", label: "Monthly" },
];

const mechanicRowKey = (employeeId: string | null) =>
	employeeId ?? "shop-labor";

export default function AdminLaborTab() {
	const [range, setRange] = useState<LaborViewRange>("pay_period");
	const [payPeriodOffset, setPayPeriodOffset] = useState(0);
	const [payPeriodOptions, setPayPeriodOptions] = useState<PayPeriodOption[]>(
		[],
	);
	const [activeStatusFilters, setActiveStatusFilters] = useState<
		InvoiceRecord["status"][]
	>(LABOR_DEFAULT_STATUS_FILTERS);
	const [expandedMechanicKey, setExpandedMechanicKey] = useState<string | null>(
		null,
	);
	const [summary, setSummary] = useState<LaborSummary | null>(null);
	const [rangeLabel, setRangeLabel] = useState("");
	const [timeZone, setTimeZone] = useState("America/Los_Angeles");
	const [isLoading, setIsLoading] = useState(true);

	const loadSummary = useCallback(async () => {
		if (activeStatusFilters.length === 0) {
			setSummary({ rows: [], total_hours: 0 });
			setIsLoading(false);
			return;
		}

		setIsLoading(true);
		try {
			const settings = await authApiRequest<ShopSettings>(
				"/api/admin/shop-settings",
				{ cache: "no-store" },
			);
			const payPeriodLength = settings.pay_period_length ?? "bi-weekly";
			const anchorDate = settings.anchor_date ?? "2026-06-17";
			const shopTimeZone = settings.timezone ?? "America/Los_Angeles";
			const activeRange = getLaborDateRange(
				range,
				payPeriodLength,
				anchorDate,
				shopTimeZone,
				new Date(),
				range === "pay_period" ? payPeriodOffset : 0,
			);
			const statusQuery = activeStatusFilters
				.map((status) => `statuses=${encodeURIComponent(status)}`)
				.join("&");
			const laborSummary = await authApiRequest<LaborSummary>(
				`/api/admin/labor/summary?start_at=${encodeURIComponent(activeRange.startIso)}&end_at=${encodeURIComponent(activeRange.endIso)}&${statusQuery}`,
				{ cache: "no-store" },
			);
			setSummary(laborSummary);
			setRangeLabel(activeRange.label);
			setTimeZone(shopTimeZone);
			const periodOptions = getPayPeriodOptions(
				payPeriodLength,
				anchorDate,
				shopTimeZone,
			);
			setPayPeriodOptions(periodOptions);
			setPayPeriodOffset((current) =>
				periodOptions.some((option) => option.offset === current) ? current : 0,
			);
		} catch (error) {
			console.error(error);
			toast.error("Failed to load labor summary.");
		} finally {
			setIsLoading(false);
		}
	}, [activeStatusFilters, payPeriodOffset, range]);

	useEffect(() => {
		void loadSummary();
	}, [loadSummary]);

	const toggleStatusFilter = (status: InvoiceRecord["status"]) => {
		setActiveStatusFilters((prev) => {
			if (prev.includes(status)) {
				if (prev.length === 1) return prev;
				return prev.filter((current) => current !== status);
			}
			return [...prev, status];
		});
	};

	const toggleMechanicRow = (key: string) => {
		setExpandedMechanicKey((current) => (current === key ? null : key));
	};

	return (
		<div className="mx-auto max-w-5xl pb-20">
			<div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h2 className="mb-1 text-3xl font-bold tracking-tight text-white">
						Labor
					</h2>
					<p className="text-sm text-neutral-300">
						Service labor by mechanic for the selected period. Fixed-rate
						services are converted to hours using the shop hourly rate, rounded
						up to the nearest tenth.
					</p>
				</div>
				<div className="flex flex-col gap-3 sm:flex-row sm:items-end">
					<div>
						<label
							htmlFor="labor-range"
							className="mb-1 block text-xs font-bold uppercase tracking-widest text-neutral-400"
						>
							View Range
						</label>
						<select
							id="labor-range"
							value={range}
							onChange={(e) => {
								const nextRange = e.target.value as LaborViewRange;
								setRange(nextRange);
								if (nextRange !== "pay_period") {
									setPayPeriodOffset(0);
								}
							}}
							className="min-w-52 rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
						>
							{RANGE_OPTIONS.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</div>
					{range === "pay_period" && payPeriodOptions.length > 0 && (
						<div>
							<label
								htmlFor="labor-pay-period"
								className="mb-1 block text-xs font-bold uppercase tracking-widest text-neutral-400"
							>
								Pay Period
							</label>
							<select
								id="labor-pay-period"
								value={payPeriodOffset}
								onChange={(e) =>
									setPayPeriodOffset(Number(e.target.value))
								}
								className="min-w-64 rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
							>
								{payPeriodOptions.map((option) => (
									<option key={option.offset} value={option.offset}>
										{option.label}
									</option>
								))}
							</select>
						</div>
					)}
				</div>
			</div>

			<div className="mb-4 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-neutral-300">
				<span className="font-semibold text-white">{rangeLabel || "—"}</span>
				<span className="mx-2 text-neutral-600">·</span>
				<span>{timeZone}</span>
			</div>

			<div className="mb-6 rounded-lg border border-neutral-800 bg-neutral-900 p-4 sm:p-5">
				<p className={`${invoiceLabelClass} mb-2`}>Invoice status</p>
				<div className="flex flex-wrap gap-2">
					{INVOICE_STATUSES.map((status) => {
						const isActive = activeStatusFilters.includes(status);
						return (
							<button
								key={status}
								type="button"
								onClick={() => toggleStatusFilter(status)}
								className={`min-h-9 rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors ${isActive
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

			{isLoading ? (
				<div className="py-20 text-center text-sm font-bold uppercase tracking-widest text-neutral-300 animate-pulse">
					Loading labor summary...
				</div>
			) : activeStatusFilters.length === 0 ? (
				<div className="rounded-xl border border-dashed border-neutral-700 bg-neutral-900/50 p-10 text-center text-neutral-400">
					Select at least one invoice status to view labor.
				</div>
			) : !summary || summary.rows.length === 0 ? (
				<div className="rounded-xl border border-dashed border-neutral-700 bg-neutral-900/50 p-10 text-center text-neutral-400">
					No service labor recorded for the selected filters.
				</div>
			) : (
				<div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900">
					<table className="w-full border-collapse">
						<thead>
							<tr className="border-b border-neutral-800 bg-neutral-950/80 text-left text-xs font-bold uppercase tracking-widest text-neutral-400">
								<th className="w-10 px-2 py-3" aria-hidden />
								<th className="px-4 py-3">Mechanic</th>
								<th className="px-4 py-3 text-right">Hours</th>
							</tr>
						</thead>
						<tbody>
							{summary.rows.map((row) => {
								const rowKey = mechanicRowKey(row.employee_id);
								const isExpanded = expandedMechanicKey === rowKey;
								return (
									<Fragment key={rowKey}>
										<tr className="border-b border-neutral-800/80">
											<td className="px-2 py-3">
												<button
													type="button"
													onClick={() => toggleMechanicRow(rowKey)}
													className="inline-flex min-h-8 min-w-8 items-center justify-center rounded border border-neutral-700 text-neutral-300 transition-colors hover:border-neutral-500 hover:text-white"
													aria-expanded={isExpanded}
													aria-label={`${isExpanded ? "Collapse" : "Expand"} ${row.employee_name} breakdown`}
												>
													{isExpanded ? (
														<FiChevronUp className="h-4 w-4" aria-hidden />
													) : (
														<FiChevronDown className="h-4 w-4" aria-hidden />
													)}
												</button>
											</td>
											<td className="px-4 py-3 font-semibold text-white">
												{row.employee_name}
											</td>
											<td className="px-4 py-3 text-right font-mono text-emerald-300">
												{row.hours.toFixed(1)}
											</td>
										</tr>
										{isExpanded && (
											<tr className="border-b border-neutral-800/80 bg-neutral-950/40">
												<td colSpan={3} className="px-4 py-4">
													{row.breakdown.length === 0 ? (
														<p className="text-sm text-neutral-400">
															No service lines in this period.
														</p>
													) : (
														<table className="w-full border-collapse text-sm">
															<thead>
																<tr className="text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500">
																	<th className="pb-2 pr-4">Invoice #</th>
																	<th className="pb-2 pr-4">Service</th>
																	<th className="pb-2 pr-4">Pricing</th>
																	<th className="pb-2 text-right">Hours</th>
																</tr>
															</thead>
															<tbody>
																{row.breakdown.map((entry) => (
																	<tr
																		key={entry.id}
																		className="border-t border-neutral-800/60 text-neutral-300"
																	>
																		<td className="py-2 pr-4 font-mono text-white">
																			#{entry.invoice_number ?? "—"}
																		</td>
																		<td className="py-2 pr-4">
																			{entry.snapshot_name}
																		</td>
																		<td className="py-2 pr-4 capitalize">
																			{entry.pricing_type}
																		</td>
																		<td className="py-2 text-right font-mono text-emerald-300">
																			{entry.hours.toFixed(1)}
																		</td>
																	</tr>
																))}
															</tbody>
														</table>
													)}
												</td>
											</tr>
										)}
									</Fragment>
								);
							})}
						</tbody>
						<tfoot>
							<tr className="bg-neutral-950/60">
								<td className="px-2 py-3" aria-hidden />
								<td className="px-4 py-3 text-sm font-bold uppercase tracking-widest text-neutral-300">
									Total
								</td>
								<td className="px-4 py-3 text-right font-mono text-base font-bold text-white">
									{summary.total_hours.toFixed(1)}
								</td>
							</tr>
						</tfoot>
					</table>
				</div>
			)}
		</div>
	);
}
