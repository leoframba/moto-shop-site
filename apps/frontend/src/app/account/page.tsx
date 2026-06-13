import { redirect } from "next/navigation";
import type { ServiceResponse } from "@/types";
import { apiRequest } from "@/utils/api";
import { isAdminUser } from "@/utils/auth";
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

	if (isAdminUser(user)) {
		redirect("/admin");
	}

	const data: ServiceResponse = await apiRequest("/api/services", {
		cache: "no-store",
	});

	const initialData = {
		hourly_rate: data.hourly_rate,
		categories: data.categories,
		services: data.services,
	};

	return <AccountDashboard user={user} initialData={initialData} />;
}
