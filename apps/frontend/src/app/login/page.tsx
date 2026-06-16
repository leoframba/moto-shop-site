"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import AuthCard, {
	authInputClassName,
	authLabelClassName,
} from "@/components/auth/AuthCard";
import { isAdminUser } from "@/utils/auth";
import {
	clearAuthHashFromUrl,
	getAuthCallbackErrorMessage,
	parseAuthHashError,
} from "@/utils/auth-errors";
import { createClient } from "@/utils/supabase/client";

function LoginForm() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const router = useRouter();
	const searchParams = useSearchParams();
	const next = searchParams.get("next") ?? "/account";
	const callbackError = searchParams.get("error");

	const supabase = createClient();

	useEffect(() => {
		const hashError = parseAuthHashError();
		if (hashError) {
			setError(hashError);
			clearAuthHashFromUrl();
			return;
		}

		const message = getAuthCallbackErrorMessage(callbackError);
		if (message) setError(message);
	}, [callbackError]);

	const handleLogin = async (e: React.SyntheticEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		const { data, error: signInError } = await supabase.auth.signInWithPassword(
			{
				email,
				password,
			},
		);

		if (signInError) {
			setError(signInError.message);
			setLoading(false);
			return;
		}

		const redirectTo = data.user
			? isAdminUser(data.user)
				? "/admin"
				: next
			: next;

		router.push(redirectTo);
		router.refresh();
	};

	return (
		<AuthCard
			title="Rider Login"
			subtitle="Sign in to view services, inventory, and manage your account."
			footer={
				<p className="text-center text-sm text-neutral-400 leading-relaxed">
					Sign ups are currently invite only while we roll out the rider portal.
				</p>
			}
		>
			<form onSubmit={handleLogin} className="space-y-6">
				<div>
					<label htmlFor="email-login" className={authLabelClassName}>
						Email Address
					</label>
					<input
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						id="email-login"
						className={authInputClassName}
						placeholder="you@example.com"
						required
					/>
				</div>

				<div>
					<div className="flex items-center justify-between mb-2">
						<label htmlFor="password-login" className={authLabelClassName}>
							Password
						</label>
						<Link
							href="/forgot-password"
							className="text-xs text-red-500 hover:text-red-400 transition-colors"
						>
							Forgot password?
						</Link>
					</div>
					<input
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						id="password-login"
						className={authInputClassName}
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
					className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{loading ? "Signing in..." : "Sign In"}
				</button>
			</form>
		</AuthCard>
	);
}

export default function LoginPage() {
	return (
		<Suspense
			fallback={
				<main className="min-h-screen bg-black flex items-center justify-center">
					<p className="text-neutral-500 uppercase tracking-widest text-sm animate-pulse">
						Loading...
					</p>
				</main>
			}
		>
			<LoginForm />
		</Suspense>
	);
}
