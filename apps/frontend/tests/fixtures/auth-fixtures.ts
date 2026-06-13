import type { User } from "@supabase/supabase-js";

export function mockUser(
	overrides: Partial<User> & { app_metadata?: { role?: string } } = {},
): User {
	return {
		id: "user-123",
		aud: "authenticated",
		role: "authenticated",
		email: "test@example.com",
		email_confirmed_at: new Date().toISOString(),
		phone: "",
		confirmed_at: new Date().toISOString(),
		last_sign_in_at: new Date().toISOString(),
		app_metadata: {},
		user_metadata: {},
		identities: [],
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
		is_anonymous: false,
		...overrides,
	} as User;
}

export function mockAdminUser(overrides: Partial<User> = {}): User {
	return mockUser({
		email: "admin@example.com",
		app_metadata: { role: "admin" },
		...overrides,
	});
}

export function mockCustomerUser(overrides: Partial<User> = {}): User {
	return mockUser({
		email: "customer@example.com",
		app_metadata: {},
		...overrides,
	});
}
