import { expect, test } from "@playwright/test";
import { getE2eCustomerCredentials } from "../tests/fixtures/env";
import { signInViaLogin } from "../tests/fixtures/playwright-auth";

const customerCreds = getE2eCustomerCredentials();

test.describe("Customer auth flows", () => {
	test.skip(
		!customerCreds,
		"Set E2E_CUSTOMER_EMAIL and E2E_CUSTOMER_PASSWORD to run customer E2E tests",
	);

	test("customer can sign in and reach account dashboard", async ({ page }) => {
		if (!customerCreds) return;

		await signInViaLogin(page, customerCreds);

		await expect(page).toHaveURL(/\/account/);
		await expect(page.getByText(/my account/i)).toBeVisible();
		await expect(page.getByRole("button", { name: /profile/i })).toBeVisible();
	});

	test("signed-in customer sees account in navbar", async ({ page }) => {
		if (!customerCreds) return;

		await signInViaLogin(page, customerCreds);
		await expect(page).toHaveURL(/\/account/);

		await page.goto("/");
		await expect(page.getByRole("link", { name: /account|@/i })).toBeVisible();
	});

	test("customer cannot access admin dashboard", async ({ page }) => {
		if (!customerCreds) return;

		await signInViaLogin(page, customerCreds);
		await expect(page).toHaveURL(/\/account/);

		await page.goto("/admin");
		await expect(page).toHaveURL(/\/account/);
	});
});
