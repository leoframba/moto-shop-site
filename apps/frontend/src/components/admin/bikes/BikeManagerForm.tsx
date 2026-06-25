import { useMemo } from "react";
import { getUserDisplayName } from "@/components/admin/invoices/invoiceHelpers";
import type { AdminUser, InvoiceBikeFormData } from "@/types";

export const getInitialBikeFormData = (ownerId = ""): InvoiceBikeFormData => {
	const defaultYear = new Date().getFullYear();
	return {
		owner_id: ownerId,
		year: defaultYear,
		make: "",
		model: "",
		vin: "",
		license_plate: "",
		color: "",
		admin_notes: "",
	};
};

export const toBikePayload = (formData: InvoiceBikeFormData) => ({
	owner_id: formData.owner_id || null,
	year: formData.year,
	make: formData.make.trim(),
	model: formData.model.trim(),
	vin: formData.vin.trim() || null,
	license_plate: formData.license_plate.trim() || null,
	color: formData.color.trim() || null,
	admin_notes: formData.admin_notes.trim() || null,
});

export interface BikeManagerFormProps {
	formData: InvoiceBikeFormData;
	users: AdminUser[];
	isSaving: boolean;
	onChange: (field: keyof InvoiceBikeFormData, value: string | number) => void;
	onSave: () => Promise<void>;
	onCancel: () => void;
	isEditing: boolean;
	/** Read-only invoice mechanic notes for reference while creating a bike. */
	mechanicNotesReference?: string;
}

export function MechanicNotesReferencePanel({
	mechanicNotes,
}: {
	mechanicNotes: string;
}) {
	const trimmed = mechanicNotes.trim();
	if (!trimmed) return null;

	return (
		<div className="mb-5 rounded-lg border border-amber-700/40 bg-amber-950/20 p-4">
			<p className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-300">
				Mechanic Notes (from invoice)
			</p>
			<pre className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded border border-neutral-800 bg-neutral-950 p-3 text-sm leading-relaxed text-neutral-200">
				{trimmed}
			</pre>
		</div>
	);
}

export function BikeManagerForm({
	formData,
	users,
	isSaving,
	onChange,
	onSave,
	onCancel,
	isEditing,
	mechanicNotesReference,
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
		<>
			<MechanicNotesReferencePanel
				mechanicNotes={mechanicNotesReference ?? ""}
			/>

			<div className="mb-4 grid gap-4 md:grid-cols-3">
				<div className="md:col-span-3">
					<label
						htmlFor="bike-owner"
						className="mb-1 block text-xs text-neutral-300"
					>
						Owner
					</label>
					<select
						id="bike-owner"
						value={formData.owner_id}
						onChange={(e) => onChange("owner_id", e.target.value)}
						className="w-full rounded border border-neutral-700 bg-neutral-950 p-3 text-white outline-none focus:border-emerald-500"
					>
						<option value="">No owner linked</option>
						{users.map((user) => (
							<option key={user.id} value={user.id}>
								{getUserDisplayName(user)} (
								{user.email?.trim() || user.phone_number || "—"})
							</option>
						))}
					</select>
				</div>

				<div>
					<label
						htmlFor="bike-year"
						className="mb-1 block text-xs text-neutral-300"
					>
						Year
					</label>
					<select
						id="bike-year"
						value={formData.year}
						onChange={(e) => onChange("year", Number(e.target.value))}
						className="w-full rounded border border-neutral-700 bg-neutral-950 p-3 text-white outline-none focus:border-emerald-500"
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
						className="mb-1 block text-xs text-neutral-300"
					>
						Make
					</label>
					<input
						id="bike-make"
						value={formData.make}
						onChange={(e) => onChange("make", e.target.value)}
						placeholder="e.g. Yamaha"
						className="w-full rounded border border-neutral-700 bg-neutral-950 p-3 text-white outline-none focus:border-emerald-500"
					/>
				</div>
				<div>
					<label
						htmlFor="bike-model"
						className="mb-1 block text-xs text-neutral-300"
					>
						Model
					</label>
					<input
						id="bike-model"
						value={formData.model}
						onChange={(e) => onChange("model", e.target.value)}
						placeholder="e.g. MT-09"
						className="w-full rounded border border-neutral-700 bg-neutral-950 p-3 text-white outline-none focus:border-emerald-500"
					/>
				</div>
				<div>
					<label
						htmlFor="bike-vin"
						className="mb-1 block text-xs text-neutral-300"
					>
						VIN
					</label>
					<input
						id="bike-vin"
						value={formData.vin}
						onChange={(e) => onChange("vin", e.target.value)}
						placeholder="Optional"
						className="w-full rounded border border-neutral-700 bg-neutral-950 p-3 text-white outline-none focus:border-emerald-500"
					/>
				</div>
				<div>
					<label
						htmlFor="bike-plate"
						className="mb-1 block text-xs text-neutral-300"
					>
						License Plate
					</label>
					<input
						id="bike-plate"
						value={formData.license_plate}
						onChange={(e) => onChange("license_plate", e.target.value)}
						placeholder="Optional"
						className="w-full rounded border border-neutral-700 bg-neutral-950 p-3 text-white outline-none focus:border-emerald-500"
					/>
				</div>
				<div>
					<label
						htmlFor="bike-color"
						className="mb-1 block text-xs text-neutral-300"
					>
						Color
					</label>
					<input
						id="bike-color"
						value={formData.color}
						onChange={(e) => onChange("color", e.target.value)}
						placeholder="Optional"
						className="w-full rounded border border-neutral-700 bg-neutral-950 p-3 text-white outline-none focus:border-emerald-500"
					/>
				</div>
			</div>

			<div className="mb-4">
				<label
					htmlFor="bike-notes"
					className="mb-1 block text-xs text-neutral-300"
				>
					Admin Notes
				</label>
				<textarea
					id="bike-notes"
					value={formData.admin_notes}
					onChange={(e) => onChange("admin_notes", e.target.value)}
					placeholder="Internal notes for invoice prep..."
					className="h-24 w-full rounded border border-neutral-700 bg-neutral-950 p-3 text-white outline-none focus:border-emerald-500"
				/>
			</div>

			<div className="flex gap-3">
				<button
					type="button"
					onClick={() => void onSave()}
					disabled={isSaving}
					className="rounded bg-emerald-600 px-6 py-2 text-sm font-bold transition-colors hover:bg-emerald-500 disabled:bg-neutral-700"
				>
					{isSaving ? "Saving..." : isEditing ? "Save Bike" : "Create Bike"}
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
