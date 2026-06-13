import {
	mockAdminUser,
	mockCustomerUser,
	mockUser,
} from "@tests/fixtures/auth-fixtures";
import { describe, expect, it } from "vitest";
import {
	getPostLoginRedirect,
	getUserDisplayName,
	isAdminUser,
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
	it("uses full_name from user_metadata when present", () => {
		const user = mockUser({
			user_metadata: { full_name: "Alex Rider" },
			email: "alex@example.com",
		});
		expect(getUserDisplayName(user)).toBe("Alex Rider");
	});

	it("falls back to email local part", () => {
		expect(getUserDisplayName(mockUser({ email: "rider@example.com" }))).toBe(
			"rider",
		);
	});

	it("falls back to Account when email is missing", () => {
		expect(getUserDisplayName(mockUser({ email: undefined }))).toBe("Account");
	});
});
