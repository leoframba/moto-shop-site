import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ServiceResponse } from "@/types";
import { apiRequest } from "@/utils/api";
import AdminDashboard from "./AdminDashboard";

export default async function AdminPage() {
	const cookieStore = await cookies();

	// Supabase client
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

	if (!supabaseUrl || !supabaseAnonKey) {
		throw new Error("Missing Supabase environment variables");
	}

	const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
		cookies: {
			getAll() {
				return cookieStore.getAll();
			},
			setAll(cookiesToSet) {
				try {
					cookiesToSet.forEach(({ name, value, options }) => {
						cookieStore.set(name, value, options);
					});
				} catch {}
			},
		},
	});

	const {
		data: { session },
	} = await supabase.auth.getSession();

	if (!session) {
		redirect("/login");
	}

	const data: ServiceResponse = await apiRequest("/api/services", {
		cache: "no-store",
	});

	const initialData = {
		hourly_rate: data.hourly_rate,
		categories: data.categories,
		services: data.services,
	};

	return <AdminDashboard initialData={initialData} />;
}
