import type { Page } from "@playwright/test";
import type { TestCredentials } from "./env";

export async function signInViaLogin(
	page: Page,
	{ email, password }: TestCredentials,
) {
	await page.goto("/login");
	await page.getByLabel(/email or phone number/i).fill(email);
	await page.getByRole("button", { name: /^next$/i }).click();
	await page.getByLabel(/^password$/i).fill(password);
	await page.getByRole("button", { name: /log in/i }).click();
}
