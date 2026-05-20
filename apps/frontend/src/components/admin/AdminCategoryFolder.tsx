"use client";
import { useState } from "react";
import type { Category, PricingType, Service, ServiceFormData } from "@/types";

interface AdminCategoryFolderProps {
	category: string;
	services: Service[];
	categories: Category[];
	isOpen: boolean;
	toggleFolder: () => void;
	onSaveEdit: (id: string, updatedData: ServiceFormData) => Promise<void>;
	onDelete: (service: Service) => Promise<void>;
}

export default function AdminCategoryFolder({
	category,
	services,
	categories,
	isOpen,
	toggleFolder,
	onSaveEdit,
	onDelete,
}: AdminCategoryFolderProps) {
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editForm, setEditForm] = useState<ServiceFormData>({
		name: "",
		description: "",
		category_id: "",
		pricing_type: "hourly",
		estimated_hours: 1,
		fixed_price: 0,
	});

	const startEditing = (service: Service) => {
		setEditingId(service.id);
		setEditForm({
			name: service.name,
			description: service.description || "",
			category_id: service.category_id || categories[0]?.id || "",
			pricing_type: (service.pricing_type as PricingType) || "hourly",
			estimated_hours: service.estimated_hours || 1,
			fixed_price: service.fixed_price || 0,
		});
	};

	const handleSave = async (id: string) => {
		await onSaveEdit(id, editForm);
		setEditingId(null);
	};

	return (
		<div className="border border-red-900/30 rounded-lg overflow-hidden bg-neutral-950/50 mb-6 shadow-lg">
			<button
				type="button"
				onClick={toggleFolder}
				aria-expanded={isOpen}
				className="w-full flex justify-between items-center p-5 md:p-6 bg-gradient-to-r from-red-950/40 to-neutral-900/40 hover:from-red-900/50 transition-colors text-left border-b border-transparent data-[open=true]:border-red-900/30"
				data-open={isOpen}
			>
				<h2 className="text-xl md:text-2xl font-bold text-white uppercase tracking-widest flex items-center gap-3">
					<span className="text-red-600">{"///"}</span> {category}
				</h2>
				<div className="flex items-center gap-4">
					{services.length === 0 ? (
						<span className="text-xs font-bold text-amber-500 uppercase bg-amber-500/10 px-2 py-1 rounded hidden md:block">
							Empty
						</span>
					) : (
						<span className="text-xs font-mono text-red-500/70 uppercase hidden md:block">
							{services.length} {services.length === 1 ? "Service" : "Services"}
						</span>
					)}
					<span className="text-red-500 font-mono text-3xl font-light leading-none w-6 text-center">
						{isOpen ? "−" : "+"}
					</span>
				</div>
			</button>

			{isOpen && (
				<div className="p-2 md:p-4 space-y-2">
					{/* EMPTY STATE UI */}
					{services.length === 0 ? (
						<div className="p-6 text-center border border-dashed border-neutral-800 bg-neutral-900/20 rounded">
							<span className="text-amber-500 font-bold uppercase tracking-widest text-xs block mb-1">
								⚠️ Empty Category
							</span>
							<p className="text-neutral-500 text-sm">
								This category has no services inside it. It will be
								automatically hidden from the public menu.
							</p>
						</div>
					) : (
						services.map((service) => (
							<div key={service.id}>
								{editingId === service.id ? (
									<div className="p-6 bg-neutral-800/30 border-l-4 border-emerald-500 rounded my-2">
										<div className="grid gap-4 mb-4">
											<input
												className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-emerald-500 outline-none"
												value={editForm.name}
												onChange={(e) =>
													setEditForm({ ...editForm, name: e.target.value })
												}
											/>
											<textarea
												className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-white h-24 focus:border-emerald-500 outline-none"
												value={editForm.description}
												onChange={(e) =>
													setEditForm({
														...editForm,
														description: e.target.value,
													})
												}
											/>
											<div className="grid grid-cols-2 gap-4">
												<div>
													<label
														htmlFor={`edit-cat-${service.id}`}
														className="text-xs text-neutral-400 block mb-1"
													>
														Category
													</label>
													<select
														id={`edit-cat-${service.id}`}
														className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-emerald-500 outline-none"
														value={editForm.category_id}
														onChange={(e) =>
															setEditForm({
																...editForm,
																category_id: e.target.value,
															})
														}
													>
														{categories.map((cat) => (
															<option key={cat.id} value={cat.id}>
																{cat.name}
															</option>
														))}
													</select>
												</div>
												<div>
													<label
														htmlFor={`edit-price-${service.id}`}
														className="text-xs text-neutral-400 block mb-1"
													>
														Pricing Model
													</label>
													<select
														id={`edit-price-${service.id}`}
														className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-emerald-500 outline-none"
														value={editForm.pricing_type}
														onChange={(e) =>
															setEditForm({
																...editForm,
																pricing_type: e.target.value as
																	| "hourly"
																	| "fixed"
																	| "contact",
															})
														}
													>
														<option value="hourly">Hourly Rate</option>
														<option value="fixed">Fixed Price</option>
														<option value="contact">Call for Quote</option>
													</select>
												</div>
											</div>

											<div className="flex gap-4">
												{editForm.pricing_type === "hourly" && (
													<div>
														<label
															htmlFor={`edit-hrs-${service.id}`}
															className="text-xs text-neutral-400 block mb-1"
														>
															Est. Hours
														</label>
														<input
															id={`edit-hrs-${service.id}`}
															type="number"
															step="0.1"
															value={editForm.estimated_hours}
															onChange={(e) =>
																setEditForm({
																	...editForm,
																	estimated_hours: Number(e.target.value),
																})
															}
															className="w-32 bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-emerald-500 outline-none"
														/>
													</div>
												)}
												{editForm.pricing_type === "fixed" && (
													<div>
														<label
															htmlFor={`edit-fixed-${service.id}`}
															className="text-xs text-neutral-400 block mb-1"
														>
															Fixed Price
														</label>
														<input
															id={`edit-fixed-${service.id}`}
															type="number"
															step="1"
															value={editForm.fixed_price}
															onChange={(e) =>
																setEditForm({
																	...editForm,
																	fixed_price: Number(e.target.value),
																})
															}
															className="w-32 bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-emerald-500 outline-none"
														/>
													</div>
												)}
											</div>
										</div>
										<div className="flex gap-3">
											<button
												type="button"
												onClick={() => handleSave(service.id)}
												className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded font-bold text-sm"
											>
												Save
											</button>
											<button
												type="button"
												onClick={() => onDelete(service)}
												className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-bold text-sm"
											>
												Delete
											</button>
											<button
												type="button"
												onClick={() => setEditingId(null)}
												className="bg-neutral-700 hover:bg-neutral-600 px-4 py-2 rounded font-bold text-sm"
											>
												Cancel
											</button>
										</div>
									</div>
								) : (
									/* PREVIEW MODE */
									<div className="group bg-neutral-900/30 hover:bg-neutral-900/80 p-5 rounded border border-neutral-800/50 transition-colors flex flex-col md:flex-row justify-between md:items-center gap-6">
										<div className="max-w-xl">
											<h3 className="text-lg md:text-xl font-bold text-neutral-200 mb-1 tracking-wide uppercase">
												{service.name}
											</h3>
											<p className="text-neutral-400 leading-relaxed text-sm">
												{service.description}
											</p>
										</div>
										<div className="flex items-center shrink-0">
											{service.pricing_type === "contact" ? (
												<span className="text-lg md:text-xl font-bold text-neutral-400 uppercase tracking-widest italic">
													Call for Quote
												</span>
											) : (
												<div className="flex items-center gap-4 md:gap-8">
													{service.pricing_type === "hourly" && (
														<div className="text-right">
															<span className="block text-[10px] md:text-xs text-neutral-500 uppercase tracking-widest mb-1">
																Est. Labor
															</span>
															<span className="text-lg md:text-xl font-mono text-neutral-200">
																{service.estimated_hours}{" "}
																<span className="text-xs md:text-sm text-neutral-500 font-sans uppercase">
																	hrs
																</span>
															</span>
														</div>
													)}
													{service.pricing_type === "hourly" && (
														<div className="w-px h-10 bg-neutral-800 hidden md:block"></div>
													)}
													<div className="text-right border-l border-neutral-800 pl-4 md:border-none md:pl-0">
														<span className="block text-[10px] md:text-xs text-neutral-500 uppercase tracking-widest mb-1">
															{service.pricing_type === "fixed"
																? "Fixed Rate"
																: "Est. Total"}
														</span>
														<span className="text-2xl md:text-3xl font-mono text-white font-bold group-hover:text-red-400 transition-colors">
															${service.calculated_price?.toFixed(2)}
														</span>
													</div>
												</div>
											)}
											<div className="pl-6 border-l border-neutral-800 ml-6 md:ml-8">
												<button
													type="button"
													onClick={() => startEditing(service)}
													className="text-neutral-400 hover:text-white transition-colors bg-neutral-800 hover:bg-neutral-700 px-4 py-2 rounded-lg text-sm font-semibold"
												>
													Edit
												</button>
											</div>
										</div>
									</div>
								)}
							</div>
						))
					)}
				</div>
			)}
		</div>
	);
}
