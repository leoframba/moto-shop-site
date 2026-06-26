"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import AuthCard from "@/components/auth/AuthCard";
import { isAdminUser } from "@/utils/auth";
import {
	clearAuthHashFromUrl,
	getAuthCallbackErrorMessage,
	parseAuthHashError,
} from "@/utils/auth-errors";
import {
	formatIdentifierForDisplay,
	isEmailIdentifier,
	parseEmailOrPhone,
} from "@/utils/phone";
import { createClient } from "@/utils/supabase/client";

function LoginForm() {
	const [emailOrPhone, setEmailOrPhone] = useState("");
	const [identifier, setIdentifier] = useState<string | null>(null);
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const router = useRouter();
	const searchParams = useSearchParams();
	const next = searchParams.get("next") ?? "/account";
	const callbackError = searchParams.get("error");

	const supabase = createClient();
	const loginUsesEmail = identifier ? isEmailIdentifier(identifier) : false;

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

		if (!password) {
			setError("Please enter a password");
			setLoading(false);
			return;
		}

		const identifierPayload = loginUsesEmail
			? { email: identifier ?? "" }
			: { phone: identifier ?? "" };

		const { data, error: signInError } = await supabase.auth.signInWithPassword(
			{
				...identifierPayload,
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

	const handleIdentifierSubmit = (e: React.SyntheticEvent) => {
		e.preventDefault();

		const parsed = parseEmailOrPhone(emailOrPhone);
		if (parsed.type === "error") {
			setError(parsed.message);
			return;
		}

		setIdentifier(parsed.value);
		setError(null);
		setEmailOrPhone("");
	};

	const handleChangeIdentifier = () => {
		setIdentifier(null);
		setError(null);
		setPassword("");
		setEmailOrPhone("");
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
			{identifier === null ? (
				<form onSubmit={handleIdentifierSubmit} className="space-y-6">
					{error && (
						<div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
							<p className="text-sm text-red-400 text-center">{error}</p>
						</div>
					)}
					<div className="relative w-full">
						<input
							type="text"
							name="username"
							autoComplete="username"
							value={emailOrPhone}
							onChange={(e) => setEmailOrPhone(e.target.value)}
							id="identifier"
							className="peer w-full bg-neutral-950 border border-neutral-800 rounded-lg px-5 pt-6 pb-2 text-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors placeholder-transparent"
							placeholder="Email or phone number"
						/>
						<label
							htmlFor="identifier"
							className="absolute left-5 top-4 text-neutral-500 text-base pointer-events-none transition-all duration-200 transform origin-[0]
							peer-focus:scale-75 peer-focus:-translate-y-2.5
							peer-[:not(:placeholder-shown)]:scale-75 peer-[:not(:placeholder-shown)]:-translate-y-2.5"
						>
							Email or phone number
						</label>
					</div>
					<button
						type="submit"
						disabled={loading}
						className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Next
					</button>
				</form>
			) : (
				<form onSubmit={handleLogin} className="space-y-6">
					{error && (
						<div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
							<p className="text-sm text-red-400 text-center">{error}</p>
						</div>
					)}
					<div className="flex items-center justify-center gap-3">
						<span>{formatIdentifierForDisplay(identifier)}</span>
						<button
							type="button"
							className="text-lg font-bold text-red-600 hover:text-red-500 transition-colors"
							onClick={handleChangeIdentifier}
						>
							Change
						</button>
					</div>
					<input
						type="text"
						name="username"
						autoComplete="username"
						value={identifier}
						readOnly
						tabIndex={-1}
						aria-hidden
						className="sr-only"
					/>
					<div className="space-y-2">
						{loginUsesEmail ? (
							<div className="flex justify-end">
								<Link
									href="/forgot-password"
									className="text-xs text-red-500 hover:text-red-400 transition-colors"
								>
									Forgot password?
								</Link>
							</div>
						) : null}
						<div className="relative w-full">
							<input
								type="password"
								name="password"
								autoComplete="current-password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								id="password"
								className="peer w-full bg-neutral-950 border border-neutral-800 rounded-lg px-5 pt-6 pb-2 text-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors placeholder-transparent"
								placeholder="Password"
							/>
							<label
								htmlFor="password"
								className="absolute left-5 top-4 text-neutral-500 text-base pointer-events-none transition-all duration-200 transform origin-[0]
							peer-focus:scale-75 peer-focus:-translate-y-2.5
							peer-[:not(:placeholder-shown)]:scale-75 peer-[:not(:placeholder-shown)]:-translate-y-2.5"
							>
								Password
							</label>
						</div>
					</div>
					<button
						type="submit"
						disabled={loading}
						className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{loading ? "Logging in..." : "Log In"}
					</button>
				</form>
			)}
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
