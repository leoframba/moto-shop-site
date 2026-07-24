import type { User } from "@supabase/supabase-js";
import { getPostLoginRedirect, isAdminUser } from "@/utils/auth";

const DEFAULT_AUTH_CALLBACK_PATH = "/account";

/** Reject protocol-relative and userinfo tricks in post-auth redirect targets. */
export function safeAuthCallbackPath(next: string | null): string {
	if (!next) {
		return DEFAULT_AUTH_CALLBACK_PATH;
	}

	if (
		!next.startsWith("/") ||
		next.startsWith("//") ||
		next.includes("@") ||
		next.includes("\\")
	) {
		return DEFAULT_AUTH_CALLBACK_PATH;
	}

	return next;
}

export type AuthRedirect = {
	pathname: string;
	search?: string;
};

export function getAuthRedirect(
	path: string,
	user: User | null,
): AuthRedirect | null {
	const isAdminRoute = path.startsWith("/admin");
	const isAccountRoute = path.startsWith("/account");
	const isAuthRoute =
		path === "/login" || path === "/signup" || path === "/forgot-password";

	if (isAdminRoute && !user) {
		return { pathname: "/login" };
	}

	if (isAdminRoute && user && !isAdminUser(user)) {
		return { pathname: "/account" };
	}

	if (isAccountRoute && !user) {
		return { pathname: "/login", search: "next=/account" };
	}

	if (user && isAuthRoute) {
		return { pathname: getPostLoginRedirect(user) };
	}

	return null;
}
