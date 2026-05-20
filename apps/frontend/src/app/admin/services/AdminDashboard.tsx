"use client";
import { useEffect, useState } from "react";
import AdminCategoryFolder from "@/components/admin/AdminCategoryFolder";
import CategoryManager from "@/components/admin/CategoryManager";
import ShopRateManager from "@/components/admin/ShopRateManager";
import type {
	AdminInitialData,
	Category,
	PricingType,
	Service,
	ServiceFormData,
} from "@/types";
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

	const saveNewCategory = async (nameToSave: string) => {
		try {
			const newCat = await authApiRequest<Category>("/api/admin/categories", {
				method: "POST",
				body: JSON.stringify({ name: nameToSave }),
			});
			setCategories([...categories, newCat]);

			if (categories.length === 0) {
				setAddForm((prev) => ({ ...prev, category_id: newCat.id }));
			}

			return true;
		} catch {
			alert(
				`Failed to create "${nameToSave}". This category name likely already exists.`,
			);
			return false;
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
		} catch {
			alert(
				"Cannot delete category. There are still services assigned to it. Please edit or delete those services first.",
			);
		}
	};

	// ==========================================
	// SERVICES
	// ==========================================

	const saveEdit = async (id: string, editData: ServiceFormData) => {
		try {
			const updatedService = await authApiRequest<Service>(
				`/api/admin/services/${id}`,
				{
					method: "PATCH",
					body: JSON.stringify(editData),
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

	const groupedServices: Record<string, Service[]> = {};

	categories.forEach((cat) => {
		groupedServices[cat.name] = [];
	});

	services.forEach((service) => {
		const catName = service.categories?.name;

		if (catName && groupedServices[catName] !== undefined) {
			groupedServices[catName].push(service);
		} else {
			if (!groupedServices["Uncategorized"]) {
				groupedServices["Uncategorized"] = [];
			}
			groupedServices["Uncategorized"].push(service);
		}
	});

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
						initialRate={initialData.hourly_rate}
						onSaveRate={saveRate}
					/>

					{/* CATEGORY MANAGEMENT */}
					<CategoryManager
						categories={categories}
						onSaveCategory={saveNewCategory}
						onDeleteCategory={deleteCategory}
					/>
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
														pricing_type: e.target.value as PricingType,
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
							([category, categoryServices]) => (
								<AdminCategoryFolder
									key={category}
									category={category}
									services={categoryServices}
									categories={categories}
									isOpen={openFolders[category] || false}
									toggleFolder={() => toggleFolder(category)}
									onSaveEdit={saveEdit}
									onDelete={deleteService}
								/>
							),
						)}
					</div>
				</section>
			</div>
		</div>
	);
}
