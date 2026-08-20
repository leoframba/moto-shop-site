"use client";
import { useState } from "react";
import type { Category, CategoryActionResult } from "@/types";
import { AdminButton } from "../../ui/AdminButton";
import { TableCell, TableHead } from "@/components/ui/table/th";
import { FiTrash2 } from "react-icons/fi";

const MIN_CATEGORY_NAME_LENGTH = 2;

interface CategoryManagerProps {
	categories: Category[];
	onSaveCategory: (nameToSave: string) => Promise<CategoryActionResult>;
	onDeleteCategory: (id: string) => Promise<CategoryActionResult>;
	onUpdateCategory: (category: Category) => Promise<CategoryActionResult>;
}

export default function CategoryManager({
	categories,
	onSaveCategory,
	onDeleteCategory,
	onUpdateCategory,
}: CategoryManagerProps) {
	const [newCategoryName, setNewCategoryName] = useState("");
	const [editCategoryName, setEditCategoryName] = useState("");
	const [editingId, setEditingId] = useState<string | null>(null);
	const [isUpdating, setIsUpdating] = useState(false);
	const [createCategoryError, setCreateCategoryError] = useState<string | null>(null);
	const [editCategoryError, setEditCategoryError] = useState<string | null>(null);
	const [deleteCategoryError, setDeleteCategoryError] = useState<string | null>(null);
	const [isAdding, setIsAdding] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const isCategoryNameValid = (name: string) =>
		name.trim().length >= MIN_CATEGORY_NAME_LENGTH;

	const handleAddCategory = async (e: React.SubmitEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!isCategoryNameValid(newCategoryName)) {
			setCreateCategoryError("Category names require at least 2 characters");
			return;
		}

		try {
			setIsAdding(true);
			const result = await onSaveCategory(newCategoryName.trim());
			if (result.ok) {
				setNewCategoryName("");
				setCreateCategoryError(null);
			} else {
				setCreateCategoryError(result.message);
			}
		} finally {
			setIsAdding(false);
		}
	};

	const handleEditCategory = (id: string) => {
		const category = categories.find((c) => c.id === id);
		if (category == null) {
			return;
		}

		setEditingId(id);
		setEditCategoryName(category.name);
		setEditCategoryError(null);
	};

	const handleEditCancel = () => {
		setEditingId(null);
		setEditCategoryName("");
		setEditCategoryError(null);
	};

	const handleEditSave = async (id: string) => {
		const category = categories.find((c) => c.id === id);
		if (category == null) {
			handleEditCancel();
			return;
		}

		if (!isCategoryNameValid(editCategoryName)) {
			setEditCategoryError("Category names require at least 2 characters");
			return;
		}

		const updatedCategory: Category = {
			name: editCategoryName.trim(),
			id: category.id,
		};

		try {
			setIsUpdating(true);
			setEditCategoryError(null);
			const result = await onUpdateCategory(updatedCategory);
			if (result.ok) {
				handleEditCancel();
			} else {
				setEditCategoryError(result.message);
			}
		} finally {
			setIsUpdating(false);
		}
	};

	const handleDeleteCategory = async (id: string) => {
		try {
			setIsDeleting(true);
			setDeleteCategoryError(null);
			const result = await onDeleteCategory(id);
			if (!result.ok) {
				setDeleteCategoryError(result.message);
			}
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<section className="rounded-xl border-transparent bg-black/75 p-5 shadow-xl">
			<div className="w-full mb-6">
				<form onSubmit={handleAddCategory} className="space-y-3">
					{createCategoryError && (
						<div className="p-3 mb-3 bg-red-500/10 border border-red-500/20 rounded-lg">
							<p className="text-red-400 text-center">{createCategoryError}</p>
						</div>
					)}

					<div className="flex items-center gap-4">
						<input
							id="new-category-name"
							onChange={(e) => setNewCategoryName(e.target.value)}
							className="w-full rounded border border-neutral-700 p-2 bg-neutral-950 outline-none"
							placeholder="Category name..."
						/>
						<AdminButton
							type="submit"
							className="rounded bg-emerald-600 px-6 py-2 font-bold tracking-widest text-white shadow-lg transition-colors hover:bg-emerald-500 disabled:bg-emerald-600/20"
							disabled={isAdding || isUpdating || isDeleting}
						>
							{isAdding ? (
								<div className="flex gap-4 ">
									<div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
									<span>Creating...</span>
								</div>
							) : (
								<span>Create</span>
							)}
						</AdminButton>
					</div>
				</form>
			</div>

			{deleteCategoryError && (
				<div className="p-3 mb-3 bg-red-500/10 border border-red-500/20 rounded-lg">
					<p className="text-red-400 text-center">{deleteCategoryError}</p>
				</div>
			)}

			<div className="overflow-x-auto rounded-lg border border-neutral-800">
				<table className="w-full min-w-160 border-collapse bg-neutral-900">
					<thead>
						<tr className="border-b border-neutral-800 bg-neutral-900/80 text-left">
							<TableHead>Name</TableHead>
							<TableHead className="text-right">Actions</TableHead>
						</tr>
					</thead>
					<tbody className="divide-y divide-neutral-800">
						{categories.map((cat) => (
							<tr key={cat.id}>
								{cat.id === editingId ? (
									<>
										<TableCell>
											<div className="space-y-2">
												<input
													id="edit-category-name"
													onChange={(e) => setEditCategoryName(e.target.value)}
													className="w-full rounded border border-neutral-700 p-2 bg-neutral-950 outline-none"
													value={editCategoryName}
													placeholder="Category name..."
												/>
												{editCategoryError && (
													<p className="text-xs text-red-400">{editCategoryError}</p>
												)}
											</div>
										</TableCell>
										<TableCell>
											<div className="flex items-center justify-end gap-2">
												<AdminButton
													size="sm"
													variant="primary"
													onClick={() => handleEditSave(cat.id)}
													disabled={isUpdating}
												>
													{isUpdating ? "Saving..." : "Save"}
												</AdminButton>
												<AdminButton
													size="sm"
													variant="danger"
													onClick={handleEditCancel}
													disabled={isUpdating}
												>
													Cancel
												</AdminButton>
											</div>
										</TableCell>
									</>
								) : (
									<>
										<TableCell>
											<span>{cat.name}</span>
										</TableCell>
										<TableCell>
											<div className="flex items-center justify-end gap-2">
												<AdminButton
													size="sm"
													variant="secondary"
													onClick={() => handleEditCategory(cat.id)}
													disabled={isAdding || isUpdating || isDeleting}
												>
													Edit
												</AdminButton>
												<AdminButton
													size="sm"
													variant="danger"
													onClick={() => handleDeleteCategory(cat.id)}
													disabled={isAdding || isUpdating || isDeleting}
													iconLeft={<FiTrash2 />}
												>
													Delete
												</AdminButton>
											</div>
										</TableCell>
									</>
								)}
							</tr>
						))}
					</tbody>
				</table>
				{categories.length === 0 && (
					<p className="p-4 text-xs text-neutral-300 italic text-center">
						No categories created yet.
					</p>
				)}
			</div>
		</section>
	);
}
