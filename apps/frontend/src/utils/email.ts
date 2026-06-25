const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (value: string): boolean => {
	const trimmed = value.trim().toLowerCase();
	return trimmed.length > 0 && EMAIL_REGEX.test(trimmed);
};
