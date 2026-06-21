import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
	const { searchParams, origin } = new URL(request.url);
	const code = searchParams.get("code");
	const next = searchParams.get("next") ?? "/account";

	if (code) {
		// Password reset links should not consume PKCE codes on GET — pass through
		// to the client page where the user confirms via button.
		if (next === "/reset-password") {
			return NextResponse.redirect(`${origin}/reset-password?code=${code}`);
		}

		const supabase = await createClient();
		const { error } = await supabase.auth.exchangeCodeForSession(code);

		if (!error) {
			return NextResponse.redirect(`${origin}${next}`);
		}
	}

	// Hash errors (e.g. expired invite) never reach the server — send invite flows
	// to the client page where the hash can be read.
	if (next === "/accept-invite") {
		return NextResponse.redirect(`${origin}/accept-invite`);
	}

	return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
