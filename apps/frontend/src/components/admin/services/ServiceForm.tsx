"use client";
import { useState } from "react";
import { toast } from "sonner";
import type { Category, PricingType, Service, ServiceFormData } from "@/types";

interface ServiceFormProps {
	categories: Category[];
	initialData?: Service;
	onSave: (data: ServiceFormData) => Promise<void>;
	onCancel: () => void;
	onDelete?: () => void;
}

export default function ServiceForm({
	categories,
	initialData,
	onSave,
	onCancel,
	onDelete,
}: ServiceFormProps) {
	const [formData, setFormData] = useState<ServiceFormData>({
		name: initialData?.name || "",
		description: initialData?.description || "",
		category_id: initialData?.category_id || categories[0]?.id || "",
		pricing_type: (initialData?.pricing_type as PricingType) || "hourly",
		estimated_hours: initialData?.estimated_hours || 1,
		fixed_price: initialData?.fixed_price || 0,
	});

	const [isSaving, setIsSaving] = useState(false);

	const handleSubmit = async () => {
		if (!formData.category_id) {
			toast.warning("Please create a category first!");
			return;
		}
		setIsSaving(true);
		try {
			await onSave(formData);
		} finally {
			setIsSaving(false);
		}
	};

	const isEditing = !!initialData;

	return (
		<div
			className={`p-6 bg-neutral-900 border rounded-xl mb-6 shadow-lg ${isEditing ? "border-emerald-500/30" : "border-emerald-500/50 shadow-emerald-900/20"}`}
		>
			<div className="grid gap-4 mb-4">
				<input
					placeholder="Service Name (e.g., Oil Change)"
					className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-emerald-500 outline-none"
					value={formData.name}
					onChange={(e) => setFormData({ ...formData, name: e.target.value })}
				/>
				<textarea
					placeholder="Description..."
					className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-emerald-500 outline-none h-24"
					value={formData.description}
					onChange={(e) =>
						setFormData({ ...formData, description: e.target.value })
					}
				/>

				<div className="grid grid-cols-2 gap-4">
					<div>
						<label
							htmlFor="form-cat"
							className="text-xs text-neutral-400 block mb-1"
						>
							Category
						</label>
						<select
							id="form-cat"
							className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-emerald-500 outline-none appearance-none"
							value={formData.category_id}
							onChange={(e) =>
								setFormData({ ...formData, category_id: e.target.value })
							}
						>
							~
							{categories.map((cat) => (
								<option key={cat.id} value={cat.id}>
									{cat.name}
								</option>
							))}
						</select>
					</div>
					<div>
						<label
							htmlFor="form-price"
							className="text-xs text-neutral-400 block mb-1"
						>
							Pricing Model
						</label>
						<select
							id="form-price"
							className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-emerald-500 outline-none appearance-none"
							value={formData.pricing_type}
							onChange={(e) =>
								setFormData({
									...formData,
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
					{formData.pricing_type === "hourly" && (
						<div>
							<label
								htmlFor="form-hrs"
								className="text-sm text-neutral-400 block mb-1"
							>
								Est. Hours:
							</label>
							<input
								id="form-hrs"
								type="number"
								step="0.1"
								className="w-32 bg-neutral-950 border border-neutral-700 rounded p-3 text-white outline-none"
								value={formData.estimated_hours}
								onChange={(e) =>
									setFormData({
										...formData,
										estimated_hours: Number(e.target.value),
									})
								}
							/>
						</div>
					)}
					{formData.pricing_type === "fixed" && (
						<div>
							<label
								htmlFor="form-fixed"
								className="text-sm text-neutral-400 block mb-1"
							>
								Fixed Price ($):
							</label>
							<input
								id="form-fixed"
								type="number"
								step="1"
								className="w-32 bg-neutral-950 border border-neutral-700 rounded p-3 text-white outline-none"
								value={formData.fixed_price}
								onChange={(e) =>
									setFormData({
										...formData,
										fixed_price: Number(e.target.value),
									})
								}
							/>
						</div>
					)}
				</div>
			</div>
			{/* BUTTON LAYOUT */}
			<div className="flex justify-between items-center pt-2 border-t border-neutral-800 mt-6">
				<div className="flex gap-3 mt-4">
					<button
						type="button"
						onClick={handleSubmit}
						disabled={isSaving}
						className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-700 px-6 py-2 rounded font-bold text-sm transition-colors"
					>
						{isSaving
							? "Saving..."
							: isEditing
								? "Save Changes"
								: "Create Service"}
					</button>
					<button
						type="button"
						onClick={onCancel}
						className="bg-neutral-800 hover:bg-neutral-700 px-4 py-2 rounded font-bold text-sm transition-colors"
					>
						Cancel
					</button>
				</div>

				{onDelete && (
					<button
						type="button"
						onClick={onDelete}
						className="mt-4 bg-red-600 hover:bg-red-500 px-4 py-2 rounded font-bold text-sm transition-all"
					>
						Delete Service
					</button>
				)}
			</div>
		</div>
	);
}
