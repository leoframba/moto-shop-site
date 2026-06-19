"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { toast } from "sonner";
import { AdminModal } from "@/components/admin/modals";
import type { Part, PartFormData } from "@/types";
import { authApiRequest } from "@/utils/api";

const getInitialPartFormData = (): PartFormData => ({
	part_number: "",
	description: "",
	base_price: 0,
});

const toPartPayload = (formData: PartFormData) => ({
	part_number: formData.part_number.trim(),
	description: formData.description.trim(),
	base_price: Number(formData.base_price),
});

interface PartSearchFilters {
	name: string;
	partNumber: string;
}

const getInitialPartSearchFilters = (): PartSearchFilters => ({
	name: "",
	partNumber: "",
});

interface PartFormProps {
	formData: PartFormData;
	isSaving: boolean;
	isEditing: boolean;
	onChange: (field: keyof PartFormData, value: string | number) => void;
	onSave: () => Promise<void>;
	onCancel: () => void;
}

function PartManagerForm({
	formData,
	isSaving,
	isEditing,
	onChange,
	onSave,
	onCancel,
}: PartFormProps) {
	return (
		<>
			<div className="grid md:grid-cols-3 gap-4 mb-4">
				<div>
					<label
						htmlFor="part-number"
						className="text-xs text-neutral-400 block mb-1"
					>
						Part Number
					</label>
					<input
						id="part-number"
						value={formData.part_number}
						onChange={(e) => onChange("part_number", e.target.value)}
						placeholder="e.g. BRK-1120"
						className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-emerald-500 outline-none"
					/>
				</div>
				<div className="md:col-span-2">
					<label
						htmlFor="part-description"
						className="text-xs text-neutral-400 block mb-1"
					>
						Description
					</label>
					<input
						id="part-description"
						value={formData.description}
						onChange={(e) => onChange("description", e.target.value)}
						placeholder="e.g. Rear brake pads"
						className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-emerald-500 outline-none"
					/>
				</div>
				<div>
					<label
						htmlFor="part-price"
						className="text-xs text-neutral-400 block mb-1"
					>
						Base Price
					</label>
					<input
						id="part-price"
						type="number"
						min={0}
						step={0.01}
						value={formData.base_price}
						onChange={(e) => onChange("base_price", Number(e.target.value))}
						className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-emerald-500 outline-none"
					/>
				</div>
			</div>

			<div className="flex gap-3">
				<button
					type="button"
					onClick={() => void onSave()}
					disabled={isSaving}
					className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-700 px-6 py-2 rounded font-bold text-sm transition-colors"
				>
					{isSaving ? "Saving..." : isEditing ? "Save Part" : "Create Part"}
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
		</>
	);
}

