import { normalizePhoneToE164 } from "@/utils/phone";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface RiderFormData {
	email: string;
	first_name: string;
	last_name: string;
	phone_number: string;
}

export const getInitialRiderFormData = (): RiderFormData => ({
	email: "",
	first_name: "",
	last_name: "",
	phone_number: "",
});

export const isValidRiderEmail = (value: string): boolean => {
	const trimmed = value.trim().toLowerCase();
	return trimmed.length > 0 && EMAIL_REGEX.test(trimmed);
};

export const isValidRiderPhone = (value: string): boolean => {
	return normalizePhoneToE164(value.trim()) !== null;
};

export const validateRiderCreateInput = (
	formData: RiderFormData,
): string | null => {
	const hasValidEmail = isValidRiderEmail(formData.email);
	const hasValidPhone = isValidRiderPhone(formData.phone_number);
	if (!hasValidEmail && !hasValidPhone) {
		return "Enter a valid email or phone number.";
	}
	return null;
};

export const toUserCreatePayload = (formData: RiderFormData) => {
	const email = formData.email.trim().toLowerCase();
	const phone = formData.phone_number.trim();
	const hasValidEmail = isValidRiderEmail(email);
	const hasValidPhone = isValidRiderPhone(phone);

	return {
		email: hasValidEmail ? email : null,
		first_name: formData.first_name.trim() || null,
		last_name: formData.last_name.trim() || null,
		phone_number: hasValidPhone ? phone : null,
	};
};

const fieldClassName =
	"w-full rounded border border-neutral-700 bg-neutral-950 p-3 text-white outline-none focus:border-emerald-500";

export interface UserManagerFormProps {
	formData: RiderFormData;
	isSaving: boolean;
	onChange: (field: keyof RiderFormData, value: string) => void;
	onSave: () => Promise<void>;
	onCancel: () => void;
}

export function UserManagerForm({
	formData,
	isSaving,
	onChange,
	onSave,
	onCancel,
}: UserManagerFormProps) {
	return (
		<>
			<p className="mb-4 text-xs text-neutral-400">
				Email or phone is required. Creates the account only — no invite is
				sent.
			</p>
			<div className="mb-4 grid gap-4 md:grid-cols-2">
				<div className="md:col-span-2">
					<label
						htmlFor="rider-email"
						className="mb-1 block text-xs text-neutral-300"
					>
						Email
					</label>
					<input
						id="rider-email"
						type="email"
						value={formData.email}
						onChange={(e) => onChange("email", e.target.value)}
						placeholder="rider@example.com"
						className={fieldClassName}
					/>
				</div>
				<div>
					<label
						htmlFor="rider-first-name"
						className="mb-1 block text-xs text-neutral-300"
					>
						First Name
					</label>
					<input
						id="rider-first-name"
						value={formData.first_name}
						onChange={(e) => onChange("first_name", e.target.value)}
						className={fieldClassName}
					/>
				</div>
				<div>
					<label
						htmlFor="rider-last-name"
						className="mb-1 block text-xs text-neutral-300"
					>
						Last Name
					</label>
					<input
						id="rider-last-name"
						value={formData.last_name}
						onChange={(e) => onChange("last_name", e.target.value)}
						className={fieldClassName}
					/>
				</div>
				<div className="md:col-span-2">
					<label
						htmlFor="rider-phone"
						className="mb-1 block text-xs text-neutral-300"
					>
						Phone Number
					</label>
					<input
						id="rider-phone"
						type="tel"
						value={formData.phone_number}
						onChange={(e) => onChange("phone_number", e.target.value)}
						placeholder="(555) 123-4567"
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
					{isSaving ? "Creating..." : "Create User"}
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
