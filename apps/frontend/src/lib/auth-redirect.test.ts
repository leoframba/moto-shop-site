import { mockAdminUser, mockCustomerUser } from "@tests/fixtures/auth-fixtures";
import { describe, expect, it } from "vitest";
import { getAuthRedirect } from "@/lib/auth-redirect";

describe("getAuthRedirect", () => {
	describe("admin routes", () => {
		it("redirects unauthenticated users to /login", () => {
			expect(getAuthRedirect("/admin", null)).toEqual({
				pathname: "/login",
			});
		});

		it("allows admin through on /admin", () => {
			expect(getAuthRedirect("/admin", mockAdminUser())).toBeNull();
		});

		it("redirects customers away from /admin to /account", () => {
			expect(getAuthRedirect("/admin", mockCustomerUser())).toEqual({
				pathname: "/account",
			});
		});

		it("does not guard /login", () => {
			expect(getAuthRedirect("/login", null)).toBeNull();
		});
	});

	describe("account routes", () => {
		it("redirects unauthenticated users to /login with next param", () => {
			expect(getAuthRedirect("/account", null)).toEqual({
				pathname: "/login",
				search: "next=/account",
			});
		});

		it("allows customers through on /account", () => {
			expect(getAuthRedirect("/account", mockCustomerUser())).toBeNull();
		});

		it("redirects admins from /account to /admin", () => {
			expect(getAuthRedirect("/account", mockAdminUser())).toEqual({
				pathname: "/admin",
			});
		});
	});

	describe("auth routes when already signed in", () => {
		it.each([
			"/login",
			"/signup",
			"/forgot-password",
		])("redirects customer away from %s to /account", (path) => {
			expect(getAuthRedirect(path, mockCustomerUser())).toEqual({
				pathname: "/account",
			});
		});

		it.each([
			"/login",
			"/signup",
			"/forgot-password",
		])("redirects admin away from %s to /admin", (path) => {
			expect(getAuthRedirect(path, mockAdminUser())).toEqual({
				pathname: "/admin",
			});
		});
	});

	describe("public routes", () => {
		it("does not redirect unauthenticated users on public pages", () => {
			expect(getAuthRedirect("/sales", null)).toBeNull();
			expect(getAuthRedirect("/", null)).toBeNull();
		});

		it("does not redirect signed-in users on public pages", () => {
			expect(getAuthRedirect("/services", mockCustomerUser())).toBeNull();
		});
	});
});
