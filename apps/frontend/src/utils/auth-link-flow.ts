import type { EmailOtpType } from "@supabase/supabase-js";

export const AUTH_LINK_OTP_TYPES: EmailOtpType[] = [
	"invite",
	"magiclink",
	"signup",
	"recovery",
	"email",
];

export function normalizeAuthLinkOtpType(
	value: string | null,
): EmailOtpType | null {
	if (value && (AUTH_LINK_OTP_TYPES as string[]).includes(value)) {
		return value as EmailOtpType;
	}
	return null;
}

export const RECOVERY_LINK_EXPIRED_MESSAGE =
	"This reset link has expired or was already used. Request a new link from the sign-in page.";
