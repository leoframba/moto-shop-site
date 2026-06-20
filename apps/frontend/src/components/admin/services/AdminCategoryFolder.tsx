"use client";
import { useState } from "react";
import type { Category, Service, ServiceFormData } from "@/types";
import ServiceForm from "./ServiceForm";

interface AdminCategoryFolderProps {
	category: string;
	services: Service[];
	categories: Category[];
	isOpen: boolean;
	toggleFolder: () => void;
	onSaveEdit: (id: string, updatedData: ServiceFormData) => Promise<void>;
	onDelete: (service: Service) => Promise<void>;
	onToggleHidden?: (service: Service) => void | Promise<void>;
	onToggleInternal?: (service: Service) => void | Promise<void>;
}

export default function AdminCategoryFolder({
	category,
	services,
	categories,
	isOpen,
	toggleFolder,
	onSaveEdit,
	onDelete,
	onToggleHidden,
	onToggleInternal,
}: AdminCategoryFolderProps) {
	const [editingId, setEditingId] = useState<string | null>(null);
	const allHidden =
		services.length > 0 &&
		services.every((service) => !service.is_internal && service.is_hidden);
	const allInternal =
		services.length > 0 && services.every((service) => service.is_internal);

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
					{allInternal && (
						<span className="hidden rounded bg-emerald-500/10 px-2 py-1 text-xs font-bold uppercase text-emerald-300 md:block">
							Invoice only
						</span>
					)}
					{allHidden && (
						<span className="text-xs font-bold text-neutral-300 uppercase bg-neutral-700/40 px-2 py-1 rounded hidden md:block">
							Hidden from menu
						</span>
					)}
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
						{isOpen ? "-" : "+"}
					</span>
				</div>
			</button>

			{isOpen && (
				<div className="p-2 md:p-4 space-y-2">
					{services.length === 0 ? (
						<div className="p-6 text-center border border-dashed border-neutral-800 bg-neutral-900/20 rounded">
							<span className="text-amber-500 font-bold uppercase tracking-widest text-xs block mb-1">
								⚠️ Empty Category
							</span>
							<p className="text-neutral-300 text-sm">
								This category has no services inside it. It will be
								automatically hidden from the public menu.
							</p>
						</div>
					) : (
						services.map((service) => (
							<div key={service.id}>
								{editingId === service.id ? (
									<div className="my-2">
										<ServiceForm
											categories={categories}
											initialData={service}
											onSave={async (data) => {
												await onSaveEdit(service.id, data);
												setEditingId(null);
											}}
											onCancel={() => setEditingId(null)}
											onDelete={() => onDelete(service)}
										/>
									</div>
								) : (
									/* PREVIEW MODE */
									<div
										className={`group bg-neutral-900/30 hover:bg-neutral-900/80 p-5 rounded border transition-colors flex flex-col md:flex-row justify-between md:items-center gap-6 ${
											service.is_internal
												? "border-emerald-700/40 border-dashed"
												: service.is_hidden
													? "border-neutral-700/60 border-dashed opacity-60"
													: "border-neutral-800/50"
										}`}
									>
										<div className="max-w-xl">
											<h3 className="text-lg md:text-xl font-bold text-neutral-200 mb-1 tracking-wide uppercase flex items-center gap-2 flex-wrap">
												{service.name}
												{service.is_internal && (
													<span className="text-[10px] font-bold text-emerald-300 uppercase bg-emerald-500/10 px-2 py-0.5 rounded tracking-widest">
														Invoice only
													</span>
												)}
												{!service.is_internal && service.is_hidden && (
													<span className="text-[10px] font-bold text-neutral-300 uppercase bg-neutral-700/40 px-2 py-0.5 rounded tracking-widest">
														Hidden
													</span>
												)}
											</h3>
											<p className="text-neutral-300 leading-relaxed text-sm">
												{service.description}
											</p>
										</div>
										<div className="flex items-center shrink-0">
											{service.pricing_type === "contact" ? (
												<span className="text-lg md:text-xl font-bold text-neutral-300 uppercase tracking-widest italic">
													Call for Quote
												</span>
											) : (
												<div className="flex items-center gap-4 md:gap-8">
													{service.pricing_type === "hourly" && (
														<div className="text-right">
															<span className="block text-[10px] md:text-xs text-neutral-300 uppercase tracking-widest mb-1">
																Est. Labor
															</span>
															<span className="text-lg md:text-xl font-mono text-neutral-200">
																{service.estimated_hours}{" "}
																<span className="text-xs md:text-sm text-neutral-300 font-sans uppercase">
																	hrs
																</span>
															</span>
														</div>
													)}
													{service.pricing_type === "hourly" && (
														<div className="w-px h-10 bg-neutral-800 hidden md:block"></div>
													)}
													<div className="text-right border-l border-neutral-800 pl-4 md:border-none md:pl-0">
														<span className="block text-[10px] md:text-xs text-neutral-300 uppercase tracking-widest mb-1">
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
											<div className="pl-6 border-l border-neutral-800 ml-6 md:ml-8 flex items-center gap-2">
												{onToggleInternal && (
													<button
														type="button"
														onClick={() => void onToggleInternal(service)}
														title={
															service.is_internal
																? "Move to public catalog"
																: "Mark as invoice only"
														}
														className="text-neutral-300 hover:text-white transition-colors bg-neutral-800 hover:bg-neutral-700 px-4 py-2 rounded-lg text-sm font-semibold"
													>
														{service.is_internal ? "Public" : "Invoice"}
													</button>
												)}
												{onToggleHidden && !service.is_internal && (
													<button
														type="button"
														onClick={() => void onToggleHidden(service)}
														title={
															service.is_hidden
																? "Show on public menu"
																: "Hide from public menu"
														}
														className="text-neutral-300 hover:text-white transition-colors bg-neutral-800 hover:bg-neutral-700 px-4 py-2 rounded-lg text-sm font-semibold"
													>
														{service.is_hidden ? "Show" : "Hide"}
													</button>
												)}
												<button
													type="button"
													onClick={() => setEditingId(service.id)}
													className="text-neutral-300 hover:text-white transition-colors bg-neutral-800 hover:bg-neutral-700 px-4 py-2 rounded-lg text-sm font-semibold"
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
