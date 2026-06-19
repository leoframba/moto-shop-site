"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { toast } from "sonner";
import type { AdminUser, InvoiceBike, InvoiceBikeFormData } from "@/types";
import { authApiRequest } from "@/utils/api";

const getUserDisplayName = (user: AdminUser): string => {
	const fullName = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();
	return fullName || user.email;
};

const getInitialBikeFormData = (): InvoiceBikeFormData => {
	const defaultYear = new Date().getFullYear();
	return {
		owner_id: "",
		year: defaultYear,
		make: "",
		model: "",
		vin: "",
		license_plate: "",
		color: "",
		admin_notes: "",
	};
};

const toBikeFormData = (bike: InvoiceBike): InvoiceBikeFormData => ({
	owner_id: bike.owner_id ?? "",
	year: bike.year,
	make: bike.make,
	model: bike.model,
	vin: bike.vin ?? "",
	license_plate: bike.license_plate ?? "",
	color: bike.color ?? "",
	admin_notes: bike.admin_notes ?? "",
});

const toBikePayload = (formData: InvoiceBikeFormData) => ({
	owner_id: formData.owner_id || null,
	year: formData.year,
	make: formData.make.trim(),
	model: formData.model.trim(),
	vin: formData.vin.trim() || null,
	license_plate: formData.license_plate.trim() || null,
	color: formData.color.trim() || null,
	admin_notes: formData.admin_notes.trim() || null,
});

interface BikeSearchFilters {
	vin: string;
	plate: string;
	owner: string;
	year: string;
}

const getInitialBikeSearchFilters = (): BikeSearchFilters => ({
	vin: "",
	plate: "",
	owner: "",
	year: "",
});

const getOwnerSearchText = (bike: InvoiceBike): string => {
	if (!bike.owner) return "";
	const ownerName =
		`${bike.owner.first_name ?? ""} ${bike.owner.last_name ?? ""}`.trim();
	return `${ownerName} ${bike.owner.email}`.toLowerCase();
};

const getOwnerDisplayName = (bike: InvoiceBike): string => {
	if (!bike.owner) return "—";
	return getUserDisplayName(bike.owner);
};

const getBikeLabel = (bike: InvoiceBike): string =>
	`${bike.year} ${bike.make} ${bike.model}`;

interface BikeManagerFormProps {
	formData: InvoiceBikeFormData;
	users: AdminUser[];
	isSaving: boolean;
	onChange: (field: keyof InvoiceBikeFormData, value: string | number) => void;
	onSave: () => Promise<void>;
	onCancel: () => void;
	isEditing: boolean;
}

