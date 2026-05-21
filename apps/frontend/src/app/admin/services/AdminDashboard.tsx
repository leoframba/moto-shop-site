"use client";
import { useState } from "react";
import AdminCategoryFolder from "@/components/admin/AdminCategoryFolder";
import CategoryManager from "@/components/admin/CategoryManager";
import ServiceForm from "@/components/admin/ServiceForm";
import ShopRateManager from "@/components/admin/ShopRateManager";
import type {
	AdminInitialData,
	Category,
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

	// Add service states
	const [isAdding, setIsAdding] = useState(false);

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

			const selectedCat = categories.find((c) => c.id === editData.category_id);

			const completeService: Service = {
				...updatedService,
				calculated_price: calcPrice,
				categories: selectedCat,
			};

			setServices((prev) =>
				prev.map((s) => (s.id === id ? completeService : s)),
			);

			setOpenFolders((prev) => ({
				...prev,
				[selectedCat?.name || "Uncategorized"]: true,
			}));
		} catch (error) {
			console.error(error);
			alert("Failed to save changes.");
		}
	};

	const saveNewService = async (formData: ServiceFormData) => {
		try {
			const newService = await authApiRequest<Service>("/api/admin/services", {
				method: "POST",
				body: JSON.stringify(formData),
			});

			const calcPrice = calculateServicePrice(formData as Service, hourlyRate);
			const selectedCat = categories.find((c) => c.id === formData.category_id);

			const completeService: Service = {
				...newService,
				calculated_price: calcPrice,
				categories: selectedCat,
			};

			setServices([...services, completeService]);

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

	const UNCATEGORIZED = "Uncategorized";
	const groupedServices: Record<string, Service[]> = {};

	categories.forEach((cat) => {
		groupedServices[cat.name] = [];
	});

	services.forEach((service) => {
		const catName = service.categories?.name ?? UNCATEGORIZED;

		if (!groupedServices[catName]) {
			groupedServices[catName] = [];
		}
		groupedServices[catName].push(service);
	});

	Object.keys(groupedServices).forEach((key) => {
		groupedServices[key].sort((a, b) => a.name.localeCompare(b.name));
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
							<ServiceForm
								categories={categories}
								onSave={saveNewService}
								onCancel={() => setIsAdding(false)}
							/>
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
