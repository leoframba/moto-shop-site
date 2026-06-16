"use client";

import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AuthCard, {
	authInputClassName,
	authLabelClassName,
} from "@/components/auth/AuthCard";
import { authApiRequest } from "@/utils/api";
import { createClient } from "@/utils/supabase/client";

type InviteMetadata = {
	first_name?: string;
	last_name?: string;
	phone_number?: string;
};

const readInviteMetadata = (user: User | null): InviteMetadata => {
	const metadata = (user?.user_metadata ?? {}) as InviteMetadata;
	return {
		first_name: metadata.first_name ?? "",
		last_name: metadata.last_name ?? "",
		phone_number: metadata.phone_number ?? "",
	};
};

export default function AcceptInvitePage() {
	const [email, setEmail] = useState("");
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [phoneNumber, setPhoneNumber] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [ready, setReady] = useState(false);
	const router = useRouter();

	const supabase = createClient();

	useEffect(() => {
		const hydrateFromUser = (user: User | null) => {
			if (!user) return;
			const metadata = readInviteMetadata(user);
			setEmail(user.email ?? "");
			setFirstName(metadata.first_name ?? "");
			setLastName(metadata.last_name ?? "");
			setPhoneNumber(metadata.phone_number ?? "");
			setReady(true);
		};

		const checkSession = async () => {
			const {
				data: { session },
			} = await supabase.auth.getSession();
			hydrateFromUser(session?.user ?? null);
		};

		void checkSession();

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			hydrateFromUser(session?.user ?? null);
		});

		return () => subscription.unsubscribe();
	}, [supabase]);

	const handleComplete = async (e: React.SyntheticEvent) => {
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

		const { error: updateError } = await supabase.auth.updateUser({
			password,
			data: {
				first_name: firstName.trim() || null,
				last_name: lastName.trim() || null,
				phone_number: phoneNumber.trim() || null,
			},
		});

		if (updateError) {
			setError(updateError.message);
			setLoading(false);
			return;
		}

		try {
			await authApiRequest("/api/portal/profile", {
				method: "PATCH",
				body: JSON.stringify({
					first_name: firstName.trim() || null,
					last_name: lastName.trim() || null,
					phone_number: phoneNumber.trim() || null,
				}),
			});
		} catch (profileError) {
			console.error(profileError);
			// Password is set — profile sync is best-effort.
		}

		router.push("/account");
		router.refresh();
	};

	if (!ready) {
		return (
			<AuthCard
				title="Accept Invitation"
				subtitle="Use the link from your invite email to finish setting up your rider portal account."
				footer={
					<p className="text-center text-sm text-neutral-400">
						Already finished setup?{" "}
						<Link
							href="/login"
							className="text-red-500 hover:text-red-400 font-semibold transition-colors"
						>
							Sign in
						</Link>
					</p>
				}
			>
				<div className="space-y-4 text-center">
					<p className="text-neutral-400 text-sm">
						No active invite session found. Open the invitation link from your
						email, or ask the shop to resend it.
					</p>
				</div>
			</AuthCard>
		);
	}

	return (
		<AuthCard
			title="Finish Your Account"
			subtitle="Set a password to access your garage and service history."
			footer={
				<p className="text-center text-sm text-neutral-400">
					Need help? Contact the shop that invited you.
				</p>
			}
		>
			<form onSubmit={handleComplete} className="space-y-5">
				<div>
					<label htmlFor="invite-email" className={authLabelClassName}>
						Email
					</label>
					<input
						id="invite-email"
						type="email"
						value={email}
						readOnly
						className={`${authInputClassName} cursor-not-allowed opacity-80`}
					/>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div>
						<label htmlFor="invite-first-name" className={authLabelClassName}>
							First Name
						</label>
						<input
							id="invite-first-name"
							type="text"
							value={firstName}
							onChange={(e) => setFirstName(e.target.value)}
							className={authInputClassName}
							placeholder="Alex"
						/>
					</div>
					<div>
						<label htmlFor="invite-last-name" className={authLabelClassName}>
							Last Name
						</label>
						<input
							id="invite-last-name"
							type="text"
							value={lastName}
							onChange={(e) => setLastName(e.target.value)}
							className={authInputClassName}
							placeholder="Rider"
						/>
					</div>
				</div>

				<div>
					<label htmlFor="invite-phone" className={authLabelClassName}>
						Phone Number
					</label>
					<input
						id="invite-phone"
						type="tel"
						value={phoneNumber}
						onChange={(e) => setPhoneNumber(e.target.value)}
						className={authInputClassName}
						placeholder="(555) 123-4567"
					/>
				</div>

				<div>
					<label htmlFor="invite-password" className={authLabelClassName}>
						Password
					</label>
					<input
						id="invite-password"
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className={authInputClassName}
						placeholder="At least 6 characters"
						minLength={6}
						required
					/>
				</div>

				<div>
					<label
						htmlFor="invite-confirm-password"
						className={authLabelClassName}
					>
						Confirm Password
					</label>
					<input
						id="invite-confirm-password"
						type="password"
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
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
					{loading ? "Saving..." : "Create Account"}
				</button>
			</form>
		</AuthCard>
	);
}
