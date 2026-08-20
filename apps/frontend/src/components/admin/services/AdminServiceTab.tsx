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
import type {
	Category,
	CategoryActionResult,
	Service,
	ServiceFormData,
} from "@/types";
import { authApiRequest } from "@/utils/api";
import { AdminButton } from "../../ui/AdminButton";
import { FaFolderPlus, FaPlus, FaMinus } from "react-icons/fa";
import { Modal } from "../../ui/modal/Modal"

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

	const [isCreatingService, setIsCreatingService] = useState<boolean>(false);
	const [isManagingCategories, setIsManagingCategories] = useState<boolean>(false);

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
	const saveNewCategory = async (nameToSave: string): Promise<CategoryActionResult> => {
		try {
			const newCat = await authApiRequest<Category>("/api/admin/categories", {
				method: "POST",
				body: JSON.stringify({ name: nameToSave }),
			});
			setCategories((prev) => [...prev, newCat]);
			
			toast.success(`Created "${nameToSave}"`)
			return { ok: true };
		} catch (error) {
			const message = error instanceof Error
				? error.message
				: `Failed to create "${nameToSave}".`;
			return { ok: false, message: message }			
		}
	};

	const updateCategory = async (category: Category): Promise<CategoryActionResult> => {
		try {
			const updatedCat = await authApiRequest<Category>(`/api/admin/categories/${category.id}`, {
				method: "PATCH",
				body: JSON.stringify({ name: category.name, id: category.id }),
			})
			
			setCategories((prev) =>
				prev.map((cat) =>
					cat.id === updatedCat.id ? {...cat, name: updatedCat.name} : cat
				),
			);

			setServices((prev) => 
				prev.map((service) =>
					service.categories?.id === updatedCat.id
						? {
							...service,
							categories: { ...service.categories, name: updatedCat.name}
						}
					: service
				),
			);
			toast.success("Category Updated.");
			return { ok: true };
		} catch (error) {
			const message = error instanceof Error
				? error.message
				: `Failed to update "${category.name}".`;
			return { ok: false, message: message };
		}
	}

	const deleteCategory = async (id: string): Promise<CategoryActionResult> => {
		const hasServices = services.some(
			(service) => service.category_id === id || service.categories?.id === id,
		);
		if (hasServices) {
			return {
				ok: false,
				message:
					"This category must be empty before it can be deleted. Move or delete its services first.",
			};
		}

		try {
			await authApiRequest(`/api/admin/categories/${id}`, { method: "DELETE" });
			setCategories((prev) => prev.filter((c) => c.id !== id));
			toast.success("Category deleted.");
			return { ok: true };
		} catch (error) {
			const message = error instanceof Error
				? error.message
				: `Failed to delete "${id}".`;
			return { ok: false, message: message };
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

			const calcPrice = calculateServicePrice(updatedService, hourlyRate ?? 0);

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

			setIsCreatingService(false);

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
					<p className="text-neutral-300 text-sm">
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
					<p className="text-neutral-300 text-sm">
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
				<p className="text-neutral-300 text-sm">
					Manage shop rate, categories, and services.
				</p>
			</div>

			<div>
				<ShopRateManager
					key={hourlyRate}
					initialRate={hourlyRate}
					onSaveRate={saveRate}
				/>
				{/* <CategoryManager
					categories={categories}
					onSaveCategory={saveNewCategory}
					onDeleteCategory={deleteCategory}
				/> */}
			</div>

			{/* SERVICE MANAGEMENT */}
			<section>
				<div className="flex justify-between items-center mb-2">
					<h2 className="text-xs font-bold uppercase tracking-widest text-neutral-300">
						Service Menu Previews
					</h2>
				</div>

				<div className="flex justify-between">
					<AdminButton
						variant="text"
						className="text-emerald-400"
						onClick={() => setIsCreatingService(!isCreatingService)}
					>
						 {isCreatingService ? (<><FaMinus/> Cancel</>) : (<><FaPlus/> Create Service</>)}
					</AdminButton>
					
					<Modal
						open={isManagingCategories}
						onOpenChange={setIsManagingCategories}
						title="Manage Categories"
						description="Create/Delete Categories -- Categories must be empty before delete"
						size="xl"
					>
						<CategoryManager
							categories={categories}
							onDeleteCategory={deleteCategory}
							onSaveCategory={saveNewCategory}
							onUpdateCategory={updateCategory}
						/>
					</Modal>

					<AdminButton
						variant="text"
						className="text-emerald-400"
						onClick={() => setIsManagingCategories(true)}
						iconLeft=<FaFolderPlus/>

					>
						Mange Categories
					</AdminButton>

				</div>

				<div className="space-y-4">
					{/* ADD FORM */}
					{isCreatingService && (
						<ServiceForm
							categories={categories}
							onSave={saveNewService}
							onCancel={() => setIsCreatingService(false)}
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
		</div >
	);
}
