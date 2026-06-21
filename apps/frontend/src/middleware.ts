import { type NextRequest, NextResponse } from "next/server";
import { getAuthLinkRedirectPath } from "@/utils/auth-link-flow";

export function middleware(request: NextRequest) {
	const redirectPath = getAuthLinkRedirectPath(
		request.nextUrl.pathname,
		request.nextUrl.searchParams,
	);

	if (!redirectPath) {
		return NextResponse.next();
	}

	return NextResponse.redirect(new URL(redirectPath, request.url));
}

export const config = {
	matcher: [
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
	],
};
