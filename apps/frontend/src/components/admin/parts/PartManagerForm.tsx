import type { PartFormData } from "@/types";

export const getInitialPartFormData = (): PartFormData => ({
	part_number: "",
	description: "",
	base_price: 0,
});

export const toPartPayload = (formData: PartFormData) => ({
	part_number: formData.part_number.trim() || null,
	description: formData.description.trim(),
	base_price: Number(formData.base_price),
});

export interface PartManagerFormProps {
	formData: PartFormData;
	isSaving: boolean;
	isEditing: boolean;
	onChange: (field: keyof PartFormData, value: string | number) => void;
	onSave: () => Promise<void>;
	onCancel: () => void;
}

export function PartManagerForm({
	formData,
	isSaving,
	isEditing,
	onChange,
	onSave,
	onCancel,
}: PartManagerFormProps) {
	return (
		<>
			<div className="mb-4 grid gap-4 md:grid-cols-3">
				<div>
					<label
						htmlFor="part-number"
						className="mb-1 block text-xs text-neutral-300"
					>
						Part Number <span className="text-neutral-300">(optional)</span>
					</label>
					<input
						id="part-number"
						value={formData.part_number}
						onChange={(e) => onChange("part_number", e.target.value)}
						placeholder="e.g. BRK-1120 (leave blank if none)"
						className="w-full rounded border border-neutral-700 bg-neutral-950 p-3 text-white outline-none focus:border-emerald-500"
					/>
				</div>
				<div className="md:col-span-2">
					<label
						htmlFor="part-description"
						className="mb-1 block text-xs text-neutral-300"
					>
						Description
					</label>
					<input
						id="part-description"
						value={formData.description}
						onChange={(e) => onChange("description", e.target.value)}
						placeholder="e.g. Rear brake pads"
						className="w-full rounded border border-neutral-700 bg-neutral-950 p-3 text-white outline-none focus:border-emerald-500"
					/>
				</div>
				<div>
					<label
						htmlFor="part-price"
						className="mb-1 block text-xs text-neutral-300"
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
						className="w-full rounded border border-neutral-700 bg-neutral-950 p-3 text-white outline-none focus:border-emerald-500"
					/>
				</div>
			</div>

			<div className="flex gap-3">
				<button
					type="button"
					onClick={() => void onSave()}
					disabled={isSaving}
					className="rounded bg-emerald-600 px-6 py-2 text-sm font-bold transition-colors hover:bg-emerald-500 disabled:bg-neutral-700"
				>
					{isSaving ? "Saving..." : isEditing ? "Save Part" : "Create Part"}
				</button>
				<button
					type="button"
					onClick={onCancel}
					disabled={isSaving}
					className="rounded bg-neutral-800 px-4 py-2 text-sm font-bold transition-colors hover:bg-neutral-700"
				>
					Cancel
				</button>
			</div>
		</>
	);
}
