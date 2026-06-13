import { expect, test } from "@playwright/test";

test.describe("Route protection (unauthenticated)", () => {
	test("redirects /admin to /login", async ({ page }) => {
		await page.goto("/admin");
		await expect(page).toHaveURL(/\/login/);
	});

	test("redirects /account to /login with next param", async ({ page }) => {
		await page.goto("/account");
		await expect(page).toHaveURL(/\/login/);
		expect(page.url()).toContain("next=/account");
	});

	test("shows login page for unauthenticated users", async ({ page }) => {
		await page.goto("/login");
		await expect(
			page.getByRole("heading", { name: /rider login/i }),
		).toBeVisible();
		await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
	});

	test("login page links to signup", async ({ page }) => {
		await page.goto("/login");
		await expect(
			page.getByRole("link", { name: /create an account/i }),
		).toBeVisible();
	});

	test("shows forgot password page", async ({ page }) => {
		await page.goto("/forgot-password");
		await expect(
			page.getByRole("heading", { name: /reset password/i }),
		).toBeVisible();
	});

	test("navbar shows rider portal when logged out", async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 720 });
		await page.goto("/");
		await expect(
			page.locator("nav").getByRole("link", { name: /rider portal/i }),
		).toBeVisible();
	});

	test("mobile menu shows rider portal when logged out", async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto("/");
		await page.getByRole("button", { name: /open menu/i }).click();
		await expect(
			page.locator("nav").getByRole("link", { name: /rider portal/i }),
		).toBeVisible();
		await expect(
			page.getByRole("link", { name: /sign up/i }),
		).not.toBeVisible();
	});

	test("signup page is reachable from login", async ({ page }) => {
		await page.goto("/login");
		await page.getByRole("link", { name: /create an account/i }).click();
		await expect(page).toHaveURL(/\/signup/);
		await expect(
			page.getByRole("heading", { name: /create account/i }),
		).toBeVisible();
		await expect(page.getByRole("button", { name: /sign up/i })).toBeVisible();
	});
});
