// apps/frontend/app/login/page.tsx

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	// Init Supabase client
	const supabase = createClient();

	const handleLogin = async (e: React.SyntheticEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		const { error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (error) {
			setError(error.message);
			setLoading(false);
			return;
		}

		router.push("/admin");
		router.refresh();
	};

	return (
		<main className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
			<div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl">
				<div className="mb-8">
					<h1 className="text-2xl font-bold text-white mb-2">Shop Admin</h1>
					<p className="text-neutral-400 text-sm">
						Sign in to manage services and pricing.
					</p>
				</div>

				<form onSubmit={handleLogin} className="space-y-6">
					<div>
						<label
							htmlFor="email-login"
							className="block text-sm font-medium text-neutral-300 mb-2"
						>
							Email Address
						</label>
						<input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							id="email-login"
							className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
							placeholder="admin@motoshop.com"
							required
						/>
					</div>

					<div>
						<label
							htmlFor="password-login"
							className="block text-sm font-medium text-neutral-300 mb-2"
						>
							Password
						</label>
						<input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							id="password-login"
							className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
							placeholder="••••••••"
							required
						/>
					</div>

					{error && (
						<div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
							<p className="text-sm text-red-400 text-center">{error}</p>
						</div>
					)}

					<button
						type="submit"
						disabled={loading}
						className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{loading ? "Authenticating..." : "Sign In"}
					</button>
				</form>
			</div>
		</main>
	);
}
