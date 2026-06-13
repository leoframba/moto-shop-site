import type { User } from "@supabase/supabase-js";

export function isAdminUser(user: User | null | undefined): boolean {
	if (!user) return false;
	return user.app_metadata?.role === "admin";
}

export function getPostLoginRedirect(user: User): string {
	return isAdminUser(user) ? "/admin" : "/account";
}

export function getUserDisplayName(user: User): string {
	const metadata = user.user_metadata as { full_name?: string } | undefined;
	if (metadata?.full_name) return metadata.full_name;
	return user.email?.split("@")[0] ?? "Account";
}
