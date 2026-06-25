export const INVITE_PLACEHOLDER_EMAIL_SUFFIX = "@invite.advcycles.invalid";

export const isPlaceholderInviteEmail = (
	email: string | null | undefined,
): boolean =>
	Boolean(
		email?.trim().toLowerCase().endsWith(INVITE_PLACEHOLDER_EMAIL_SUFFIX),
	);