function BikeManagerForm({
	formData,
	users,
	isSaving,
	onChange,
	onSave,
	onCancel,
	isEditing,
}: BikeManagerFormProps) {
	const currentYear = new Date().getFullYear();
	const years = useMemo(
		() =>
			Array.from(
				{ length: currentYear - 1970 + 2 },
				(_, i) => currentYear + 1 - i,
			),
		[currentYear],
	);

	return (
		<div className="bg-neutral-900 border border-neutral-800 p-6 rounded-lg mb-8">
			<h3 className="text-lg font-bold text-white mb-5 uppercase tracking-widest">
				{isEditing ? "Edit Bike" : "Add Bike"}
			</h3>

			<div className="grid md:grid-cols-3 gap-4 mb-4">
				<div className="md:col-span-3">
					<label
						htmlFor="bike-owner"
						className="text-xs text-neutral-400 block mb-1"
					>
						Owner
					</label>
					<select
						id="bike-owner"
						value={formData.owner_id}
						onChange={(e) => onChange("owner_id", e.target.value)}
						className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-emerald-500 outline-none"
					>
						<option value="">No owner linked</option>
						{users.map((user) => (
							<option key={user.id} value={user.id}>
								{getUserDisplayName(user)} ({user.email})
							</option>
						))}
					</select>
				</div>

				<div>
					<label
						htmlFor="bike-year"
						className="text-xs text-neutral-400 block mb-1"
					>
						Year
					</label>
					<select
						id="bike-year"
						value={formData.year}
						onChange={(e) => onChange("year", Number(e.target.value))}
						className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-emerald-500 outline-none"
					>
						{years.map((year) => (
							<option key={year} value={year}>
								{year}
							</option>
						))}
					</select>
				</div>
				<div>
					<label
						htmlFor="bike-make"
						className="text-xs text-neutral-400 block mb-1"
					>
						Make
					</label>
					<input
						id="bike-make"
						value={formData.make}
						onChange={(e) => onChange("make", e.target.value)}
						placeholder="e.g. Yamaha"
						className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-emerald-500 outline-none"
					/>
				</div>
				<div>
					<label
						htmlFor="bike-model"
						className="text-xs text-neutral-400 block mb-1"
					>
						Model
					</label>
					<input
						id="bike-model"
						value={formData.model}
						onChange={(e) => onChange("model", e.target.value)}
						placeholder="e.g. MT-09"
						className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-emerald-500 outline-none"
					/>
				</div>
				<div>
					<label
						htmlFor="bike-vin"
						className="text-xs text-neutral-400 block mb-1"
					>
						VIN
					</label>
					<input
						id="bike-vin"
						value={formData.vin}
						onChange={(e) => onChange("vin", e.target.value)}
						placeholder="Optional"
						className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-emerald-500 outline-none"
					/>
				</div>
				<div>
					<label
						htmlFor="bike-plate"
						className="text-xs text-neutral-400 block mb-1"
					>
						License Plate
					</label>
					<input
						id="bike-plate"
						value={formData.license_plate}
						onChange={(e) => onChange("license_plate", e.target.value)}
						placeholder="Optional"
						className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-emerald-500 outline-none"
					/>
				</div>
				<div>
					<label
						htmlFor="bike-color"
						className="text-xs text-neutral-400 block mb-1"
					>
						Color
					</label>
					<input
						id="bike-color"
						value={formData.color}
						onChange={(e) => onChange("color", e.target.value)}
						placeholder="Optional"
						className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-emerald-500 outline-none"
					/>
				</div>
			</div>

			<div className="mb-4">
				<label
					htmlFor="bike-notes"
					className="text-xs text-neutral-400 block mb-1"
				>
					Admin Notes
				</label>
				<textarea
					id="bike-notes"
					value={formData.admin_notes}
					onChange={(e) => onChange("admin_notes", e.target.value)}
					placeholder="Internal notes for invoice prep..."
					className="w-full h-24 bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-emerald-500 outline-none"
				/>
			</div>

			<div className="flex gap-3">
				<button
					type="button"
					onClick={() => void onSave()}
					disabled={isSaving}
					className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-700 px-6 py-2 rounded font-bold text-sm transition-colors"
				>
					{isSaving ? "Saving..." : isEditing ? "Save Bike" : "Create Bike"}
				</button>
				<button
					type="button"
					onClick={onCancel}
					disabled={isSaving}
					className="bg-neutral-800 hover:bg-neutral-700 px-4 py-2 rounded font-bold text-sm transition-colors"
				>
					Cancel
				</button>
			</div>
		</div>
	);
}

