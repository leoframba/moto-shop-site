"use client";

import { useEffect } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { NumberStepperInput } from "@/components/admin/NumberStepperInput";
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
import {
	invoiceAddActionClass,
	invoiceBodyClass,
	invoiceBodyMutedClass,
	invoiceCardClass,
	invoiceCheckboxClass,
	invoiceEmptyHintClass,
	invoiceFieldInputLgClass,
	invoiceHeaderClass,
	invoiceHeaderTitleClass,
	invoiceHintClass,
	invoiceLabelClass,
	invoiceOverlayClass,
	invoicePickerButtonClass,
	invoicePrimaryButtonClass,
	invoiceReadOnlyFieldClass,
	invoiceSecondaryButtonClass,
	invoiceSectionClass,
	invoiceSectionTitleClass,
	invoiceShellClass,
	invoiceStackClass,
	invoiceSubheadingClass,
	invoiceTableBodyClass,
	invoiceTableCellClass,
	invoiceTableCellRightClass,
	invoiceTableClassParts,
	invoiceTableClassWide,
	invoiceTableDeleteButtonClass,
	invoiceTableHeadCellClass,
	invoiceTableHeadRowClass,
	invoiceTableInputClass,
	invoiceTablePickerButtonClass,
	invoiceTableTotalClass,
	invoiceTableWrapClass,
	invoiceTextareaClass,
	invoiceTotalBoxClass,
	invoiceTotalLabelClass,
	invoiceTotalPanelClass,
} from "./invoiceUi";
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
			<div className={invoiceOverlayClass}>
				<div className="max-w-6xl mx-auto h-full">
					<div className={invoiceShellClass}>
						<div className={invoiceHeaderClass}>
							<h3 className={invoiceHeaderTitleClass}>
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
									className={invoiceSecondaryButtonClass}
								>
									{builder.editingInvoiceId ? "Discard Edit" : "Reset Draft"}
								</button>
								<button
									type="button"
									onClick={builder.close}
									className={invoiceSecondaryButtonClass}
								>
									Close
								</button>
							</div>
						</div>

						<div className={invoiceBodyClass}>
							<div className={invoiceStackClass}>
								<div className={invoiceSectionClass}>
									<h4 className={invoiceSectionTitleClass}>Links & Info</h4>
									<div className="grid md:grid-cols-2 gap-4 mb-4">
										<div>
											<label
												htmlFor="invoice-owner"
												className={invoiceLabelClass}
											>
												Owner
											</label>
											<div className="flex gap-2">
												<button
													id="invoice-owner"
													type="button"
													onClick={() => builder.setIsOwnerPickerOpen(true)}
													className={invoicePickerButtonClass}
												>
													{builder.ownerLabel}
												</button>
												<button
													type="button"
													onClick={() => builder.setOwnerId("")}
													className={invoiceSecondaryButtonClass}
												>
													Clear
												</button>
											</div>
											<p className={invoiceHintClass}>
												Open modal to search by name, email, or phone.
											</p>
										</div>
										<div>
											<label
												htmlFor="invoice-bike"
												className={invoiceLabelClass}
											>
												Bike
											</label>
											<div className="flex gap-2">
												<button
													id="invoice-bike"
													type="button"
													onClick={() => builder.setIsBikePickerOpen(true)}
													className={invoicePickerButtonClass}
												>
													{builder.bikeId && selectedBike
														? getBikeDisplayLabel(selectedBike)
														: "Select bike"}
												</button>
												<button
													type="button"
													onClick={() => builder.setBikeId("")}
													className={invoiceSecondaryButtonClass}
												>
													Clear
												</button>
											</div>
											<p className={invoiceHintClass}>
												Open modal to search by bike details, VIN, plate, or
												owner.
											</p>
										</div>
									</div>

									<div className="grid md:grid-cols-2 gap-4 mb-4">
										<div className={invoiceCardClass}>
											<p className={invoiceSubheadingClass}>Customer Data</p>
											{!builder.hasLinkedOwner ? (
												<p className={invoiceBodyMutedClass}>
													No portal account linked — enter details for the
													printed invoice.
												</p>
											) : (
												<p className={invoiceBodyMutedClass}>
													Pulled from linked owner account.
												</p>
											)}
											<div className="grid grid-cols-2 gap-3">
												<div>
													<label
														htmlFor="invoice-customer-first-name"
														className={invoiceLabelClass}
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
																? invoiceReadOnlyFieldClass
																: invoiceFieldInputLgClass
														}
													/>
												</div>
												<div>
													<label
														htmlFor="invoice-customer-last-name"
														className={invoiceLabelClass}
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
																? invoiceReadOnlyFieldClass
																: invoiceFieldInputLgClass
														}
													/>
												</div>
												<div className="col-span-2">
													<label
														htmlFor="invoice-customer-email"
														className={invoiceLabelClass}
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
																? invoiceReadOnlyFieldClass
																: invoiceFieldInputLgClass
														}
													/>
												</div>
												<div className="col-span-2">
													<label
														htmlFor="invoice-customer-address"
														className={invoiceLabelClass}
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
																? invoiceReadOnlyFieldClass
																: invoiceFieldInputLgClass
														}
													/>
												</div>
												<div className="col-span-2">
													<label
														htmlFor="invoice-customer-phone"
														className={invoiceLabelClass}
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
																? invoiceReadOnlyFieldClass
																: invoiceFieldInputLgClass
														}
													/>
												</div>
											</div>
										</div>

										<div className={invoiceCardClass}>
											<p className={invoiceSubheadingClass}>Bike Data</p>
											<div className="grid grid-cols-2 gap-3">
												<div>
													<label
														htmlFor="invoice-bike-year"
														className={invoiceLabelClass}
													>
														Year
													</label>
													<input
														id="invoice-bike-year"
														value={builder.bikeFields.year}
														readOnly
														className={invoiceReadOnlyFieldClass}
													/>
												</div>
												<div>
													<label
														htmlFor="invoice-bike-make"
														className={invoiceLabelClass}
													>
														Make
													</label>
													<input
														id="invoice-bike-make"
														value={builder.bikeFields.make}
														readOnly
														className={invoiceReadOnlyFieldClass}
													/>
												</div>
												<div>
													<label
														htmlFor="invoice-bike-model"
														className={invoiceLabelClass}
													>
														Model
													</label>
													<input
														id="invoice-bike-model"
														value={builder.bikeFields.model}
														readOnly
														className={invoiceReadOnlyFieldClass}
													/>
												</div>
												<div>
													<label
														htmlFor="invoice-bike-license"
														className={invoiceLabelClass}
													>
														License
													</label>
													<input
														id="invoice-bike-license"
														value={builder.bikeFields.license}
														readOnly
														className={invoiceReadOnlyFieldClass}
													/>
												</div>
												<div className="col-span-2">
													<label
														htmlFor="invoice-bike-vin"
														className={invoiceLabelClass}
													>
														VIN
													</label>
													<input
														id="invoice-bike-vin"
														value={builder.bikeFields.vin}
														readOnly
														className={invoiceReadOnlyFieldClass}
													/>
												</div>
											</div>
										</div>
									</div>
									<div className="grid md:grid-cols-3 gap-4 mb-4">
										<div>
											<label
												htmlFor="invoice-status"
												className={invoiceLabelClass}
											>
												Status
											</label>
											<select
												id="invoice-status"
												value={builder.status}
												onChange={(e) =>
													builder.setStatus(e.target.value as InvoiceStatus)
												}
												className={`${invoiceFieldInputLgClass} capitalize`}
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
												className={invoiceLabelClass}
											>
												Odometer In
											</label>
											<NumberStepperInput
												id="odometer-in"
												min={0}
												value={builder.odometerIn}
												onChange={(e) => builder.setOdometerIn(e.target.value)}
												inputClassName={invoiceFieldInputLgClass}
											/>
										</div>
										<div>
											<label
												htmlFor="odometer-out"
												className={invoiceLabelClass}
											>
												Odometer Out
											</label>
											<NumberStepperInput
												id="odometer-out"
												min={0}
												value={builder.odometerOut}
												onChange={(e) => builder.setOdometerOut(e.target.value)}
												inputClassName={invoiceFieldInputLgClass}
											/>
										</div>
									</div>
									<div>
										<label
											htmlFor="mechanic-notes"
											className={invoiceLabelClass}
										>
											Mechanic Notes
										</label>
										<textarea
											id="mechanic-notes"
											value={builder.mechanicNotes}
											onChange={(e) => builder.setMechanicNotes(e.target.value)}
											className={invoiceTextareaClass}
										/>
									</div>
								</div>

								<section className={invoiceSectionClass}>
									<div className="flex justify-between items-center mb-4">
										<h4 className={`${invoiceSectionTitleClass} mb-0`}>
											{HAZARDOUS_WASTE_LINE_NAME}
										</h4>
										<label className="inline-flex items-center gap-2 text-sm text-neutral-300 cursor-pointer">
											<input
												type="checkbox"
												checked={builder.hazardousWasteEnabled}
												onChange={(e) =>
													builder.toggleHazardousWaste(e.target.checked)
												}
												className={invoiceCheckboxClass}
											/>
											Include on invoice
										</label>
									</div>
									{builder.hazardousWasteEnabled ? (
										<div className={invoiceTableWrapClass}>
											<table className={invoiceTableClassParts}>
												<thead>
													<tr className={invoiceTableHeadRowClass}>
														<th className={invoiceTableHeadCellClass}>
															Description
														</th>
														<th
															className={`${invoiceTableHeadCellClass} w-24 text-right`}
														>
															Qty
														</th>
														<th
															className={`${invoiceTableHeadCellClass} w-32 text-right`}
														>
															Unit Price
														</th>
														<th
															className={`${invoiceTableHeadCellClass} w-28 text-right`}
														>
															Total
														</th>
													</tr>
												</thead>
												<tbody className={invoiceTableBodyClass}>
													<tr>
														<td
															className={`${invoiceTableCellClass} font-medium text-neutral-100`}
														>
															{HAZARDOUS_WASTE_LINE_NAME}
														</td>
														<td className={invoiceTableCellClass}>
															<NumberStepperInput
																id="hazardous-waste-quantity"
																size="compact"
																min={1}
																step={1}
																value={builder.hazardousWasteQuantity}
																onChange={(e) =>
																	builder.setHazardousWasteQuantity(
																		Math.max(
																			1,
																			parseInt(e.target.value, 10) || 1,
																		),
																	)
																}
																inputClassName={`${invoiceTableInputClass} text-right`}
															/>
														</td>
														<td className={invoiceTableCellClass}>
															<NumberStepperInput
																id="hazardous-waste-rate"
																size="compact"
																min={0}
																step={0.01}
																value={builder.hazardousWasteUnitPrice}
																onChange={(e) =>
																	builder.setHazardousWasteUnitPrice(
																		parseNumberInput(e.target.value),
																	)
																}
																inputClassName={`${invoiceTableInputClass} text-right`}
															/>
														</td>
														<td
															className={`${invoiceTableCellRightClass} ${invoiceTableTotalClass}`}
														>
															{toCurrency(builder.hazardousWasteSubtotal)}
														</td>
													</tr>
												</tbody>
											</table>
										</div>
									) : (
										<p className={invoiceEmptyHintClass}>
											Not included on this invoice.
										</p>
									)}
								</section>

								<section className={invoiceSectionClass}>
									<div className="flex justify-between items-center mb-4">
										<h4 className={`${invoiceSectionTitleClass} mb-0`}>
											Services
										</h4>
										<button
											type="button"
											onClick={builder.addServiceLine}
											className={invoiceAddActionClass}
										>
											<FiPlus className="h-4 w-4" /> Add Service
										</button>
									</div>
									{builder.serviceLines.length === 0 ? (
										<p className={invoiceEmptyHintClass}>No services added.</p>
									) : (
										<div className={invoiceTableWrapClass}>
											<table className={invoiceTableClassWide}>
												<thead>
													<tr className={invoiceTableHeadRowClass}>
														<th className={invoiceTableHeadCellClass}>
															Service
														</th>
														<th className={`${invoiceTableHeadCellClass} w-28`}>
															Pricing
														</th>
														<th
															className={`${invoiceTableHeadCellClass} w-32 text-right`}
														>
															Unit Price
														</th>
														<th
															className={`${invoiceTableHeadCellClass} w-24 text-right`}
														>
															Hours
														</th>
														<th
															className={`${invoiceTableHeadCellClass} w-28 text-right`}
														>
															Total
														</th>
														<th
															className={`${invoiceTableHeadCellClass} w-12 text-right`}
														>
															<span className="sr-only">Actions</span>
														</th>
													</tr>
												</thead>
												<tbody className={invoiceTableBodyClass}>
													{builder.serviceLines.map((line) => (
														<tr key={line.id}>
															<td className={invoiceTableCellClass}>
																<button
																	id={`invoice-service-${line.id}`}
																	type="button"
																	onClick={() =>
																		builder.setServicePickerLineId(line.id)
																	}
																	className={invoiceTablePickerButtonClass}
																>
																	{line.snapshot_name ||
																		(line.is_custom
																			? "Custom service"
																			: "Select service...")}
																</button>
															</td>
															<td className={invoiceTableCellClass}>
																<select
																	id={`invoice-service-pricing-type-${line.id}`}
																	value={line.pricing_type || "fixed"}
																	onChange={(e) =>
																		builder.updateServicePricingType(
																			line.id,
																			e.target.value as "fixed" | "hourly",
																		)
																	}
																	className={invoiceTableInputClass}
																>
																	<option value="fixed">Fixed</option>
																	<option value="hourly">Hourly</option>
																</select>
															</td>
															<td className={invoiceTableCellClass}>
																<NumberStepperInput
																	id={`invoice-service-price-${line.id}`}
																	size="compact"
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
																			Math.max(
																				0,
																				parseNumberInput(e.target.value),
																			),
																		)
																	}
																	inputClassName={`${invoiceTableInputClass} text-right`}
																/>
															</td>
															<td className={invoiceTableCellRightClass}>
																{line.pricing_type === "hourly" ? (
																	<NumberStepperInput
																		id={`invoice-service-qty-${line.id}`}
																		size="compact"
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
																		inputClassName={`${invoiceTableInputClass} text-right`}
																	/>
																) : (
																	<span className="text-neutral-500">—</span>
																)}
															</td>
															<td
																className={`${invoiceTableCellRightClass} ${invoiceTableTotalClass}`}
															>
																{toCurrency(line.unit_price * line.quantity)}
															</td>
															<td className={invoiceTableCellRightClass}>
																<button
																	type="button"
																	onClick={() =>
																		builder.removeServiceLine(line.id)
																	}
																	className={invoiceTableDeleteButtonClass}
																	aria-label="Remove service line"
																>
																	<FiTrash2 className="h-4 w-4" />
																</button>
															</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>
									)}
								</section>

								<section className={invoiceSectionClass}>
									<div className="flex justify-between items-center mb-4">
										<h4 className={`${invoiceSectionTitleClass} mb-0`}>
											Parts
										</h4>
										<button
											type="button"
											onClick={builder.addPartLine}
											className={invoiceAddActionClass}
										>
											<FiPlus className="h-4 w-4" /> Add Part
										</button>
									</div>
									{builder.partLines.length === 0 ? (
										<p className={invoiceEmptyHintClass}>No parts added.</p>
									) : (
										<div className={invoiceTableWrapClass}>
											<table className={invoiceTableClassParts}>
												<thead>
													<tr className={invoiceTableHeadRowClass}>
														<th className={invoiceTableHeadCellClass}>Part</th>
														<th
															className={`${invoiceTableHeadCellClass} w-32 text-right`}
														>
															Unit Price
														</th>
														<th
															className={`${invoiceTableHeadCellClass} w-24 text-right`}
														>
															Qty
														</th>
														<th
															className={`${invoiceTableHeadCellClass} w-28 text-right`}
														>
															Total
														</th>
														<th
															className={`${invoiceTableHeadCellClass} w-12 text-right`}
														>
															<span className="sr-only">Actions</span>
														</th>
													</tr>
												</thead>
												<tbody className={invoiceTableBodyClass}>
													{builder.partLines.map((line) => (
														<tr key={line.id}>
															<td className={invoiceTableCellClass}>
																<button
																	id={`invoice-part-${line.id}`}
																	type="button"
																	onClick={() =>
																		builder.setPartPickerLineId(line.id)
																	}
																	className={invoiceTablePickerButtonClass}
																>
																	{line.snapshot_name ||
																		(line.is_custom
																			? "Custom part"
																			: "Select part...")}
																</button>
															</td>
															<td className={invoiceTableCellClass}>
																<NumberStepperInput
																	id={`invoice-part-price-${line.id}`}
																	size="compact"
																	min={0}
																	step={0.01}
																	value={line.unit_price}
																	onChange={(e) =>
																		builder.updatePartLine(
																			line.id,
																			"unit_price",
																			Math.max(
																				0,
																				parseNumberInput(e.target.value),
																			),
																		)
																	}
																	inputClassName={`${invoiceTableInputClass} text-right`}
																/>
															</td>
															<td className={invoiceTableCellClass}>
																<NumberStepperInput
																	id={`invoice-part-qty-${line.id}`}
																	size="compact"
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
																	inputClassName={`${invoiceTableInputClass} text-right`}
																/>
															</td>
															<td
																className={`${invoiceTableCellRightClass} ${invoiceTableTotalClass}`}
															>
																{toCurrency(line.unit_price * line.quantity)}
															</td>
															<td className={invoiceTableCellRightClass}>
																<button
																	type="button"
																	onClick={() =>
																		builder.removePartLine(line.id)
																	}
																	className={invoiceTableDeleteButtonClass}
																	aria-label="Remove part line"
																>
																	<FiTrash2 className="h-4 w-4" />
																</button>
															</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>
									)}
								</section>

								<section className={invoiceSectionClass}>
									<div className="grid md:grid-cols-3 gap-4 text-sm mb-4">
										{builder.hazardousWasteEnabled ? (
											<div className={invoiceTotalBoxClass}>
												<p className={invoiceTotalLabelClass}>
													Hazardous Waste Total
												</p>
												<p className="text-white font-bold">
													{toCurrency(builder.hazardousWasteSubtotal)}
												</p>
											</div>
										) : null}
										<div className={invoiceTotalBoxClass}>
											<p className={invoiceTotalLabelClass}>Services Total</p>
											<p className="text-white font-bold">
												{toCurrency(builder.servicesSubtotal)}
											</p>
										</div>
										<div className={invoiceTotalBoxClass}>
											<p className={invoiceTotalLabelClass}>Parts Total</p>
											<p className="text-white font-bold">
												{toCurrency(builder.partsSubtotal)}
											</p>
										</div>
									</div>
									<div className={invoiceTotalPanelClass}>
										<div className="flex justify-between text-sm">
											<span className="text-neutral-300">Subtotal</span>
											<span className="font-semibold text-neutral-50">
												{toCurrency(subtotal)}
											</span>
										</div>
										<div className="flex justify-between text-sm">
											<span className="text-neutral-300">
												Sales Tax · parts only ({taxRate.toFixed(3)}%)
											</span>
											<span className="font-semibold text-neutral-50">
												{toCurrency(salesTax)}
											</span>
										</div>
										<div className="flex justify-between border-t border-neutral-600 pt-2 text-base">
											<span className="text-xs font-bold uppercase tracking-widest text-neutral-200">
												Invoice Total
											</span>
											<span className="font-bold text-emerald-300">
												{toCurrency(grandTotal)}
											</span>
										</div>
									</div>
									<button
										type="button"
										disabled={builder.isSaving}
										onClick={() => void builder.save()}
										className={invoicePrimaryButtonClass}
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
