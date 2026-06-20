"use client";

import { useEffect } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import type {
	AdminUser,
	InvoiceBike,
	InvoiceStatus,
	Part,
	Service,
} from "@/types";
import {
	BikePickerModal,
	OwnerPickerModal,
	PartPickerModal,
	ServicePickerModal,
} from "./InvoicePickers";
import {
	getBikeDisplayLabel,
	HAZARDOUS_WASTE_LINE_NAME,
	INVOICE_STATUSES,
	parseNumberInput,
	toCurrency,
	toStatusLabel,
} from "./invoiceHelpers";
import type { InvoiceBuilder } from "./useInvoiceBuilder";

interface InvoiceBuilderModalProps {
	builder: InvoiceBuilder;
	users: AdminUser[];
	bikes: InvoiceBike[];
	services: Service[];
	parts: Part[];
	taxRate: number;
	onPartCreated: (part: Part) => void;
	onBikeCreated: (bike: InvoiceBike) => void;
}

const inputClasses =
	"w-full bg-neutral-900 border border-neutral-700 rounded p-3 text-white focus:border-emerald-500 outline-none";
const readOnlyInputClasses =
	"w-full bg-neutral-800 border border-neutral-700 rounded p-2.5 text-white";
const lineInputClasses =
	"w-full bg-neutral-800 border border-neutral-700 rounded p-2.5 text-white text-sm";