export default function AdminPartsTab() {
	const [parts, setParts] = useState<Part[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [isFormVisible, setIsFormVisible] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [editingPartId, setEditingPartId] = useState<string | null>(null);
	const [deletingPartId, setDeletingPartId] = useState<string | null>(null);
	const [formData, setFormData] = useState<PartFormData>(
		getInitialPartFormData,
	);
	const [searchFilters, setSearchFilters] = useState<PartSearchFilters>(
		getInitialPartSearchFilters,
	);

	const fetchParts = useCallback(async () => {
		setIsLoading(true);
		try {
			const partRows = await authApiRequest<Part[]>("/api/admin/parts", {
				cache: "no-store",
			});
			setParts(partRows);
		} catch (error) {
			console.error(error);
			toast.error("Failed to load parts.");
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		void fetchParts();
	}, [fetchParts]);

	const resetFormState = () => {
		setFormData(getInitialPartFormData());
		setIsEditing(false);
		setEditingPartId(null);
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
		if (!formData.part_number.trim() || !formData.description.trim()) {
			toast.warning("Part number and description are required.");
			return;
		}

		setIsSaving(true);
		try {
			if (isEditing && editingPartId) {
				await authApiRequest<Part>(`/api/admin/parts/${editingPartId}`, {
					method: "PATCH",
					body: JSON.stringify(toPartPayload(formData)),
				});
				toast.success("Part updated.");
			} else {
				await authApiRequest<Part>("/api/admin/parts", {
					method: "POST",
					body: JSON.stringify(toPartPayload(formData)),
				});
				toast.success("Part created.");
			}
			closeForm();
			await fetchParts();
		} catch (error) {
			console.error(error);
			toast.error("Failed to save part.");
		} finally {
			setIsSaving(false);
		}
	};

	const handleEdit = (part: Part) => {
		setIsEditing(true);
		setEditingPartId(part.id);
		setFormData({
			part_number: part.part_number,
			description: part.description,
			base_price: Number(part.base_price),
		});
		setIsFormVisible(true);
	};

	const handleFormChange = (
		field: keyof PartFormData,
		value: string | number,
	) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleDelete = async (part: Part) => {
		const confirmed = window.confirm(
			`Delete part ${part.part_number} (${part.description})? This cannot be undone.`,
		);
		if (!confirmed) return;

		setDeletingPartId(part.id);
		try {
			await authApiRequest<{ message: string }>(`/api/admin/parts/${part.id}`, {
				method: "DELETE",
			});
			toast.success("Part deleted.");
			if (editingPartId === part.id) {
				closeForm();
			}
			await fetchParts();
		} catch (error) {
			console.error(error);
			toast.error("Failed to delete part.");
		} finally {
			setDeletingPartId(null);
		}
	};

	const handleSearchChange = (
		field: keyof PartSearchFilters,
		value: string,
	) => {
		setSearchFilters((prev) => ({ ...prev, [field]: value }));
	};

	const clearSearchFilters = () => {
		setSearchFilters(getInitialPartSearchFilters());
	};

	const filteredParts = useMemo(() => {
		const partNumberQuery = searchFilters.partNumber.trim().toLowerCase();
		const nameQuery = searchFilters.name.trim().toLowerCase();

		return parts.filter((part) => {
			const partNumber = part.part_number.toLowerCase();
			const partName = part.description.toLowerCase();

			if (partNumberQuery && !partNumber.includes(partNumberQuery))
				return false;
			if (nameQuery && !partName.includes(nameQuery)) return false;
			return true;
		});
	}, [parts, searchFilters]);

	return (
		<div className="max-w-5xl mx-auto pb-20">
			<div className="mb-8 flex justify-between items-end">
				<div>
					<h2 className="text-3xl font-bold tracking-tight text-white mb-1">
						Parts Manager
					</h2>
					<p className="text-neutral-400 text-sm">
						Create and edit parts for invoice line items.
					</p>
				</div>
				<button
					type="button"
					onClick={openCreateForm}
					className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded font-bold uppercase tracking-widest text-sm transition-all inline-flex items-center gap-2 shadow-lg"
				>
					<FiPlus className="h-4 w-4" /> New Part
				</button>
			</div>

			<AdminModal
				open={isFormVisible}
				onClose={closeForm}
				title={isEditing ? "Edit Part" : "Add Part"}
				size="lg"
			>
				<PartManagerForm
					formData={formData}
					isSaving={isSaving}
					isEditing={isEditing}
					onChange={handleFormChange}
					onSave={handleSave}
					onCancel={closeForm}
				/>
			</AdminModal>

			{isLoading ? (
				<div className="text-center py-20 text-neutral-500 animate-pulse uppercase tracking-widest font-bold">
					Loading Parts...
				</div>
			) : parts.length === 0 ? (
				<div className="border border-dashed border-neutral-800 rounded-lg p-10 text-center bg-neutral-900/20 text-neutral-500 uppercase tracking-widest text-sm">
					No parts created yet.
				</div>
			) : (
				<>
					<div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 mb-4">
						<div className="flex items-center justify-between mb-3">
							<p className="text-xs uppercase tracking-widest text-neutral-400 font-bold">
								Search Parts
							</p>
							<button
								type="button"
								onClick={clearSearchFilters}
								className="text-xs text-neutral-400 hover:text-white uppercase tracking-widest font-bold"
							>
								Clear
							</button>
						</div>

						<div className="grid md:grid-cols-2 gap-3">
							<input
								placeholder="Search by part number"
								value={searchFilters.partNumber}
								onChange={(e) =>
									handleSearchChange("partNumber", e.target.value)
								}
								className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-sm text-white focus:border-emerald-500 outline-none"
							/>
							<input
								placeholder="Search by name"
								value={searchFilters.name}
								onChange={(e) => handleSearchChange("name", e.target.value)}
								className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-sm text-white focus:border-emerald-500 outline-none"
							/>
						</div>
					</div>

					{filteredParts.length === 0 ? (
						<div className="border border-dashed border-neutral-800 rounded-lg p-10 text-center bg-neutral-900/20 text-neutral-500 uppercase tracking-widest text-sm">
							No parts match current filters.
						</div>
					) : (
						<div className="space-y-3">
							{filteredParts.map((part) => (
								<div
									key={part.id}
									className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
								>
									<div>
										<p className="text-white font-bold">{part.part_number}</p>
										<p className="text-sm text-neutral-400">
											{part.description}
										</p>
										<p className="text-xs text-emerald-400 mt-1">
											${Number(part.base_price).toFixed(2)}
										</p>
									</div>
									<div className="self-start md:self-auto flex items-center gap-2">
										<button
											type="button"
											onClick={() => handleEdit(part)}
											className="bg-neutral-800 hover:bg-neutral-700 px-4 py-2 rounded font-bold text-xs uppercase tracking-widest"
										>
											Edit Part
										</button>
										<button
											type="button"
											onClick={() => void handleDelete(part)}
											disabled={deletingPartId === part.id}
											className="bg-red-900/60 hover:bg-red-800/70 disabled:bg-neutral-700 px-3 py-2 rounded font-bold text-xs uppercase tracking-widest inline-flex items-center gap-1"
										>
											<FiTrash2 className="h-3.5 w-3.5" />
											{deletingPartId === part.id ? "Deleting..." : "Delete"}
										</button>
									</div>
								</div>
							))}
						</div>
					)}
				</>
			)}
		</div>
	);
}
