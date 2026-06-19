import type { User } from "@supabase/supabase-js";
import { isAdminUser } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";

export async function verifyAdminRequest(
	request: Request,
): Promise<User | null> {
	const authHeader = request.headers.get("authorization");
	const bearerToken = authHeader?.startsWith("Bearer ")
		? authHeader.slice("Bearer ".length)
		: null;

	const supabase = await createClient();

	if (bearerToken) {
		const {
			data: { user },
		} = await supabase.auth.getUser(bearerToken);
		if (user && isAdminUser(user)) return user;
	}

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (user && isAdminUser(user)) return user;

	return null;
}
