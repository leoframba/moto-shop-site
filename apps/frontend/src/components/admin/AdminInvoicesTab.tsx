"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import {
	adminLoadingStateClass,
	adminPageSubtitleClass,
	adminPageTitleClass,
} from "@/components/admin/adminUi";
import { InvoiceListSkeleton } from "./invoices/InvoiceListSkeleton";
import { useInvoicesDataContext } from "./invoices/InvoicesDataProvider";
import { useInvoiceBuilder } from "./invoices/useInvoiceBuilder";

const InvoiceBuilderModal = dynamic(
	() =>
		import("./invoices/InvoiceBuilderModal").then((mod) => ({
			default: mod.InvoiceBuilderModal,
		})),
	{ ssr: false },
);

const InvoiceList = dynamic(
	() =>
		import("./invoices/InvoiceList").then((mod) => ({
			default: mod.InvoiceList,
		})),
	{ loading: () => <InvoiceListSkeleton /> },
);

export default function AdminInvoicesTab() {
	const data = useInvoicesDataContext();
	const [autoExpandInvoiceId, setAutoExpandInvoiceId] = useState<string | null>(
		null,
	);

	const builder = useInvoiceBuilder({
		users: data.users,
		bikes: data.bikes,
		services: data.services,
		parts: data.parts,
		existingInvoices: data.invoices,
		shopHourlyRate: data.shopHourlyRate,
		shopHazardousWasteRate: Number(data.shopSettings.hazardous_waste_rate ?? 0),
		onSaved: async (invoiceId) => {
			await data.refetchInvoice(invoiceId);
			setAutoExpandInvoiceId(invoiceId);
		},
	});

	useEffect(() => {
		if (!builder.isOpen) return;
		void data.ensureBuilderDependenciesLoaded();
		void data.refetchUsers();
		void data.refetchBikes();
	}, [
		builder.isOpen,
		data.ensureBuilderDependenciesLoaded,
		data.refetchBikes,
		data.refetchUsers,
	]);

	const builderActionLabel = builder.editingInvoiceId
		? "Resume Edit"
		: "New Invoice";

	return (
		<div className="max-w-5xl mx-auto pb-20">
			<div className="mb-8 flex justify-between items-end">
				<div>
					<h2 className={adminPageTitleClass}>Invoice Builder</h2>
					<p className={adminPageSubtitleClass}>
						Create invoices with linked customer, bike, services, and parts.
					</p>
				</div>
				<button
					type="button"
					onClick={builder.resumeOrOpen}
					className="bg-neutral-800 hover:bg-neutral-700 text-white px-5 py-2 rounded font-bold uppercase tracking-widest text-xs"
				>
					{builderActionLabel}
				</button>
			</div>

			{builder.lastCreatedInvoice && (
				<div className="mb-6 rounded border border-emerald-700/60 bg-emerald-950/20 p-4">
					<p className="text-emerald-300 text-sm font-bold uppercase tracking-widest">
						Created invoice #{builder.lastCreatedInvoice.invoice_number}
					</p>
				</div>
			)}

			{builder.isOpen ? (
				<InvoiceBuilderModal
					builder={builder}
					users={data.users}
					employees={data.employees}
					bikes={data.bikes}
					services={data.services}
					parts={data.parts}
					taxRate={Number(data.shopSettings.tax_rate ?? 0)}
					isBuilderDepsLoading={data.isBuilderDepsLoading}
					onPartCreated={data.addPart}
					onBikeCreated={data.addBike}
					onUserCreated={data.addUser}
				/>
			) : null}

			{data.isInvoicesLoading ? (
				<InvoiceListSkeleton />
			) : (
				<InvoiceList
					invoices={data.invoices}
					users={data.users}
					bikes={data.bikes}
					shopSettings={data.shopSettings}
					setInvoices={data.setInvoices}
					onLoadInvoiceLines={data.refetchInvoice}
					onEnsureStatusesLoaded={data.ensureInvoicesForStatuses}
					onEdit={builder.startEdit}
					onInvoiceDeleted={builder.handleInvoiceDeleted}
					autoExpandInvoiceId={autoExpandInvoiceId}
				/>
			)}
		</div>
	);
}
