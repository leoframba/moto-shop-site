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

const INVITE_LINK_OTP_TYPES = new Set([
	"invite",
	"magiclink",
	"signup",
	"email",
]);

/** When Supabase emails use Site URL as the link base, auth params land on `/`. */
export function getAuthLinkRedirectPath(
	pathname: string,
	searchParams: URLSearchParams,
): string | null {
	if (pathname === "/reset-password" || pathname === "/accept-invite") {
		return null;
	}

	const tokenHash = searchParams.get("token_hash");
	const type = searchParams.get("type");
	const code = searchParams.get("code");

	if (tokenHash && type === "recovery") {
		const params = new URLSearchParams({
			token_hash: tokenHash,
			type: "recovery",
		});
		return `/reset-password?${params.toString()}`;
	}

	if (tokenHash && type && INVITE_LINK_OTP_TYPES.has(type)) {
		const params = new URLSearchParams({
			token_hash: tokenHash,
			type,
		});
		return `/accept-invite?${params.toString()}`;
	}

	if (code && type === "recovery") {
		const params = new URLSearchParams({ code, type: "recovery" });
		return `/reset-password?${params.toString()}`;
	}

	return null;
}