export function InvoiceBuilderModal({
	builder,
	users,
	bikes,
	services,
	parts,
	taxRate,
	onPartCreated,
	onBikeCreated,
}: InvoiceBuilderModalProps) {
	const shouldGuardUnload = builder.isOpen && builder.isDirty;

	useEffect(() => {
		if (!shouldGuardUnload) return;
		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			event.preventDefault();
			event.returnValue = "";
		};
		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => window.removeEventListener("beforeunload", handleBeforeUnload);
	}, [shouldGuardUnload]);

	if (!builder.isOpen) return null;

	const selectedBike = bikes.find((bike) => bike.id === builder.bikeId);
	const subtotal = builder.invoiceTotal;
	// Labor/services are not taxable — sales tax applies to parts only.
	const salesTax = Number(((builder.partsSubtotal * taxRate) / 100).toFixed(2));
	const grandTotal = subtotal + salesTax;

	return (
		<>
			<div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm p-4">
				<div className="max-w-6xl mx-auto h-full">
					<div className="h-full bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden flex flex-col">
						<div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
							<h3 className="text-sm font-bold uppercase tracking-widest text-neutral-300">
								{builder.editingInvoiceId ? "Edit Invoice" : "Create Invoice"}
							</h3>
							<div className="flex items-center gap-2">
								<button
									type="button"
									onClick={() => {
										if (builder.editingInvoiceId) {
											builder.discardDraft();
											return;
										}
										builder.resetBuilder();
									}}
									className="bg-neutral-800 hover:bg-neutral-700 px-3 py-2 rounded text-xs uppercase tracking-widest font-bold"
								>
									{builder.editingInvoiceId ? "Discard Edit" : "Reset Draft"}
								</button>
								<button
									type="button"
									onClick={builder.close}
									className="bg-neutral-800 hover:bg-neutral-700 px-3 py-2 rounded text-xs uppercase tracking-widest font-bold"
								>
									Close
								</button>
							</div>
						</div>

						<div className="flex-1 overflow-y-auto p-5">
							<div className="space-y-6">
								<div className="bg-neutral-950 border border-neutral-800 rounded-lg p-5">
									<h4 className="text-sm font-bold uppercase tracking-widest text-neutral-300 mb-4">
										Links & Info
									</h4>
									<div className="grid md:grid-cols-2 gap-4 mb-4">
										<div>
											<label
												htmlFor="invoice-owner"
												className="text-xs text-neutral-400 block mb-1"
											>
												Owner
											</label>
											<div className="flex gap-2">
												<button
													id="invoice-owner"
													type="button"
													onClick={() => builder.setIsOwnerPickerOpen(true)}
													className="flex-1 text-left bg-neutral-900 border border-neutral-700 rounded p-3 text-white hover:border-emerald-500 transition-colors"
												>
													{builder.ownerLabel}
												</button>
												<button
													type="button"
													onClick={() => builder.setOwnerId("")}
													className="bg-neutral-800 hover:bg-neutral-700 px-3 rounded text-xs font-bold uppercase tracking-widest"
												>
													Clear
												</button>
											</div>
											<p className="text-xs text-neutral-500 mt-1">
												Open modal to search by name, email, or phone.
											</p>
										</div>
										<div>
											<label
												htmlFor="invoice-bike"
												className="text-xs text-neutral-400 block mb-1"
											>
												Bike
											</label>
											<div className="flex gap-2">
												<button
													id="invoice-bike"
													type="button"
													onClick={() => builder.setIsBikePickerOpen(true)}
													className="flex-1 text-left bg-neutral-900 border border-neutral-700 rounded p-3 text-white hover:border-emerald-500 transition-colors"
												>
													{builder.bikeId && selectedBike
														? getBikeDisplayLabel(selectedBike)
														: "Select bike"}
												</button>
												<button
													type="button"
													onClick={() => builder.setBikeId("")}
													className="bg-neutral-800 hover:bg-neutral-700 px-3 rounded text-xs font-bold uppercase tracking-widest"
												>
													Clear
												</button>
											</div>
											<p className="text-xs text-neutral-500 mt-1">
												Open modal to search by bike details, VIN, plate, or
												owner.
											</p>
										</div>
									</div>

									<div className="grid md:grid-cols-2 gap-4 mb-4">
										<div className="bg-neutral-900 border border-neutral-800 rounded p-4">
											<p className="text-xs text-neutral-400 uppercase tracking-widest mb-1">
												Customer Data
											</p>
											{!builder.hasLinkedOwner ? (
												<p className="text-xs text-neutral-500 mb-3">
													No portal account linked — enter details for the
													printed invoice.
												</p>
											) : (
												<p className="text-xs text-neutral-500 mb-3">
													Pulled from linked owner account.
												</p>
											)}
											<div className="grid grid-cols-2 gap-3">
												<div>
													<label
														htmlFor="invoice-customer-first-name"
														className="text-xs text-neutral-400 block mb-1"
													>
														First Name
													</label>
													<input
														id="invoice-customer-first-name"
														value={builder.customerFields.firstName}
														readOnly={builder.hasLinkedOwner}
														onChange={(e) =>
															builder.updateCustomerField(
																"firstName",
																e.target.value,
															)
														}
														className={
															builder.hasLinkedOwner
																? readOnlyInputClasses
																: inputClasses
														}
													/>
												</div>
												<div>
													<label
														htmlFor="invoice-customer-last-name"
														className="text-xs text-neutral-400 block mb-1"
													>
														Last Name
													</label>
													<input
														id="invoice-customer-last-name"
														value={builder.customerFields.lastName}
														readOnly={builder.hasLinkedOwner}
														onChange={(e) =>
															builder.updateCustomerField(
																"lastName",
																e.target.value,
															)
														}
														className={
															builder.hasLinkedOwner
																? readOnlyInputClasses
																: inputClasses
														}
													/>
												</div>
												<div className="col-span-2">
													<label
														htmlFor="invoice-customer-email"
														className="text-xs text-neutral-400 block mb-1"
													>
														Email
													</label>
													<input
														id="invoice-customer-email"
														type="email"
														value={builder.customerFields.email}
														readOnly={builder.hasLinkedOwner}
														onChange={(e) =>
															builder.updateCustomerField(
																"email",
																e.target.value,
															)
														}
														placeholder="Optional"
														className={
															builder.hasLinkedOwner
																? readOnlyInputClasses
																: inputClasses
														}
													/>
												</div>
												<div className="col-span-2">
													<label
														htmlFor="invoice-customer-address"
														className="text-xs text-neutral-400 block mb-1"
													>
														Address
													</label>
													<input
														id="invoice-customer-address"
														value={builder.customerFields.address}
														readOnly={builder.hasLinkedOwner}
														onChange={(e) =>
															builder.updateCustomerField(
																"address",
																e.target.value,
															)
														}
														placeholder="Optional"
														className={
															builder.hasLinkedOwner
																? readOnlyInputClasses
																: inputClasses
														}
													/>
												</div>
												<div className="col-span-2">
													<label
														htmlFor="invoice-customer-phone"
														className="text-xs text-neutral-400 block mb-1"
													>
														Phone Number
													</label>
													<input
														id="invoice-customer-phone"
														value={builder.customerFields.phone}
														readOnly={builder.hasLinkedOwner}
														onChange={(e) =>
															builder.updateCustomerField(
																"phone",
																e.target.value,
															)
														}
														placeholder="Optional"
														className={
															builder.hasLinkedOwner
																? readOnlyInputClasses
																: inputClasses
														}
													/>
												</div>
											</div>
										</div>

										<div className="bg-neutral-900 border border-neutral-800 rounded p-4">
											<p className="text-xs text-neutral-400 uppercase tracking-widest mb-3">
												Bike Data
											</p>
											<div className="grid grid-cols-2 gap-3">
												<div>
													<label
														htmlFor="invoice-bike-year"
														className="text-xs text-neutral-400 block mb-1"
													>
														Year
													</label>
													<input
														id="invoice-bike-year"
														value={builder.bikeFields.year}
														readOnly
														className={readOnlyInputClasses}
													/>
												</div>
												<div>
													<label
														htmlFor="invoice-bike-make"
														className="text-xs text-neutral-400 block mb-1"
													>
														Make
													</label>
													<input
														id="invoice-bike-make"
														value={builder.bikeFields.make}
														readOnly
														className={readOnlyInputClasses}
													/>
												</div>
												<div>
													<label
														htmlFor="invoice-bike-model"
														className="text-xs text-neutral-400 block mb-1"
													>
														Model
													</label>
													<input
														id="invoice-bike-model"
														value={builder.bikeFields.model}
														readOnly
														className={readOnlyInputClasses}
													/>
												</div>
												<div>
													<label
														htmlFor="invoice-bike-license"
														className="text-xs text-neutral-400 block mb-1"
													>
														License
													</label>
													<input
														id="invoice-bike-license"
														value={builder.bikeFields.license}
														readOnly
														className={readOnlyInputClasses}
													/>
												</div>
												<div className="col-span-2">
													<label
														htmlFor="invoice-bike-vin"
														className="text-xs text-neutral-400 block mb-1"
													>
														VIN
													</label>
													<input
														id="invoice-bike-vin"
														value={builder.bikeFields.vin}
														readOnly
														className={readOnlyInputClasses}
													/>
												</div>
											</div>
										</div>
									</div>
									<div className="grid md:grid-cols-3 gap-4 mb-4">
										<div>
											<label
												htmlFor="invoice-status"
												className="text-xs text-neutral-400 block mb-1"
											>
												Status
											</label>
											<select
												id="invoice-status"
												value={builder.status}
												onChange={(e) =>
													builder.setStatus(e.target.value as InvoiceStatus)
												}
												className={`${inputClasses} capitalize`}
											>
												{INVOICE_STATUSES.map((statusOption) => (
													<option key={statusOption} value={statusOption}>
														{toStatusLabel(statusOption)}
													</option>
												))}
											</select>
										</div>
										<div>
											<label
												htmlFor="odometer-in"
												className="text-xs text-neutral-400 block mb-1"
											>
												Odometer In
											</label>
											<input
												id="odometer-in"
												type="number"
												min={0}
												value={builder.odometerIn}
												onChange={(e) => builder.setOdometerIn(e.target.value)}
												className={inputClasses}
											/>
										</div>
										<div>
											<label
												htmlFor="odometer-out"
												className="text-xs text-neutral-400 block mb-1"
											>
												Odometer Out
											</label>
											<input
												id="odometer-out"
												type="number"
												min={0}
												value={builder.odometerOut}
												onChange={(e) => builder.setOdometerOut(e.target.value)}
												className={inputClasses}
											/>
										</div>
									</div>
									<div>
										<label
											htmlFor="mechanic-notes"
											className="text-xs text-neutral-400 block mb-1"
										>
											Mechanic Notes
										</label>
										<textarea
											id="mechanic-notes"
											value={builder.mechanicNotes}
											onChange={(e) => builder.setMechanicNotes(e.target.value)}
											className="w-full h-24 bg-neutral-900 border border-neutral-700 rounded p-3 text-white focus:border-emerald-500 outline-none"
										/>
									</div>
								</div>

								<section className="bg-neutral-950 border border-neutral-800 rounded-lg p-5">
									<div className="flex justify-between items-center mb-4">
										<h4 className="text-sm font-bold uppercase tracking-widest text-neutral-300">
											{HAZARDOUS_WASTE_LINE_NAME}
										</h4>
										<label className="inline-flex items-center gap-2 text-sm text-neutral-300 cursor-pointer">
											<input
												type="checkbox"
												checked={builder.hazardousWasteEnabled}
												onChange={(e) =>
													builder.toggleHazardousWaste(e.target.checked)
												}
												className="h-4 w-4 rounded border-neutral-600 bg-neutral-800 text-emerald-500 focus:ring-emerald-500"
											/>
											Include on invoice
										</label>
									</div>
									{builder.hazardousWasteEnabled ? (
										<div className="grid md:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end bg-neutral-900 border border-neutral-800 rounded p-3">
											<div>
												<p className="text-xs text-neutral-400 block mb-1">
													Description
												</p>
												<p className="text-sm text-white py-2.5">
													{HAZARDOUS_WASTE_LINE_NAME}
												</p>
											</div>
											<div>
												<label
													htmlFor="hazardous-waste-quantity"
													className="text-xs text-neutral-400 block mb-1"
												>
													Qty
												</label>
												<input
													id="hazardous-waste-quantity"
													type="number"
													min={1}
													step={1}
													value={builder.hazardousWasteQuantity}
													onChange={(e) =>
														builder.setHazardousWasteQuantity(
															Math.max(1, parseInt(e.target.value, 10) || 1),
														)
													}
													className={lineInputClasses}
												/>
											</div>
											<div>
												<label
													htmlFor="hazardous-waste-rate"
													className="text-xs text-neutral-400 block mb-1"
												>
													Unit Price
												</label>
												<input
													id="hazardous-waste-rate"
													type="number"
													min={0}
													step={0.01}
													value={builder.hazardousWasteUnitPrice}
													onChange={(e) =>
														builder.setHazardousWasteUnitPrice(
															parseNumberInput(e.target.value),
														)
													}
													className={lineInputClasses}
												/>
											</div>
											<p className="text-sm text-emerald-400 font-semibold pb-2">
												{toCurrency(builder.hazardousWasteSubtotal)}
											</p>
										</div>
									) : (
										<p className="text-neutral-500 text-sm">
											Not included on this invoice.
										</p>
									)}
								</section>

								<section className="bg-neutral-950 border border-neutral-800 rounded-lg p-5">
									<div className="flex justify-between items-center mb-4">
										<h4 className="text-sm font-bold uppercase tracking-widest text-neutral-300">
											Services
										</h4>
										<button
											type="button"
											onClick={builder.addServiceLine}
											className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-2"
										>
											<FiPlus className="h-4 w-4" /> Add Service
										</button>
									</div>
									<div className="space-y-3">
										{builder.serviceLines.length === 0 ? (
											<p className="text-neutral-500 text-sm">
												No services added.
											</p>
										) : (
											builder.serviceLines.map((line) => (
												<div
													key={line.id}
													className="grid md:grid-cols-[2fr_1fr_1fr_1fr_auto_auto] gap-3 items-end bg-neutral-900 border border-neutral-800 rounded p-3"
												>
													<div>
														<label
															htmlFor={`invoice-service-${line.id}`}
															className="text-xs text-neutral-400 block mb-1"
														>
															Service
														</label>
														<button
															id={`invoice-service-${line.id}`}
															type="button"
															onClick={() =>
																builder.setServicePickerLineId(line.id)
															}
															className="w-full text-left bg-neutral-800 border border-neutral-700 rounded p-2.5 text-white text-sm hover:border-emerald-500 transition-colors"
														>
															{line.snapshot_name ||
																(line.is_custom
																	? "Custom service"
																	: "Select service...")}
														</button>
													</div>
													<div>
														<label
															htmlFor={`invoice-service-pricing-type-${line.id}`}
															className="text-xs text-neutral-400 block mb-1"
														>
															Pricing
														</label>
														<select
															id={`invoice-service-pricing-type-${line.id}`}
															value={line.pricing_type || "fixed"}
															onChange={(e) =>
																builder.updateServicePricingType(
																	line.id,
																	e.target.value as "fixed" | "hourly",
																)
															}
															className={lineInputClasses}
														>
															<option value="fixed">Fixed</option>
															<option value="hourly">Hourly</option>
														</select>
													</div>
													<div>
														<label
															htmlFor={`invoice-service-price-${line.id}`}
															className="text-xs text-neutral-400 block mb-1"
														>
															{(line.pricing_type || "fixed") === "hourly"
																? "Hourly Rate"
																: "Fixed Price"}
														</label>
														<input
															id={`invoice-service-price-${line.id}`}
															type="number"
															min={0}
															step={0.01}
															value={line.unit_price}
															readOnly={
																(line.pricing_type || "fixed") === "hourly"
															}
															onChange={(e) =>
																builder.updateServiceLine(
																	line.id,
																	"unit_price",
																	Math.max(0, parseNumberInput(e.target.value)),
																)
															}
															className={lineInputClasses}
														/>
													</div>
													{line.pricing_type === "hourly" && (
														<div>
															<label
																htmlFor={`invoice-service-qty-${line.id}`}
																className="text-xs text-neutral-400 block mb-1"
															>
																Hrs
															</label>
															<input
																id={`invoice-service-qty-${line.id}`}
																type="number"
																min={0.0}
																step={0.1}
																value={line.quantity}
																onChange={(e) =>
																	builder.updateServiceLine(
																		line.id,
																		"quantity",
																		Math.max(
																			0.1,
																			parseNumberInput(e.target.value, 1),
																		),
																	)
																}
																className={lineInputClasses}
															/>
														</div>
													)}
													<p className="text-sm text-emerald-400 font-semibold pb-2">
														{toCurrency(line.unit_price * line.quantity)}
													</p>
													<button
														type="button"
														onClick={() => builder.removeServiceLine(line.id)}
														className="text-red-400 hover:text-red-300 pb-2"
													>
														<FiTrash2 className="h-4 w-4" />
													</button>
												</div>
											))
										)}
									</div>
								</section>

								<section className="bg-neutral-950 border border-neutral-800 rounded-lg p-5">
									<div className="flex justify-between items-center mb-4">
										<h4 className="text-sm font-bold uppercase tracking-widest text-neutral-300">
											Parts
										</h4>
										<button
											type="button"
											onClick={builder.addPartLine}
											className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-2"
										>
											<FiPlus className="h-4 w-4" /> Add Part
										</button>
									</div>
									<div className="space-y-3">
										{builder.partLines.length === 0 ? (
											<p className="text-neutral-500 text-sm">
												No parts added.
											</p>
										) : (
											builder.partLines.map((line) => (
												<div
													key={line.id}
													className="grid md:grid-cols-[2fr_1fr_1fr_auto_auto] gap-3 items-end bg-neutral-900 border border-neutral-800 rounded p-3"
												>
													<div>
														<label
															htmlFor={`invoice-part-${line.id}`}
															className="text-xs text-neutral-400 block mb-1"
														>
															Part
														</label>
														<button
															id={`invoice-part-${line.id}`}
															type="button"
															onClick={() =>
																builder.setPartPickerLineId(line.id)
															}
															className="w-full text-left bg-neutral-800 border border-neutral-700 rounded p-2.5 text-white text-sm hover:border-emerald-500 transition-colors"
														>
															{line.snapshot_name ||
																(line.is_custom
																	? "Custom part"
																	: "Select part...")}
														</button>
													</div>
													<div>
														<label
															htmlFor={`invoice-part-price-${line.id}`}
															className="text-xs text-neutral-400 block mb-1"
														>
															Price
														</label>
														<input
															id={`invoice-part-price-${line.id}`}
															type="number"
															min={0}
															step={0.01}
															value={line.unit_price}
															onChange={(e) =>
																builder.updatePartLine(
																	line.id,
																	"unit_price",
																	Math.max(0, parseNumberInput(e.target.value)),
																)
															}
															className={lineInputClasses}
														/>
													</div>
													<div>
														<label
															htmlFor={`invoice-part-qty-${line.id}`}
															className="text-xs text-neutral-400 block mb-1"
														>
															Qty
														</label>
														<input
															id={`invoice-part-qty-${line.id}`}
															type="number"
															min={1}
															step={1}
															value={line.quantity}
															onChange={(e) =>
																builder.updatePartLine(
																	line.id,
																	"quantity",
																	Math.max(
																		1,
																		parseNumberInput(e.target.value, 1),
																	),
																)
															}
															className={lineInputClasses}
														/>
													</div>
													<p className="text-sm text-emerald-400 font-semibold pb-2">
														{toCurrency(line.unit_price * line.quantity)}
													</p>
													<button
														type="button"
														onClick={() => builder.removePartLine(line.id)}
														className="text-red-400 hover:text-red-300 pb-2"
													>
														<FiTrash2 className="h-4 w-4" />
													</button>
												</div>
											))
										)}
									</div>
								</section>

								<section className="bg-neutral-950 border border-neutral-800 rounded-lg p-5">
									<div className="grid md:grid-cols-3 gap-4 text-sm mb-4">
										{builder.hazardousWasteEnabled ? (
											<div className="bg-neutral-900 border border-neutral-800 rounded p-3">
												<p className="text-neutral-400 uppercase tracking-widest text-[11px] mb-1">
													Hazardous Waste Total
												</p>
												<p className="text-white font-bold">
													{toCurrency(builder.hazardousWasteSubtotal)}
												</p>
											</div>
										) : null}
										<div className="bg-neutral-900 border border-neutral-800 rounded p-3">
											<p className="text-neutral-400 uppercase tracking-widest text-[11px] mb-1">
												Services Total
											</p>
											<p className="text-white font-bold">
												{toCurrency(builder.servicesSubtotal)}
											</p>
										</div>
										<div className="bg-neutral-900 border border-neutral-800 rounded p-3">
											<p className="text-neutral-400 uppercase tracking-widest text-[11px] mb-1">
												Parts Total
											</p>
											<p className="text-white font-bold">
												{toCurrency(builder.partsSubtotal)}
											</p>
										</div>
									</div>
									<div className="bg-neutral-900 border border-emerald-700/40 rounded p-4 mb-4 max-w-sm ml-auto space-y-2">
										<div className="flex justify-between text-sm">
											<span className="text-neutral-400">Subtotal</span>
											<span className="text-white font-semibold">
												{toCurrency(subtotal)}
											</span>
										</div>
										<div className="flex justify-between text-sm">
											<span className="text-neutral-400">
												Sales Tax · parts only ({taxRate.toFixed(3)}%)
											</span>
											<span className="text-white font-semibold">
												{toCurrency(salesTax)}
											</span>
										</div>
										<div className="flex justify-between text-base border-t border-neutral-700 pt-2">
											<span className="text-neutral-300 uppercase tracking-widest text-xs font-bold">
												Invoice Total
											</span>
											<span className="text-emerald-400 font-bold">
												{toCurrency(grandTotal)}
											</span>
										</div>
									</div>
									<button
										type="button"
										disabled={builder.isSaving}
										onClick={() => void builder.save()}
										className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-700 px-6 py-3 rounded font-bold text-sm uppercase tracking-widest"
									>
										{builder.isSaving
											? builder.editingInvoiceId
												? "Saving..."
												: "Creating..."
											: builder.editingInvoiceId
												? "Save Invoice"
												: "Create Invoice"}
									</button>
								</section>
							</div>
						</div>
					</div>
				</div>
			</div>

			{builder.isOwnerPickerOpen && (
				<OwnerPickerModal
					users={users}
					onSelect={(ownerId) => {
						builder.setOwnerId(ownerId);
						builder.setIsOwnerPickerOpen(false);
					}}
					onClose={() => builder.setIsOwnerPickerOpen(false)}
				/>
			)}

			{builder.isBikePickerOpen && (
				<BikePickerModal
					bikes={bikes}
					users={users}
					ownerId={builder.ownerId}
					mechanicNotes={builder.mechanicNotes}
					onBikeCreated={onBikeCreated}
					onSelect={(bikeId) => {
						builder.setBikeId(bikeId);
						builder.setIsBikePickerOpen(false);
					}}
					onClose={() => builder.setIsBikePickerOpen(false)}
				/>
			)}

			{builder.servicePickerLineId && (
				<ServicePickerModal
					services={services}
					onSelect={(serviceId) =>
						builder.selectService(
							builder.servicePickerLineId as string,
							serviceId,
						)
					}
					onConfirmCustom={(name) =>
						builder.confirmCustomService(
							builder.servicePickerLineId as string,
							name,
						)
					}
					onClose={() => builder.setServicePickerLineId(null)}
				/>
			)}

			{builder.partPickerLineId && (
				<PartPickerModal
					parts={parts}
					partLines={builder.partLines}
					activeLineId={builder.partPickerLineId}
					onSelect={(partId, partOverride) =>
						builder.selectPart(
							builder.partPickerLineId as string,
							partId,
							partOverride,
						)
					}
					onConfirmCustom={(name) =>
						builder.confirmCustomPart(builder.partPickerLineId as string, name)
					}
					onPartCreated={onPartCreated}
					onClose={() => builder.setPartPickerLineId(null)}
				/>
			)}
		</>
	);
}
