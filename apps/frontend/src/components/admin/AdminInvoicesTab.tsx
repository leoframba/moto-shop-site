"use client";

import { useState } from "react";
import { InvoiceBuilderModal } from "./invoices/InvoiceBuilderModal";
import { InvoiceList } from "./invoices/InvoiceList";
import { useInvoiceBuilder } from "./invoices/useInvoiceBuilder";
import { useInvoicesData } from "./invoices/useInvoicesData";

export default function AdminInvoicesTab() {
	const data = useInvoicesData();
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
			await data.refetch();
			setAutoExpandInvoiceId(invoiceId);
		},
	});

	if (data.isLoading) {
		return (
			<div className="max-w-5xl mx-auto pb-20">
				<div className="text-center py-20 text-neutral-300 animate-pulse uppercase tracking-widest font-bold">
					Loading Invoice Builder...
				</div>
			</div>
		);
	}

	const builderActionLabel = builder.editingInvoiceId
		? "Resume Edit"
		: "New Invoice";

	return (
		<div className="max-w-5xl mx-auto pb-20">
			<div className="mb-8 flex justify-between items-end">
				<div>
					<h2 className="text-3xl font-bold tracking-tight text-white mb-1">
						Invoice Builder
					</h2>
					<p className="text-neutral-300 text-sm">
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

			<InvoiceBuilderModal
				builder={builder}
				users={data.users}
				bikes={data.bikes}
				services={data.services}
				parts={data.parts}
				taxRate={Number(data.shopSettings.tax_rate ?? 0)}
				onPartCreated={data.addPart}
				onBikeCreated={data.addBike}
			/>

			<InvoiceList
				invoices={data.invoices}
				users={data.users}
				bikes={data.bikes}
				shopSettings={data.shopSettings}
				setInvoices={data.setInvoices}
				refetch={data.refetch}
				onEdit={builder.startEdit}
				onInvoiceDeleted={builder.handleInvoiceDeleted}
				autoExpandInvoiceId={autoExpandInvoiceId}
			/>
		</div>
	);
}
