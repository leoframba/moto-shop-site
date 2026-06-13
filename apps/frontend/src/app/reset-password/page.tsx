"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AuthCard, {
	authInputClassName,
	authLabelClassName,
} from "@/components/auth/AuthCard";
import { createClient } from "@/utils/supabase/client";

export default function ResetPasswordPage() {
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [ready, setReady] = useState(false);
	const router = useRouter();

	const supabase = createClient();

	useEffect(() => {
		const checkSession = async () => {
			const {
				data: { session },
			} = await supabase.auth.getSession();
			setReady(!!session);
		};

		void checkSession();

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((event, session) => {
			if (event === "PASSWORD_RECOVERY" || session) {
				setReady(true);
			}
		});

		return () => subscription.unsubscribe();
	}, [supabase]);

	const handleUpdate = async (e: React.SyntheticEvent) => {
		e.preventDefault();
		setError(null);

		if (password !== confirmPassword) {
			setError("Passwords do not match.");
			return;
		}

		if (password.length < 6) {
			setError("Password must be at least 6 characters.");
			return;
		}

		setLoading(true);

		const { error: updateError } = await supabase.auth.updateUser({ password });

		if (updateError) {
			setError(updateError.message);
			setLoading(false);
			return;
		}

		router.push("/account");
		router.refresh();
	};

	if (!ready) {
		return (
			<AuthCard
				title="Reset Password"
				subtitle="Use the link from your email to set a new password."
			>
				<div className="space-y-4 text-center">
					<p className="text-neutral-400 text-sm">
						No active reset session found. Request a new link below.
					</p>
					<Link
						href="/forgot-password"
						className="inline-block bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-lg uppercase tracking-widest transition-colors"
					>
						Request Reset Link
					</Link>
				</div>
			</AuthCard>
		);
	}

	return (
		<AuthCard
			title="New Password"
			subtitle="Choose a new password for your account."
		>
			<form onSubmit={handleUpdate} className="space-y-6">
				<div>
					<label htmlFor="new-password" className={authLabelClassName}>
						New Password
					</label>
					<input
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						id="new-password"
						className={authInputClassName}
						placeholder="At least 6 characters"
						minLength={6}
						required
					/>
				</div>

				<div>
					<label htmlFor="confirm-password" className={authLabelClassName}>
						Confirm Password
					</label>
					<input
						type="password"
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
						id="confirm-password"
						className={authInputClassName}
						placeholder="Repeat password"
						minLength={6}
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
					{loading ? "Updating..." : "Update Password"}
				</button>
			</form>
		</AuthCard>
	);
}
