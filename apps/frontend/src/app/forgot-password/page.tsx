"use client";

import Link from "next/link";
import { useState } from "react";
import AuthCard, {
	authInputClassName,
	authLabelClassName,
} from "@/components/auth/AuthCard";
import { createClient } from "@/utils/supabase/client";

export default function ForgotPasswordPage() {
	const [email, setEmail] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [message, setMessage] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const supabase = createClient();

	const handleReset = async (e: React.SyntheticEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);
		setMessage(null);

		const { error: resetError } = await supabase.auth.resetPasswordForEmail(
			email,
			{
				// Lands on /reset-password with token_hash&type=recovery when the Supabase
				// recovery email template uses {{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery
				redirectTo: `${window.location.origin}/reset-password`,
			},
		);

		if (resetError) {
			setError(resetError.message);
			setLoading(false);
			return;
		}

		setMessage(
			"If an account exists for that email, a reset link has been sent.",
		);
		setLoading(false);
	};

	return (
		<AuthCard
			title="Reset Password"
			subtitle="Enter your email and we'll send you a link to set a new password."
			footer={
				<p className="text-center text-sm text-neutral-400">
					<Link
						href="/login"
						className="text-red-500 hover:text-red-400 font-semibold transition-colors"
					>
						&larr; Back to sign in
					</Link>
				</p>
			}
		>
			<form onSubmit={handleReset} className="space-y-6">
				<div>
					<label htmlFor="email-reset" className={authLabelClassName}>
						Email Address
					</label>
					<input
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						id="email-reset"
						className={authInputClassName}
						placeholder="you@example.com"
						required
					/>
				</div>

				{error && (
					<div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
						<p className="text-sm text-red-400 text-center">{error}</p>
					</div>
				)}

				{message && (
					<div className="p-3 bg-red-600/10 border border-red-600/20 rounded-lg">
						<p className="text-sm text-red-300 text-center">{message}</p>
					</div>
				)}

				<button
					type="submit"
					disabled={loading}
					className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{loading ? "Sending..." : "Send Reset Link"}
				</button>
			</form>
		</AuthCard>
	);
}
