"use client";
import { useState } from "react";
import type { Category } from "@/types";

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
	const [isAdding, setIsAdding] = useState(false);

	const handleAddCategory = async () => {
		if (!newCategoryName.trim()) return;

		setIsAdding(true);
		try {
			const success = await onSaveCategory(newCategoryName);
			if (success) {
				setNewCategoryName("");
			}
		} finally {
			setIsAdding(false);
		}
	};

	return (
		<section className="p-8 border border-neutral-800 rounded-2xl bg-neutral-900 shadow-xl">
			<h2 className="text-xs font-bold uppercase tracking-widest text-neutral-300 mb-4">
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
					onClick={() => handleAddCategory()}
					className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg font-bold text-sm shrink-0"
				>
					{isAdding ? "Adding... " : "Add"}
				</button>
			</div>
			<div className="space-y-2 max-h-32 overflow-y-auto pr-2">
				{categories.map((cat) => (
					<div
						key={cat.id}
						className="flex justify-between items-center bg-neutral-950 px-3 py-2 rounded border border-neutral-800"
					>
						<span className="text-sm text-neutral-100">{cat.name}</span>
						<button
							type="button"
							onClick={() => onDeleteCategory(cat.id)}
							className="text-red-500 hover:text-red-400 text-xs font-bold uppercase"
						>
							Delete
						</button>
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
