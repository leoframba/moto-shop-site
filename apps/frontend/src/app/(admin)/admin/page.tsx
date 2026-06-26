import { redirect } from "next/navigation";
import { isAdminUser } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import AdminDashboard from "./AdminDashboard";

export default async function AdminPage() {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/login");
	}

	if (!isAdminUser(user)) {
		redirect("/account");
	}

	return <AdminDashboard />;
}
