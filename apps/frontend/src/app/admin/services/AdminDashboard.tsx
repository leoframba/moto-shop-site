"use client";
import { useEffect, useState } from "react";
import ShopRateManager from "@/components/admin/ShopRateManager";
import type { AdminInitialData, Category, Service } from "@/types";
import { authApiRequest } from "@/utils/api";

interface AdminDashboardProps {
	initialData: AdminInitialData;
}

const calculateServicePrice = (
	service: Service,
	currentRate: number,
): number | null => {
	const pricingType = service.pricing_type || "hourly";

	if (pricingType === "hourly" && service.estimated_hours != null) {
		return roundToTwoDecimals(service.estimated_hours * currentRate);
	}
	if (pricingType === "fixed" && service.fixed_price != null) {
		return roundToTwoDecimals(service.fixed_price);
	}
	return null;
};

const roundToTwoDecimals = (num: number): number => {
	return Math.round((num + Number.EPSILON) * 100) / 100;
};

export default function AdminDashboard({ initialData }: AdminDashboardProps) {
	const [hourlyRate, setHourlyRate] = useState<number>(initialData.hourly_rate);
	const [categories, setCategories] = useState<Category[]>(
		initialData.categories,
	);
	const [services, setServices] = useState<Service[]>(initialData.services);

	const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});

	const toggleFolder = (categoryName: string) => {
		setOpenFolders((prev) => ({
			...prev,
			[categoryName]: !prev[categoryName],
		}));
	};

	// Category Management States
	const [newCategoryName, setNewCategoryName] = useState("");

	// Editing service states
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editForm, setEditForm] = useState({
		name: "",
		description: "",
		category_id: "",
		pricing_type: "hourly",
		estimated_hours: 1,
		fixed_price: 0,
	});

	// Add service states
	const [isAdding, setIsAdding] = useState(false);
	const [addForm, setAddForm] = useState({
		name: "",
		description: "",
		category_id: "",
		pricing_type: "hourly",
		estimated_hours: 1,
		fixed_price: 0,
	});

	useEffect(() => {
		if (categories.length > 0 && !addForm.category_id) {
			setAddForm((prev) => ({ ...prev, category_id: categories[0].id }));
		}
	}, [categories, addForm.category_id]);

	// ==========================================
	// GLOBAL SETTINGS & CATEGORIES
	// ==========================================

	const saveRate = async (newRate: number) => {
		try {
			await authApiRequest("/api/admin/shop-rate", {
				method: "PATCH",
				body: JSON.stringify({ hourly_rate: newRate }),
			});

			setServices((prevServices) =>
				prevServices.map((service) => ({
					...service,
					calculated_price: calculateServicePrice(service, newRate),
				})),
			);
			setHourlyRate(newRate);
			alert("Shop rate updated successfully!");
		} catch (error) {
			console.error(error);
			alert("Failed to save rate.");
		}
	};

	const saveNewCategory = async () => {
		if (!newCategoryName.trim()) return;
		try {
			const newCat = await authApiRequest<Category>("/api/admin/categories", {
				method: "POST",
				body: JSON.stringify({ name: newCategoryName }),
			});
			setCategories([...categories, newCat]);
			setNewCategoryName("");

			if (categories.length === 0) {
				setAddForm((prev) => ({ ...prev, category_id: newCat.id }));
			}
		} catch (error) {
			console.error(error);
			alert("Failed to create category. Ensure the name is unique.");
		}
	};

	const deleteCategory = async (id: string) => {
		if (
			!confirm(
				"Are you sure? This will fail if services are currently using this category.",
			)
		)
			return;
		try {
			await authApiRequest(`/api/admin/categories/${id}`, { method: "DELETE" });
			setCategories(categories.filter((c) => c.id !== id));
		} catch (error) {
			console.error(error);
			alert(
				"Cannot delete category. Check if services are still assigned to it.",
			);
		}
	};

	// ==========================================
	// SERVICES
	// ==========================================

	const startEditing = (service: Service) => {
		setEditingId(service.id);
		setEditForm({
			name: service.name,
			description: service.description || "",
			category_id: service.category_id || categories[0]?.id || "",
			pricing_type: service.pricing_type || "hourly",
			estimated_hours: service.estimated_hours || 1,
			fixed_price: service.fixed_price || 0,
		});
	};

	const saveEdit = async (id: string) => {
		try {
			const updatedService = await authApiRequest<Service>(
				`/api/admin/services/${id}`,
				{
					method: "PATCH",
					body: JSON.stringify(editForm),
				},
			);

			const calcPrice = calculateServicePrice(updatedService, hourlyRate);

			const selectedCat = categories.find((c) => c.id === editForm.category_id);

			const completeService: Service = {
				...updatedService,
				calculated_price: calcPrice,
				categories: selectedCat,
			};

			setServices((prev) =>
				prev.map((s) => (s.id === id ? completeService : s)),
			);
			setEditingId(null);
		} catch (error) {
			console.error(error);
			alert("Failed to save changes.");
		}
	};

	const saveNewService = async () => {
		if (!addForm.category_id) {
			alert("Please create a category first!");
			return;
		}

		try {
			const newService = await authApiRequest<Service>("/api/admin/services", {
				method: "POST",
				body: JSON.stringify(addForm),
			});

			const calcPrice = calculateServicePrice(newService, hourlyRate);

			const selectedCat = categories.find((c) => c.id === addForm.category_id);

			const completeService: Service = {
				...newService,
				calculated_price: calcPrice,
				categories: selectedCat,
			};

			setServices([...services, completeService]);
			setAddForm({
				name: "",
				description: "",
				category_id: categories[0]?.id || "",
				pricing_type: "hourly",
				estimated_hours: 1,
				fixed_price: 0,
			});
			setIsAdding(false);

			setOpenFolders((prev) => ({
				...prev,
				[selectedCat?.name || "Uncategorized"]: true,
			}));
		} catch (error) {
			console.error(error);
			alert("Failed to add new service.");
		}
	};

	const deleteService = async (service_to_delete: Service) => {
		if (!confirm("Are you sure you want to delete this service?")) return;
		const prevServices = [...services];
		setServices(
			services.filter((service) => service.id !== service_to_delete.id),
		);

		try {
			await authApiRequest(`/api/admin/services/${service_to_delete.id}`, {
				method: "DELETE",
			});
		} catch (error) {
			console.error("Error deleting service:", error);
			setServices(prevServices);
			alert("Failed to delete service.");
		}
	};

	const groupedServices = services.reduce(
		(acc, service) => {
			const cat = service.categories?.name || "Uncategorized";
			if (!acc[cat]) acc[cat] = [];
			acc[cat].push(service);
			return acc;
		},
		{} as Record<string, Service[]>,
	);

	return (
		<div className="p-8 bg-neutral-950 min-h-screen text-white font-sans">
			<div className="max-w-5xl mx-auto">
				<div className="mb-8">
					<h1 className="text-3xl font-bold tracking-tight text-white mb-1">
						Admin Dashboard
					</h1>
					<p className="text-neutral-400 text-sm">
						Manage shop rate, categories, and services.
					</p>
				</div>

				<div className="grid md:grid-cols-2 gap-6 mb-12">
					{/* SHOP RATE */}
					<ShopRateManager
						intialRate={initialData.hourly_rate}
						onSaveRate={saveRate}
					/>

					{/* CATEGORY MANAGEMENT */}
					<section className="p-8 border border-neutral-800 rounded-2xl bg-neutral-900 shadow-xl">
						<h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-4">
							Categories
						</h2>
						<div className="flex gap-2 mb-4">
							<input
								placeholder="New category..."
								value={newCategoryName}
								onChange={(e) => setNewCategoryName(e.target.value)}
								className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
							/>
							<button
								type="button"
								onClick={saveNewCategory}
								className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg font-bold text-sm shrink-0"
							>
								Add
							</button>
						</div>
						<div className="space-y-2 max-h-32 overflow-y-auto pr-2">
							{categories.map((cat) => (
								<div
									key={cat.id}
									className="flex justify-between items-center bg-neutral-950 px-3 py-2 rounded border border-neutral-800"
								>
									<span className="text-sm">{cat.name}</span>
									<button
										type="button"
										onClick={() => deleteCategory(cat.id)}
										className="text-red-500 hover:text-red-400 text-xs font-bold uppercase"
									>
										Delete
									</button>
								</div>
							))}
							{categories.length === 0 && (
								<p className="text-xs text-neutral-500 italic">
									No categories created yet.
								</p>
							)}
						</div>
					</section>
				</div>

				{/* SERVICE MANAGEMENT */}
				<section>
					<div className="flex justify-between items-center mb-4">
						<h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500">
							Service Menu Previews
						</h2>
						<button
							type="button"
							onClick={() => setIsAdding(!isAdding)}
							className="text-sm font-semibold text-emerald-400 hover:text-emerald-300"
						>
							{isAdding ? "Cancel Adding" : "+ Add New Service"}
						</button>
					</div>

					<div className="space-y-4">
						{/* ADD FORM */}
						{isAdding && (
							<div className="p-6 bg-neutral-900 border border-emerald-500/50 rounded-xl mb-6 shadow-lg shadow-emerald-900/20">
								<div className="grid gap-4 mb-4">
									<input
										placeholder="Service Name (e.g., Oil Change)"
										className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-emerald-500 outline-none"
										value={addForm.name}
										onChange={(e) =>
											setAddForm({ ...addForm, name: e.target.value })
										}
									/>
									<textarea
										placeholder="Description..."
										className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-emerald-500 outline-none h-24"
										value={addForm.description}
										onChange={(e) =>
											setAddForm({ ...addForm, description: e.target.value })
										}
									/>

									<div className="grid grid-cols-2 gap-4">
										<div>
											<label
												htmlFor="set-category"
												className="text-xs text-neutral-400 block mb-1"
											>
												Category
											</label>
											<select
												id="set-category"
												className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-emerald-500 outline-none appearance-none"
												value={addForm.category_id}
												onChange={(e) =>
													setAddForm({
														...addForm,
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
												htmlFor="set-pricing"
												className="text-xs text-neutral-400 block mb-1"
											>
												Pricing Model
											</label>
											<select
												id="set-pricing"
												className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-emerald-500 outline-none appearance-none"
												value={addForm.pricing_type}
												onChange={(e) =>
													setAddForm({
														...addForm,
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

									<div className="flex items-center gap-4 mt-2">
										{addForm.pricing_type === "hourly" && (
											<>
												<label
													htmlFor="set-hours"
													className="text-sm text-neutral-400"
												>
													Est. Hours:
												</label>
												<input
													id="set-hours"
													type="number"
													step="0.1"
													className="w-32 bg-neutral-950 border border-neutral-700 rounded p-3 text-white outline-none"
													value={addForm.estimated_hours}
													onChange={(e) =>
														setAddForm({
															...addForm,
															estimated_hours: Number(e.target.value),
														})
													}
												/>
											</>
										)}
										{addForm.pricing_type === "fixed" && (
											<>
												<label
													htmlFor="set-price"
													className="text-sm text-neutral-400"
												>
													Fixed Price ($):
												</label>
												<input
													id="set-price"
													type="number"
													step="1"
													className="w-32 bg-neutral-950 border border-neutral-700 rounded p-3 text-white outline-none"
													value={addForm.fixed_price}
													onChange={(e) =>
														setAddForm({
															...addForm,
															fixed_price: Number(e.target.value),
														})
													}
												/>
											</>
										)}
									</div>
								</div>
								<button
									type="button"
									onClick={saveNewService}
									className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded font-bold text-sm"
								>
									Create Service
								</button>
							</div>
						)}

						{/* ACCORDION FOLDERS */}
						{Object.entries(groupedServices).map(
							([category, categoryServices]) => {
								const isOpen = openFolders[category] || false;

								return (
									<div
										key={category}
										className="border border-red-900/30 rounded-lg overflow-hidden bg-neutral-950/50 mb-6 shadow-lg"
									>
										<button
											type="button"
											onClick={() => toggleFolder(category)}
											aria-expanded={isOpen}
											className="w-full flex justify-between items-center p-5 md:p-6 bg-gradient-to-r from-red-950/40 to-neutral-900/40 hover:from-red-900/50 transition-colors text-left border-b border-transparent data-[open=true]:border-red-900/30"
											data-open={isOpen}
										>
											<h2 className="text-xl md:text-2xl font-bold text-white uppercase tracking-widest flex items-center gap-3">
												<span className="text-red-600">{"///"}</span> {category}
											</h2>
											<div className="flex items-center gap-4">
												<span className="text-xs font-mono text-red-500/70 uppercase hidden md:block">
													{categoryServices.length}{" "}
													{categoryServices.length === 1
														? "Service"
														: "Services"}
												</span>
												<span className="text-red-500 font-mono text-3xl font-light leading-none w-6 text-center">
													{isOpen ? "−" : "+"}
												</span>
											</div>
										</button>

										{isOpen && (
											<div className="p-2 md:p-4 space-y-2">
												{categoryServices.map((service) => (
													<div key={service.id}>
														{editingId === service.id ? (
															<div className="p-6 bg-neutral-800/30 border-l-4 border-emerald-500 rounded my-2">
																<div className="grid gap-4 mb-4">
																	<input
																		className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-white"
																		value={editForm.name}
																		onChange={(e) =>
																			setEditForm({
																				...editForm,
																				name: e.target.value,
																			})
																		}
																	/>
																	<textarea
																		className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-white h-24"
																		value={editForm.description}
																		onChange={(e) =>
																			setEditForm({
																				...editForm,
																				description: e.target.value,
																			})
																		}
																	/>
																	<div className="grid grid-cols-2 gap-4">
																		<select
																			className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-white"
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
																		<select
																			className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-white"
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
																			<option value="hourly">
																				Hourly Rate
																			</option>
																			<option value="fixed">Fixed Price</option>
																			<option value="contact">
																				Call for Quote
																			</option>
																		</select>
																	</div>

																	<div className="flex gap-4">
																		{editForm.pricing_type === "hourly" && (
																			<input
																				type="number"
																				step="0.1"
																				value={editForm.estimated_hours}
																				onChange={(e) =>
																					setEditForm({
																						...editForm,
																						estimated_hours: Number(
																							e.target.value,
																						),
																					})
																				}
																				className="w-32 bg-neutral-950 border border-neutral-700 rounded p-3 text-white"
																			/>
																		)}
																		{editForm.pricing_type === "fixed" && (
																			<input
																				type="number"
																				step="1"
																				value={editForm.fixed_price}
																				onChange={(e) =>
																					setEditForm({
																						...editForm,
																						fixed_price: Number(e.target.value),
																					})
																				}
																				className="w-32 bg-neutral-950 border border-neutral-700 rounded p-3 text-white"
																			/>
																		)}
																	</div>
																</div>
																<div className="flex gap-3">
																	<button
																		type="button"
																		onClick={() => saveEdit(service.id)}
																		className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded font-bold text-sm"
																	>
																		Save
																	</button>
																	<button
																		type="button"
																		onClick={() => deleteService(service)}
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
																					$
																					{service.calculated_price?.toFixed(2)}
																				</span>
																			</div>
																		</div>
																	)}

																	{/* ADMIN CONTROLS (Edit Button) */}
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
												))}
											</div>
										)}
									</div>
								);
							},
						)}
					</div>
				</section>
			</div>
		</div>
	);
}