export default function AdminBikesTab() {
	const [bikes, setBikes] = useState<InvoiceBike[]>([]);
	const [users, setUsers] = useState<AdminUser[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [isFormVisible, setIsFormVisible] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [editingBikeId, setEditingBikeId] = useState<string | null>(null);
	const [deletingBikeId, setDeletingBikeId] = useState<string | null>(null);
	const [formData, setFormData] = useState<InvoiceBikeFormData>(
		getInitialBikeFormData,
	);
	const [searchFilters, setSearchFilters] = useState<BikeSearchFilters>(
		getInitialBikeSearchFilters,
	);

	const fetchBikesAndUsers = useCallback(async () => {
		setIsLoading(true);
		try {
			const [bikeRows, userRows] = await Promise.all([
				authApiRequest<InvoiceBike[]>("/api/admin/bikes", {
					cache: "no-store",
				}),
				authApiRequest<AdminUser[]>("/api/admin/users", { cache: "no-store" }),
			]);
			setBikes(bikeRows);
			setUsers(userRows);
		} catch (error) {
			console.error(error);
			toast.error("Failed to load bikes manager data.");
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		void fetchBikesAndUsers();
	}, [fetchBikesAndUsers]);

	const resetFormState = () => {
		setFormData(getInitialBikeFormData());
		setIsEditing(false);
		setEditingBikeId(null);
	};

	const openCreateForm = () => {
		resetFormState();
		setIsFormVisible(true);
	};

	const closeForm = () => {
		resetFormState();
		setIsFormVisible(false);
	};

	const handleSave = async () => {
		if (!formData.make.trim() || !formData.model.trim()) {
			toast.warning("Make and model are required.");
			return;
		}

		setIsSaving(true);
		try {
			if (isEditing && editingBikeId) {
				await authApiRequest<InvoiceBike>(`/api/admin/bikes/${editingBikeId}`, {
					method: "PATCH",
					body: JSON.stringify(toBikePayload(formData)),
				});
				toast.success("Bike updated.");
			} else {
				await authApiRequest<InvoiceBike>("/api/admin/bikes", {
					method: "POST",
					body: JSON.stringify(toBikePayload(formData)),
				});
				toast.success("Bike created.");
			}

			closeForm();
			await fetchBikesAndUsers();
		} catch (error) {
			console.error(error);
			toast.error("Failed to save bike.");
		} finally {
			setIsSaving(false);
		}
	};

	const handleEdit = (bike: InvoiceBike) => {
		setIsEditing(true);
		setEditingBikeId(bike.id);
		setFormData(toBikeFormData(bike));
		setIsFormVisible(true);
	};

	const handleFormChange = (
		field: keyof InvoiceBikeFormData,
		value: string | number,
	) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleDelete = async (bike: InvoiceBike) => {
		const confirmed = window.confirm(
			`Delete ${getBikeLabel(bike)}? This cannot be undone.`,
		);
		if (!confirmed) return;

		setDeletingBikeId(bike.id);
		try {
			await authApiRequest<{ message: string }>(`/api/admin/bikes/${bike.id}`, {
				method: "DELETE",
			});
			toast.success("Bike deleted.");
			if (editingBikeId === bike.id) {
				closeForm();
			}
			await fetchBikesAndUsers();
		} catch (error) {
			console.error(error);
			toast.error("Failed to delete bike.");
		} finally {
			setDeletingBikeId(null);
		}
	};

	const handleSearchChange = (
		field: keyof BikeSearchFilters,
		value: string,
	) => {
		setSearchFilters((prev) => ({ ...prev, [field]: value }));
	};

	const clearSearchFilters = () => {
		setSearchFilters(getInitialBikeSearchFilters());
	};

	const filteredBikes = useMemo(() => {
		const vinQuery = searchFilters.vin.trim().toLowerCase();
		const plateQuery = searchFilters.plate.trim().toLowerCase();
		const ownerQuery = searchFilters.owner.trim().toLowerCase();
		const yearQuery = searchFilters.year.trim();

		return bikes.filter((bike) => {
			const bikeVin = (bike.vin ?? "").toLowerCase();
			const bikePlate = (bike.license_plate ?? "").toLowerCase();
			const bikeOwner = getOwnerSearchText(bike);
			const bikeYear = String(bike.year);

			if (vinQuery && !bikeVin.includes(vinQuery)) return false;
			if (plateQuery && !bikePlate.includes(plateQuery)) return false;
			if (ownerQuery && !bikeOwner.includes(ownerQuery)) return false;
			if (yearQuery && !bikeYear.includes(yearQuery)) return false;

			return true;
		});
	}, [bikes, searchFilters]);

	return (
		<div className="max-w-5xl mx-auto pb-20">
			<div className="mb-8 flex justify-between items-end">
				<div>
					<h2 className="text-3xl font-bold tracking-tight text-white mb-1">
						Bikes Manager
					</h2>
					<p className="text-neutral-400 text-sm">
						Create and edit bikes for future invoice workflows.
					</p>
				</div>
				<button
					type="button"
					onClick={openCreateForm}
					className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded font-bold uppercase tracking-widest text-sm transition-all inline-flex items-center gap-2 shadow-lg"
				>
					<FiPlus className="h-4 w-4" /> New Bike
				</button>
			</div>

			{isFormVisible && (
				<BikeManagerForm
					formData={formData}
					users={users}
					isSaving={isSaving}
					isEditing={isEditing}
					onChange={handleFormChange}
					onSave={handleSave}
					onCancel={closeForm}
				/>
			)}

			{isLoading ? (
				<div className="text-center py-20 text-neutral-500 animate-pulse uppercase tracking-widest font-bold">
					Loading Bikes...
				</div>
			) : bikes.length === 0 ? (
				<div className="border border-dashed border-neutral-800 rounded-lg p-10 text-center bg-neutral-900/20 text-neutral-500 uppercase tracking-widest text-sm">
					No bikes in manager yet.
				</div>
			) : (
				<>
					<div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 mb-4">
						<div className="flex items-center justify-between mb-3">
							<p className="text-xs uppercase tracking-widest text-neutral-400 font-bold">
								Search Bikes
							</p>
							<button
								type="button"
								onClick={clearSearchFilters}
								className="text-xs text-neutral-400 hover:text-white uppercase tracking-widest font-bold"
							>
								Clear
							</button>
						</div>

						<div className="grid md:grid-cols-4 gap-3">
							<input
								placeholder="Search VIN"
								value={searchFilters.vin}
								onChange={(e) => handleSearchChange("vin", e.target.value)}
								className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-sm text-white focus:border-emerald-500 outline-none"
							/>
							<input
								placeholder="Search plate"
								value={searchFilters.plate}
								onChange={(e) => handleSearchChange("plate", e.target.value)}
								className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-sm text-white focus:border-emerald-500 outline-none"
							/>
							<input
								placeholder="Search owner"
								value={searchFilters.owner}
								onChange={(e) => handleSearchChange("owner", e.target.value)}
								className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-sm text-white focus:border-emerald-500 outline-none"
							/>
							<input
								placeholder="Search year"
								value={searchFilters.year}
								onChange={(e) => handleSearchChange("year", e.target.value)}
								className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-sm text-white focus:border-emerald-500 outline-none"
							/>
						</div>
					</div>

					{filteredBikes.length === 0 ? (
						<div className="border border-dashed border-neutral-800 rounded-lg p-10 text-center bg-neutral-900/20 text-neutral-500 uppercase tracking-widest text-sm">
							No bikes match current filters.
						</div>
					) : (
						<div className="overflow-x-auto rounded-lg border border-neutral-800">
							<table className="w-full min-w-[56rem] border-collapse bg-neutral-900">
								<thead>
									<tr className="border-b border-neutral-800 bg-neutral-900/80 text-left text-xs font-bold uppercase tracking-widest text-neutral-400">
										<th className="px-4 py-3">Bike</th>
										<th className="px-4 py-3">Owner</th>
										<th className="px-4 py-3">VIN</th>
										<th className="px-4 py-3">Plate</th>
										<th className="px-4 py-3 text-right">Actions</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-neutral-800">
									{filteredBikes.map((bike) => (
										<tr key={bike.id}>
											<td className="px-4 py-3 font-bold text-white">
												{getBikeLabel(bike)}
											</td>
											<td className="max-w-[14rem] px-4 py-3">
												<p className="text-sm text-neutral-300">
													{getOwnerDisplayName(bike)}
												</p>
												{bike.owner?.email && (
													<p className="truncate text-xs text-neutral-500">
														{bike.owner.email}
													</p>
												)}
											</td>
											<td className="px-4 py-3 text-sm text-neutral-300">
												{bike.vin ?? "—"}
											</td>
											<td className="px-4 py-3 text-sm text-neutral-300">
												{bike.license_plate ?? "—"}
											</td>
											<td className="px-4 py-3">
												<div className="flex items-center justify-end gap-2">
													<button
														type="button"
														onClick={() => handleEdit(bike)}
														className="rounded bg-neutral-800 px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-neutral-700"
													>
														Edit
													</button>
													<button
														type="button"
														onClick={() => void handleDelete(bike)}
														disabled={deletingBikeId === bike.id}
														className="inline-flex items-center gap-1 rounded bg-red-900/60 px-3 py-2 text-xs font-bold uppercase tracking-widest hover:bg-red-800/70 disabled:bg-neutral-700"
													>
														<FiTrash2 className="h-3.5 w-3.5" />
														{deletingBikeId === bike.id
															? "Deleting..."
															: "Delete"}
													</button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</>
			)}
		</div>
	);
}
