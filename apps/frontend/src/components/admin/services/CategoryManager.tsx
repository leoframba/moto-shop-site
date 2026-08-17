"use client";
import { useState } from "react";
import type { Category } from "@/types";
import { AdminModal } from "../modals/AdminModal";
import { AdminButton } from "../../ui/AdminButton";
import { MdCreateNewFolder } from "react-icons/md";


interface CategoryManagerProps {
	categories: Category[];
	onSaveCategory: (nameToSave: string) => Promise<boolean>;
	onDeleteCategory: (id: string) => Promise<void>;
}

export default function CategoryManager({
	categories,
	onSaveCategory,
	onDeleteCategory,
}: CategoryManagerProps) {
	const [newCategoryName, setNewCategoryName] = useState("");
	const [isCategoryFormVisable, setIsCategoryFormVisable] = useState<boolean>(false);
	const [createCategoryError, setCreateCategoryError] = useState<string | null>(null);

	const [isAdding, setIsAdding] = useState(false);

	const handleAddCategory = async (e: React.SubmitEvent<HTMLFormElement>) => {
		e.preventDefault()
		if (!newCategoryName.trim()) {
			setCreateCategoryError("Category name cannot be empty")
			return;
		}

		setIsAdding(true);
		try {
			const success = await onSaveCategory(newCategoryName);
			if (success) {
				setNewCategoryName("");
			}
		} finally {
			setIsAdding(false);
			setCreateCategoryError(null)
		}
	};

	const onCategoryModalClose = () => {
		setIsCategoryFormVisable(false)
		setCreateCategoryError(null)
	}

	return (
		<section className="p-8 border border-neutral-800 rounded-2xl bg-neutral-900 shadow-xl">
			<div className="flex justify-between">
				<h2 className="font-bold uppercase tracking-widest text-neutral-300 mb-4">
					Categories
				</h2>

				<AdminButton
					iconLeft={<MdCreateNewFolder />}
					variant="primary"
					size="md"
					onClick={() => setIsCategoryFormVisable(true)}
				>
					New Category
				</AdminButton>
			</div>
			<div className="flex gap-2 mb-4">
				{isCategoryFormVisable && (
					<AdminModal
						open={isCategoryFormVisable}
						onClose={onCategoryModalClose}
						title={"Create New Category"}
						size="lg"
					>
						<form
							onSubmit={handleAddCategory}
							className="space-y-4"
						>
							{createCategoryError && (
								<div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
									<p className="text-red-400 text-center">
										{createCategoryError}
									</p>
								</div>
							)}
							<div className="flex gap-4">
								<input
									id="new-category-name"
									onChange={(e) => setNewCategoryName(e.target.value)}
									className="w-full rounded border border-neutral-700 p-3 bg-neutral-950 outline-none"
									placeholder="Category name..."
								>
								</input>
								<AdminButton
									type="submit"
									className="rounded bg-emerald-600 px-6 py-2 font-bold tracking-widest text-white shadow-lg transition-colors hover:bg-emerald-500 disabled:bg-emerald-600/20"
									disabled={isAdding}
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
					</AdminModal>
				)}
			</div>
			<div className="space-y-2 max-h-32 overflow-y-auto pr-2">
				{categories.map((cat) => (
					<div
						key={cat.id}
						className="flex justify-between items-center bg-neutral-950 px-3 py-2 rounded border border-neutral-800"
					>
						<span className="text-md text-neutral-100">{cat.name}</span>
						<AdminButton
							size="sm"
							variant="danger"
							onClick={() => onDeleteCategory(cat.id)}
							disabled={isAdding}
						>
							Delete
						</AdminButton>
					</div>
				))}
				{categories.length === 0 && (
					<p className="text-xs text-neutral-300 italic">
						No categories created yet.
					</p>
				)}
			</div>
		</section>
	);
}
