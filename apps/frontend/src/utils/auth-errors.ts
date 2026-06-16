/** Parse Supabase auth errors returned in the URL hash (e.g. expired invite links). */
export function parseAuthHashError(): string | null {
	if (typeof window === "undefined") return null;

	const hash = window.location.hash.replace(/^#/, "");
	if (!hash) return null;

	const params = new URLSearchParams(hash);
	const errorCode = params.get("error_code");
	const errorDescription = params.get("error_description");

	if (errorCode === "otp_expired") {
		return "This invite link has expired or was already used. Ask the shop to send a new invitation.";
	}

	if (errorDescription) {
		return decodeURIComponent(errorDescription.replace(/\+/g, " "));
	}

	return params.get("error");
}

/**
 * Parse Supabase implicit-flow tokens from the URL hash
 * (e.g. #access_token=...&refresh_token=...&type=invite).
 */
export function parseAuthHashTokens(): {
	accessToken: string;
	refreshToken: string;
} | null {
	if (typeof window === "undefined") return null;

	const hash = window.location.hash.replace(/^#/, "");
	if (!hash) return null;

	const params = new URLSearchParams(hash);
	const accessToken = params.get("access_token");
	const refreshToken = params.get("refresh_token");

	if (accessToken && refreshToken) {
		return { accessToken, refreshToken };
	}

	return null;
}

export function clearAuthHashFromUrl(): void {
	if (typeof window === "undefined") return;

	const url = new URL(window.location.href);
	url.hash = "";
	window.history.replaceState({}, "", `${url.pathname}${url.search}`);
}

export function getAuthCallbackErrorMessage(
	param: string | null,
): string | null {
	if (param === "auth_callback_failed") {
		return "We couldn't complete sign-in from that link. It may have expired — ask the shop to resend your invitation.";
	}
	return null;
}
