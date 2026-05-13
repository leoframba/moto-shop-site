import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminDashboard from "./AdminDashboard";

export default async function AdminPage() {
  const cookieStore = await cookies();

  // Create a server-side Supabase client to check the session
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {}
        },
      },
    },
  );

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
