import {
	mockAdminUser,
	mockCustomerUser,
	mockUser,
} from "@tests/fixtures/auth-fixtures";
import { describe, expect, it } from "vitest";
import {
	getPostLoginRedirect,
	getUserContactLabel,
	getUserDisplayName,
	isAdminUser,
	userHasRealEmail,
} from "@/utils/auth";

describe("isAdminUser", () => {
	it("returns true when app_metadata.role is admin", () => {
		expect(isAdminUser(mockAdminUser())).toBe(true);
	});

	it("returns false for customer without role", () => {
		expect(isAdminUser(mockCustomerUser())).toBe(false);
	});

	it("returns false for non-admin role", () => {
		expect(isAdminUser(mockUser({ app_metadata: { role: "customer" } }))).toBe(
			false,
		);
	});

	it("returns false for null or undefined", () => {
		expect(isAdminUser(null)).toBe(false);
		expect(isAdminUser(undefined)).toBe(false);
	});
});

describe("getPostLoginRedirect", () => {
	it("redirects admin users to /admin", () => {
		expect(getPostLoginRedirect(mockAdminUser())).toBe("/admin");
	});

	it("redirects customers to /account", () => {
		expect(getPostLoginRedirect(mockCustomerUser())).toBe("/account");
	});
});

describe("getUserDisplayName", () => {
	it("uses first and last name from user_metadata when present", () => {
		const user = mockUser({
			user_metadata: { first_name: "Alex", last_name: "Rider" },
			email: "alex@example.com",
		});
		expect(getUserDisplayName(user)).toBe("Alex Rider");
	});

	it("uses full_name from user_metadata when first/last are missing", () => {
		const user = mockUser({
			user_metadata: { full_name: "Alex Rider" },
			email: "alex@example.com",
		});
		expect(getUserDisplayName(user)).toBe("Alex Rider");
	});

	it("ignores placeholder invite email", () => {
		const user = mockUser({
			user_metadata: { first_name: "Pat", last_name: "Phone" },
			email: "550e8400-e29b-41d4-a716-446655440000@invite.advcycles.invalid",
			phone: "+15551234567",
		});
		expect(getUserDisplayName(user)).toBe("Pat Phone");
	});

	it("falls back to email local part when no name is set", () => {
		expect(getUserDisplayName(mockUser({ email: "rider@example.com" }))).toBe(
			"rider",
		);
	});

	it("falls back to Account when no name or contact is available", () => {
		expect(getUserDisplayName(mockUser({ email: undefined }))).toBe("Account");
	});
});

describe("getUserContactLabel", () => {
	it("returns real email when present", () => {
		const user = mockUser({ email: "rider@example.com" });
		expect(getUserContactLabel(user)).toBe("rider@example.com");
	});

	it("returns formatted phone for phone-only accounts", () => {
		const user = mockUser({
			email: "550e8400-e29b-41d4-a716-446655440000@invite.advcycles.invalid",
			phone: "+15551234567",
		});
		expect(getUserContactLabel(user)).toBe("(555) 123-4567");
	});
});

describe("userHasRealEmail", () => {
	it("returns false for placeholder invite emails", () => {
		const user = mockUser({
			email: "550e8400-e29b-41d4-a716-446655440000@invite.advcycles.invalid",
		});
		expect(userHasRealEmail(user)).toBe(false);
	});

	it("returns true for real emails", () => {
		expect(userHasRealEmail(mockUser({ email: "rider@example.com" }))).toBe(
			true,
		);
	});
});
