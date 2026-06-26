import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import AccountDashboard from "./AccountDashboard";

export default async function AccountPage() {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/login?next=/account");
	}

	return <AccountDashboard user={user} />;
}
