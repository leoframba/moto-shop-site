"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { toast } from "sonner";
import { toCurrency } from "@/components/admin/invoices/invoiceHelpers";
import { AdminModal } from "@/components/admin/modals";
import {
	getInitialPartFormData,
	PartManagerForm,
	toPartPayload,
} from "@/components/admin/parts/PartManagerForm";
import {
	compareParts,
	getPartDisplayLabel,
	getPartSaveErrorMessage,
} from "@/components/admin/parts/partUtils";
import type { Part, PartFormData } from "@/types";
import { authApiRequest } from "@/utils/api";

interface PartSearchFilters {
	name: string;
	partNumber: string;
}

const getInitialPartSearchFilters = (): PartSearchFilters => ({
	name: "",
	partNumber: "",
});

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
		if (!formData.description.trim()) {
			toast.warning("Description is required.");
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
			toast.error(getPartSaveErrorMessage(error, "Failed to save part."));
		} finally {
			setIsSaving(false);
		}
	};

	const handleEdit = (part: Part) => {
		setIsEditing(true);
		setEditingPartId(part.id);
		setFormData({
			part_number: part.part_number ?? "",
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
			`Delete ${getPartDisplayLabel(part)}? This cannot be undone.`,
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

		return parts
			.filter((part) => {
				const partNumber = part.part_number?.toLowerCase() ?? "";
				const partName = part.description.toLowerCase();

				if (partNumberQuery && !partNumber.includes(partNumberQuery))
					return false;
				if (nameQuery && !partName.includes(nameQuery)) return false;
				return true;
			})
			.sort(compareParts);
	}, [parts, searchFilters]);

	return (
		<div className="max-w-5xl mx-auto pb-20">
			<div className="mb-8 flex justify-between items-end">
				<div>
					<h2 className="text-3xl font-bold tracking-tight text-white mb-1">
						Parts Manager
					</h2>
					<p className="text-neutral-300 text-sm">
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
				<div className="text-center py-20 text-neutral-300 animate-pulse uppercase tracking-widest font-bold">
					Loading Parts...
				</div>
			) : parts.length === 0 ? (
				<div className="border border-dashed border-neutral-800 rounded-lg p-10 text-center bg-neutral-900/20 text-neutral-300 uppercase tracking-widest text-sm">
					No parts created yet.
				</div>
			) : (
				<>
					<div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 mb-4">
						<div className="flex items-center justify-between mb-3">
							<p className="text-xs uppercase tracking-widest text-neutral-300 font-bold">
								Search Parts
							</p>
							<button
								type="button"
								onClick={clearSearchFilters}
								className="text-xs text-neutral-300 hover:text-white uppercase tracking-widest font-bold"
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
						<div className="border border-dashed border-neutral-800 rounded-lg p-10 text-center bg-neutral-900/20 text-neutral-300 uppercase tracking-widest text-sm">
							No parts match current filters.
						</div>
					) : (
						<div className="overflow-x-auto rounded-lg border border-neutral-800">
							<table className="w-full min-w-[40rem] border-collapse bg-neutral-900">
								<thead>
									<tr className="border-b border-neutral-800 bg-neutral-900/80 text-left text-xs font-bold uppercase tracking-widest text-neutral-300">
										<th className="px-4 py-3">Name</th>
										<th className="px-4 py-3">Part Number</th>
										<th className="px-4 py-3 text-right">Price</th>
										<th className="px-4 py-3 text-right">Actions</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-neutral-800">
									{filteredParts.map((part) => (
										<tr key={part.id}>
											<td className="px-4 py-3 font-bold text-white">
												{part.description}
											</td>
											<td className="px-4 py-3 text-sm text-neutral-300">
												{part.part_number ?? "—"}
											</td>
											<td className="px-4 py-3 text-right text-sm font-semibold text-emerald-400">
												{toCurrency(Number(part.base_price))}
											</td>
											<td className="px-4 py-3">
												<div className="flex items-center justify-end gap-2">
													<button
														type="button"
														onClick={() => handleEdit(part)}
														className="rounded bg-neutral-800 px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-neutral-700"
													>
														Edit
													</button>
													<button
														type="button"
														onClick={() => void handleDelete(part)}
														disabled={deletingPartId === part.id}
														className="inline-flex items-center gap-1 rounded bg-red-900/60 px-3 py-2 text-xs font-bold uppercase tracking-widest hover:bg-red-800/70 disabled:bg-neutral-700"
													>
														<FiTrash2 className="h-3.5 w-3.5" />
														{deletingPartId === part.id
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
