"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthCard, {
	authInputClassName,
	authLabelClassName,
} from "@/components/auth/AuthCard";
import { createClient } from "@/utils/supabase/client";

/** Flip to true when public self-service signup reopens. */
const SIGNUP_ENABLED = false;

const INVITE_ONLY_MESSAGE =
	"Sign ups are currently invite only while we roll out the rider portal. If you received an invite email, open that link to finish setting up your account.";

function InviteOnlySignup() {
	return (
		<AuthCard
			title="Invite Only"
			subtitle={INVITE_ONLY_MESSAGE}
			footer={
				<p className="text-center text-sm text-neutral-400">
					Already have an account?{" "}
					<Link
						href="/login"
						className="text-red-500 hover:text-red-400 font-semibold transition-colors"
					>
						Sign in
					</Link>
				</p>
			}
		>
			<div className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg text-center">
				<p className="text-sm text-neutral-300 leading-relaxed">
					Need access? Contact the shop and an admin can send you an invitation
					email with a link to finish setup.
				</p>
			</div>
		</AuthCard>
	);
}

function SignupForm() {
	const [fullName, setFullName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [message, setMessage] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	const supabase = createClient();

	const handleSignup = async (e: React.SyntheticEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);
		setMessage(null);

		const { data, error: signUpError } = await supabase.auth.signUp({
			email,
			password,
			options: {
				data: { full_name: fullName },
				emailRedirectTo: `${window.location.origin}/auth/callback?next=/account`,
			},
		});

		if (signUpError) {
			setError(signUpError.message);
			setLoading(false);
			return;
		}

		if (data.session) {
			router.push("/account");
			router.refresh();
			return;
		}

		setMessage(
			"Account created. Check your email to confirm your address, then sign in.",
		);
		setLoading(false);
	};

	return (
		<AuthCard
			title="Create Account"
			subtitle="Join to browse services, track inventory, and manage your profile."
			footer={
				<p className="text-center text-sm text-neutral-400">
					Already have an account?{" "}
					<Link
						href="/login"
						className="text-red-500 hover:text-red-400 font-semibold transition-colors"
					>
						Sign in
					</Link>
				</p>
			}
		>
			<form onSubmit={handleSignup} className="space-y-6">
				<div>
					<label htmlFor="full-name" className={authLabelClassName}>
						Full Name
					</label>
					<input
						type="text"
						value={fullName}
						onChange={(e) => setFullName(e.target.value)}
						id="full-name"
						className={authInputClassName}
						placeholder="Alex Rider"
						required
					/>
				</div>

				<div>
					<label htmlFor="email-signup" className={authLabelClassName}>
						Email Address
					</label>
					<input
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						id="email-signup"
						className={authInputClassName}
						placeholder="you@example.com"
						required
					/>
				</div>

				<div>
					<label htmlFor="password-signup" className={authLabelClassName}>
						Password
					</label>
					<input
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						id="password-signup"
						className={authInputClassName}
						placeholder="At least 8 characters"
						minLength={8}
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
					{loading ? "Creating account..." : "Sign Up"}
				</button>
			</form>
		</AuthCard>
	);
}

export default function SignupPage() {
	if (!SIGNUP_ENABLED) {
		return <InviteOnlySignup />;
	}
	return <SignupForm />;
}
