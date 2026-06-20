"use client";
import { useLayoutEffect, useState } from "react";
import { toast } from "sonner";
import AdminCategoryFolder from "@/components/admin/services/AdminCategoryFolder";
import CategoryManager from "@/components/admin/services/CategoryManager";
import ServiceForm from "@/components/admin/services/ServiceForm";
import ShopRateManager from "@/components/admin/services/ShopRateManager";
import AdminServicesSkeleton from "@/components/services/AdminServicesSkeleton";
import { useServices } from "@/hooks/useServices";
import { confirmDeleteToast } from "@/lib/confirm-toast";
import type { Category, Service, ServiceFormData } from "@/types";
import { authApiRequest } from "@/utils/api";

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

export default function AdminServiceTab() {
	const { data, isLoading, hasError } = useServices({ admin: true });
	const [hourlyRate, setHourlyRate] = useState<number | null>(null);
	const [categories, setCategories] = useState<Category[]>([]);
	const [services, setServices] = useState<Service[]>([]);
	const [isHydrated, setIsHydrated] = useState(false);

	useLayoutEffect(() => {
		if (!data) {
			setIsHydrated(false);
			return;
		}

		setHourlyRate(data.hourly_rate);
		setCategories(data.categories);
		setServices(data.services);
		setIsHydrated(true);
	}, [data]);

	const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});

	const toggleFolder = (categoryName: string) => {
		setOpenFolders((prev) => ({
			...prev,
			[categoryName]: !prev[categoryName],
		}));
	};

	const [isAdding, setIsAdding] = useState(false);

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
			toast.success("Shop rate updated successfully!");
		} catch (error) {
			console.error(error);
			toast.error("Failed to save rate.");
		}
	};

	// ==========================================
	// CATEGORIES
	// ==========================================
	const saveNewCategory = async (nameToSave: string) => {
		try {
			const newCat = await authApiRequest<Category>("/api/admin/categories", {
				method: "POST",
				body: JSON.stringify({ name: nameToSave }),
			});
			setCategories([...categories, newCat]);

			return true;
		} catch {
			toast.error(
				`Failed to create "${nameToSave}". This category name likely already exists.`,
			);
			return false;
		}
	};

	const performDeleteCategory = async (id: string) => {
		try {
			await authApiRequest(`/api/admin/categories/${id}`, { method: "DELETE" });
			setCategories((prev) => prev.filter((c) => c.id !== id));
			toast.success("Category deleted.");
		} catch {
			toast.error(
				"Cannot delete category. There are still services assigned to it. Please edit or delete those services first.",
			);
		}
	};

	const deleteCategory = async (id: string) => {
		const category = categories.find((c) => c.id === id);
		confirmDeleteToast({
			title: `Delete "${category?.name ?? "category"}"?`,
			description:
				"This will fail if services are currently assigned to this category.",
			onConfirm: () => performDeleteCategory(id),
		});
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

			const calcPrice = calculateServicePrice(updatedService, hourlyRate ?? 0);

			const selectedCat = categories.find((c) => c.id === editData.category_id);

			const completeService: Service = {
				...updatedService,
				calculated_price: calcPrice,
				categories: selectedCat,
				is_internal: editData.is_internal,
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
			toast.error("Failed to save changes.");
		}
	};

	const saveNewService = async (formData: ServiceFormData) => {
		try {
			const newService = await authApiRequest<Service>("/api/admin/services", {
				method: "POST",
				body: JSON.stringify(formData),
			});

			const calcPrice = calculateServicePrice(
				formData as Service,
				hourlyRate ?? 0,
			);
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
			toast.error("Failed to add new service.");
		}
	};

	const performDeleteService = async (serviceToDelete: Service) => {
		const prevServices = [...services];
		setServices((prev) =>
			prev.filter((service) => service.id !== serviceToDelete.id),
		);

		try {
			await authApiRequest(`/api/admin/services/${serviceToDelete.id}`, {
				method: "DELETE",
			});
			toast.success(`"${serviceToDelete.name}" deleted.`);
		} catch (error) {
			console.error("Error deleting service:", error);
			setServices(prevServices);
			toast.error("Failed to delete service.");
		}
	};

	const deleteService = async (serviceToDelete: Service) => {
		confirmDeleteToast({
			title: `Delete "${serviceToDelete.name}"?`,
			description: "This service will be permanently removed from the menu.",
			onConfirm: () => performDeleteService(serviceToDelete),
		});
	};

	const toggleServiceVisibility = async (serviceToToggle: Service) => {
		if (serviceToToggle.is_internal) return;

		const nextHidden = !serviceToToggle.is_hidden;
		const prevServices = [...services];
		setServices((prev) =>
			prev.map((service) =>
				service.id === serviceToToggle.id
					? { ...service, is_hidden: nextHidden }
					: service,
			),
		);

		try {
			await authApiRequest(
				`/api/admin/services/${serviceToToggle.id}/visibility`,
				{
					method: "PATCH",
					body: JSON.stringify({ is_hidden: nextHidden }),
				},
			);
			toast.success(
				nextHidden
					? `"${serviceToToggle.name}" hidden from the public menu.`
					: `"${serviceToToggle.name}" is now visible on the public menu.`,
			);
		} catch (error) {
			console.error(error);
			setServices(prevServices);
			toast.error("Failed to update visibility.");
		}
	};

	const toggleServiceInternal = async (serviceToToggle: Service) => {
		const nextInternal = !serviceToToggle.is_internal;
		const prevServices = [...services];
		setServices((prev) =>
			prev.map((service) =>
				service.id === serviceToToggle.id
					? {
							...service,
							is_internal: nextInternal,
							is_hidden: nextInternal ? false : service.is_hidden,
						}
					: service,
			),
		);

		try {
			await authApiRequest(
				`/api/admin/services/${serviceToToggle.id}/internal`,
				{
					method: "PATCH",
					body: JSON.stringify({ is_internal: nextInternal }),
				},
			);
			toast.success(
				nextInternal
					? `"${serviceToToggle.name}" is now invoice only.`
					: `"${serviceToToggle.name}" is back in the public catalog.`,
			);
		} catch (error) {
			console.error(error);
			setServices(prevServices);
			toast.error("Failed to update service scope.");
		}
	};

	// Group logic
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

	// Service sort logic
	Object.keys(groupedServices).forEach((key) => {
		groupedServices[key].sort((a, b) => a.name.localeCompare(b.name));
	});

	if (isLoading || !data || !isHydrated || hourlyRate === null) {
		return (
			<div className="max-w-5xl mx-auto pb-20">
				<div className="mb-8">
					<h2 className="text-3xl font-bold tracking-tight text-white mb-1">
						Service Management
					</h2>
					<p className="text-neutral-400 text-sm">
						Manage shop rate, categories, and services.
					</p>
				</div>
				<AdminServicesSkeleton />
			</div>
		);
	}

	if (hasError) {
		return (
			<div className="max-w-5xl mx-auto pb-20">
				<div className="bg-red-950/30 border border-red-900/50 p-8 text-center rounded">
					<h3 className="text-red-500 font-bold uppercase tracking-widest mb-2">
						Failed to Load Services
					</h3>
					<p className="text-neutral-400 text-sm">
						Could not reach the backend. Check your connection and try
						refreshing.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-5xl mx-auto pb-20">
			<div className="mb-8">
				<h2 className="text-3xl font-bold tracking-tight text-white mb-1">
					Service Management
				</h2>
				<p className="text-neutral-400 text-sm">
					Manage shop rate, categories, and services.
				</p>
			</div>

			<div className="grid md:grid-cols-2 gap-6 mb-12">
				<ShopRateManager
					key={hourlyRate}
					initialRate={hourlyRate}
					onSaveRate={saveRate}
				/>
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
								onToggleHidden={toggleServiceVisibility}
								onToggleInternal={toggleServiceInternal}
							/>
						),
					)}
				</div>
			</section>
		</div>
	);
}
