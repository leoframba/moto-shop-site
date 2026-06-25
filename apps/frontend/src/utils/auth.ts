import type { User } from "@supabase/supabase-js";
import { isPlaceholderInviteEmail } from "@/utils/invite";
import { formatPhoneForDisplay } from "@/utils/phone";

type UserMetadata = {
	first_name?: string | null;
	last_name?: string | null;
	full_name?: string;
	phone_number?: string | null;
};

const readMetadata = (user: User): UserMetadata =>
	(user.user_metadata ?? {}) as UserMetadata;

export function isAdminUser(user: User | null | undefined): boolean {
	if (!user) return false;
	return user.app_metadata?.role === "admin";
}

export function getPostLoginRedirect(user: User): string {
	return isAdminUser(user) ? "/admin" : "/account";
}

export function getUserDisplayName(user: User): string {
	const metadata = readMetadata(user);
	const fullName =
		`${metadata.first_name ?? ""} ${metadata.last_name ?? ""}`.trim();
	if (fullName) return fullName;
	if (metadata.full_name?.trim()) return metadata.full_name.trim();

	const email = user.email?.trim();
	if (email && !isPlaceholderInviteEmail(email)) {
		const localPart = email.split("@")[0]?.trim();
		if (localPart) return localPart;
	}

	const phone = user.phone ?? metadata.phone_number?.trim();
	if (phone) {
		return formatPhoneForDisplay(phone) || phone;
	}

	return "Account";
}

export function getUserContactLabel(user: User): string {
	const email = user.email?.trim();
	if (email && !isPlaceholderInviteEmail(email)) {
		return email;
	}

	const metadata = readMetadata(user);
	const phone = user.phone ?? metadata.phone_number?.trim();
	if (phone) {
		return formatPhoneForDisplay(phone) || phone;
	}

	return "";
}

export function userHasRealEmail(user: User): boolean {
	const email = user.email?.trim();
	return Boolean(email && !isPlaceholderInviteEmail(email));
}
