import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminDashboard from "./AdminDashboard";

export default async function AdminPage() {
	const cookieStore = await cookies();

	// Create a server-side Supabase client to check the session
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

	const res = await fetch("http://127.0.0.1:8000/api/services", {
		cache: "no-store",
	});
	const data = await res.json();

	const initialData = {
		hourly_rate: data.hourly_rate,
		services: data.services,
	};

	// Pass the data to the interactive client component
	return <AdminDashboard initialData={initialData} />;
}
