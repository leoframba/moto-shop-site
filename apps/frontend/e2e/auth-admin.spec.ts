import { expect, test } from "@playwright/test";
import { getE2eAdminCredentials } from "../tests/fixtures/env";
import { signInViaLogin } from "../tests/fixtures/playwright-auth";

const adminCreds = getE2eAdminCredentials();

test.describe("Admin auth flows", () => {
	test.skip(
		!adminCreds,
		"Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run admin E2E tests",
	);

	test("admin can sign in via /login", async ({ page }) => {
		if (!adminCreds) return;

		await page.setViewportSize({ width: 1280, height: 720 });
		await signInViaLogin(page, adminCreds);

		await expect(page).toHaveURL(/\/admin/);
		await expect(page.getByText(/shop admin/i)).toBeVisible();

		await page.getByRole("button", { name: /open admin menu/i }).click();
		const nav = page.getByRole("dialog", { name: /admin navigation/i });
		await expect(nav.getByRole("button", { name: /services/i })).toBeVisible({
			timeout: 10000,
		});
		await expect(nav.getByRole("button", { name: /bike sales/i })).toBeVisible({
			timeout: 10000,
		});
	});

	test("admin navbar link appears when signed in", async ({ page }) => {
		if (!adminCreds) return;

		await page.setViewportSize({ width: 1280, height: 720 });
		await signInViaLogin(page, adminCreds);
		await expect(page).toHaveURL(/.*\/admin\/?$/);
		await page.goto("/");
		const navbar = page.locator("nav");
		await expect(navbar.getByRole("link", { name: /^admin$/i })).toBeVisible({
			timeout: 10000,
		});
		await expect(
			navbar.getByRole("link", { name: /rider portal/i }),
		).not.toBeVisible();
	});
});
