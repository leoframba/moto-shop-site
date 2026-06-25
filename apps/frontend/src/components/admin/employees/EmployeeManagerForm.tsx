import type { Employee } from "@/types";

export interface EmployeeFormData {
	first_name: string;
	last_name: string;
}

export const getInitialEmployeeFormData = (): EmployeeFormData => ({
	first_name: "",
	last_name: "",
});

export const toEmployeeFormData = (employee: Employee): EmployeeFormData => ({
	first_name: employee.first_name,
	last_name: employee.last_name,
});

export const toEmployeePayload = (formData: EmployeeFormData) => ({
	first_name: formData.first_name.trim(),
	last_name: formData.last_name.trim(),
});

export const validateEmployeeForm = (
	formData: EmployeeFormData,
): string | null => {
	if (!formData.first_name.trim() || !formData.last_name.trim()) {
		return "First and last name are required.";
	}
	return null;
};

const fieldClassName =
	"w-full rounded border border-neutral-700 bg-neutral-950 p-3 text-white outline-none focus:border-emerald-500";

export interface EmployeeManagerFormProps {
	formData: EmployeeFormData;
	isSaving: boolean;
	isEditing?: boolean;
	onChange: (field: keyof EmployeeFormData, value: string) => void;
	onSave: () => Promise<void>;
	onCancel: () => void;
}

export function EmployeeManagerForm({
	formData,
	isSaving,
	isEditing = false,
	onChange,
	onSave,
	onCancel,
}: EmployeeManagerFormProps) {
	return (
		<>
			<div className="grid gap-4 md:grid-cols-2 mb-4">
				<div>
					<label
						htmlFor="employee-first-name"
						className="mb-1 block text-xs text-neutral-300"
					>
						First Name
					</label>
					<input
						id="employee-first-name"
						value={formData.first_name}
						onChange={(e) => onChange("first_name", e.target.value)}
						className={fieldClassName}
					/>
				</div>
				<div>
					<label
						htmlFor="employee-last-name"
						className="mb-1 block text-xs text-neutral-300"
					>
						Last Name
					</label>
					<input
						id="employee-last-name"
						value={formData.last_name}
						onChange={(e) => onChange("last_name", e.target.value)}
						className={fieldClassName}
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
					{isSaving
						? isEditing
							? "Saving..."
							: "Creating..."
						: isEditing
							? "Save Changes"
							: "Create Employee"}
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
