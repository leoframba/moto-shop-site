import { describe, expect, it } from "vitest";
import { getAuthLinkRedirectPath } from "@/utils/auth-link-flow";

describe("getAuthLinkRedirectPath", () => {
	it("redirects recovery token links from the homepage to reset-password", () => {
		const params = new URLSearchParams({
			token_hash: "pkce_abc123",
			type: "recovery",
		});

		expect(getAuthLinkRedirectPath("/", params)).toBe(
			"/reset-password?token_hash=pkce_abc123&type=recovery",
		);
	});

	it("redirects invite token links from arbitrary paths to accept-invite", () => {
		const params = new URLSearchParams({
			token_hash: "pkce_invite",
			type: "invite",
		});

		expect(getAuthLinkRedirectPath("/contact", params)).toBe(
			"/accept-invite?token_hash=pkce_invite&type=invite",
		);
	});

	it("does not redirect when already on reset-password", () => {
		const params = new URLSearchParams({
			token_hash: "pkce_abc123",
			type: "recovery",
		});

		expect(getAuthLinkRedirectPath("/reset-password", params)).toBeNull();
	});
});
