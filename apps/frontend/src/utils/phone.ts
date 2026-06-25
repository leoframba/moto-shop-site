/** US numbers only: 10 digits → +1XXXXXXXXXX, 11 digits → +XXXXXXXXXXX. */
export function normalizePhoneToE164(input: string): string | null {
	const digitsOnly = input.replace(/\D/g, "");
	if (digitsOnly.length === 10) {
		return `+1${digitsOnly}`;
	}
	if (digitsOnly.length === 11) {
		return `+${digitsOnly}`;
	}
	return null;
}

export function formatPhoneForDisplay(e164: string): string {
	const digits = e164.replace(/\D/g, "");
	const national =
		digits.length === 11 && digits.startsWith("1")
			? digits.slice(1)
			: digits.length === 10
				? digits
				: null;

	if (national?.length === 10) {
		return `(${national.slice(0, 3)}) ${national.slice(3, 6)}-${national.slice(6)}`;
	}

	return e164;
}

export function isEmailIdentifier(value: string): boolean {
	return value.includes("@");
}

export function formatIdentifierForDisplay(identifier: string): string {
	if (isEmailIdentifier(identifier)) {
		return identifier;
	}
	return formatPhoneForDisplay(identifier);
}

export type ParsedLoginIdentifier =
	| { type: "email"; value: string }
	| { type: "phone"; value: string }
	| { type: "error"; message: string };

export function parseEmailOrPhone(input: string): ParsedLoginIdentifier {
	const clean = input.trim();
	if (!clean) {
		return {
			type: "error",
			message: "Please enter a valid email or phone number",
		};
	}

	if (clean.includes("@")) {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(clean)) {
			return { type: "error", message: "Please enter a valid email address" };
		}
		return { type: "email", value: clean.toLowerCase() };
	}

	const e164 = normalizePhoneToE164(clean);
	if (!e164) {
		return {
			type: "error",
			message: "Please enter a valid 10-digit US phone number",
		};
	}

	return { type: "phone", value: e164 };
}
