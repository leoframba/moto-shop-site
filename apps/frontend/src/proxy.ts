import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getAuthRedirect } from "@/lib/auth-redirect";

export async function proxy(request: NextRequest) {
	let supabaseResponse = NextResponse.next({
		request,
	});

	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

	if (!url || !key) {
		throw new Error("Missing Supabase environment variables");
	}

	const supabase = createServerClient(url, key, {
		cookies: {
			getAll() {
				return request.cookies.getAll();
			},
			setAll(cookiesToSet) {
				cookiesToSet.forEach(({ name, value }) => {
					request.cookies.set(name, value);
				});
				supabaseResponse = NextResponse.next({
					request,
				});
				cookiesToSet.forEach(({ name, value, options }) => {
					supabaseResponse.cookies.set(name, value, options);
				});
			},
		},
	});

	const {
		data: { user },
	} = await supabase.auth.getUser();

	const redirect = getAuthRedirect(request.nextUrl.pathname, user);

	if (redirect) {
		const redirectUrl = request.nextUrl.clone();
		redirectUrl.pathname = redirect.pathname;
		redirectUrl.search = redirect.search ?? "";
		return NextResponse.redirect(redirectUrl);
	}

	return supabaseResponse;
}

export const config = {
	matcher: [
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
