"use client";

import type { EmailOtpType, User } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import AuthCard, {
	authInputClassName,
	authLabelClassName,
} from "@/components/auth/AuthCard";
import { authApiRequest } from "@/utils/api";
import {
	clearAuthHashFromUrl,
	parseAuthHashError,
	parseAuthHashTokens,
} from "@/utils/auth-errors";
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

const SUPPORTED_OTP_TYPES: EmailOtpType[] = [
	"invite",
	"magiclink",
	"signup",
	"recovery",
	"email",
];

const normalizeOtpType = (value: string | null): EmailOtpType | null => {
	if (value && (SUPPORTED_OTP_TYPES as string[]).includes(value)) {
		return value as EmailOtpType;
	}
	return null;
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
	const [bootstrapping, setBootstrapping] = useState(true);
	const [pendingToken, setPendingToken] = useState<{
		tokenHash: string;
		type: EmailOtpType;
	} | null>(null);
	const [activating, setActivating] = useState(false);
	const [completed, setCompleted] = useState(false);
	const router = useRouter();

	const supabase = createClient();
	const codeExchangeStarted = useRef(false);

	const hydrateFromUser = useCallback((user: User | null) => {
		if (!user) return;
		const metadata = readInviteMetadata(user);
		setEmail(user.email ?? "");
		setFirstName(metadata.first_name ?? "");
		setLastName(metadata.last_name ?? "");
		setPhoneNumber(metadata.phone_number ?? "");
		setReady(true);
		setError(null);
	}, []);

	useEffect(() => {
		let cancelled = false;

		const bootstrap = async () => {
			setBootstrapping(true);

			// Button-gated token_hash flow (defeats email link scanners). The link is
			// /accept-invite?token_hash=...&type=invite and we DO NOT verify on load —
			// a scanner GETs the page and leaves; only a human clicking "Activate"
			// consumes the one-time token via verifyOtp().
			const search = new URLSearchParams(window.location.search);
			const tokenHash = search.get("token_hash");
			const otpType = normalizeOtpType(search.get("type"));
			if (tokenHash && otpType) {
				if (!cancelled) {
					setPendingToken({ tokenHash, type: otpType });
					setBootstrapping(false);
				}
				return;
			}

			// Resolve the invite session before reading any #error= hash — Supabase
			// can fire duplicate /verify requests where one succeeds and the other
			// leaves a stale #error=otp_expired on an otherwise valid link.
			if (!codeExchangeStarted.current) {
				codeExchangeStarted.current = true;

				// Implicit flow: tokens delivered in the URL hash. The PKCE browser
				// client won't auto-consume these, so set the session explicitly.
				const hashTokens = parseAuthHashTokens();
				if (hashTokens) {
					const { error: setSessionError } = await supabase.auth.setSession({
						access_token: hashTokens.accessToken,
						refresh_token: hashTokens.refreshToken,
					});
					if (setSessionError) {
						if (!cancelled) {
							setError(setSessionError.message);
							setReady(false);
						}
						clearAuthHashFromUrl();
						setBootstrapping(false);
						return;
					}
					window.history.replaceState({}, "", "/accept-invite");
				} else {
					// PKCE flow: code delivered in the query string.
					const code = new URLSearchParams(window.location.search).get("code");
					if (code) {
						const { error: exchangeError } =
							await supabase.auth.exchangeCodeForSession(code);
						if (exchangeError) {
							if (!cancelled) {
								setError(exchangeError.message);
								setReady(false);
							}
							setBootstrapping(false);
							return;
						}
						window.history.replaceState({}, "", "/accept-invite");
					}
				}
			}

			const {
				data: { session },
			} = await supabase.auth.getSession();
			if (session?.user) {
				if (!cancelled) {
					clearAuthHashFromUrl();
					hydrateFromUser(session.user);
					setBootstrapping(false);
				}
				return;
			}

			const hashError = parseAuthHashError();
			if (hashError) {
				if (!cancelled) {
					setError(hashError);
					setReady(false);
				}
				clearAuthHashFromUrl();
				setBootstrapping(false);
				return;
			}

			if (!cancelled) {
				hydrateFromUser(null);
				setBootstrapping(false);
			}
		};

		void bootstrap();

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			if (!cancelled) hydrateFromUser(session?.user ?? null);
		});

		return () => {
			cancelled = true;
			subscription.unsubscribe();
		};
	}, [supabase, hydrateFromUser]);

	// Warn if the user tries to leave (refresh/close) after their account is
	// activated but before they've set a password — otherwise they'd be left
	// with a passwordless account they can't log back into.
	useEffect(() => {
		if (!ready || completed) return;

		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			event.preventDefault();
			event.returnValue = "";
		};

		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => window.removeEventListener("beforeunload", handleBeforeUnload);
	}, [ready, completed]);

	const handleActivate = async () => {
		if (!pendingToken) return;
		setActivating(true);
		setError(null);

		const { error: verifyError } = await supabase.auth.verifyOtp({
			token_hash: pendingToken.tokenHash,
			type: pendingToken.type,
		});

		if (verifyError) {
			setError(
				"This invite link has expired or was already used. Ask the shop to send a new invitation.",
			);
			setActivating(false);
			setPendingToken(null);
			return;
		}

		window.history.replaceState({}, "", "/accept-invite");
		const {
			data: { session },
		} = await supabase.auth.getSession();
		hydrateFromUser(session?.user ?? null);
		setPendingToken(null);
		setActivating(false);
	};

	const handleComplete = async (e: React.SyntheticEvent) => {
		e.preventDefault();
		setError(null);

		if (password !== confirmPassword) {
			setError("Passwords do not match.");
			return;
		}

		if (password.length < 8) {
			setError("Password must be at least 8 characters.");
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

		setCompleted(true);
		router.push("/account");
		router.refresh();
	};

	if (bootstrapping) {
		return (
			<AuthCard
				title="Accept Invitation"
				subtitle="Confirming your invitation..."
			>
				<p className="text-center text-neutral-500 text-sm animate-pulse">
					Loading...
				</p>
			</AuthCard>
		);
	}

	if (pendingToken) {
		return (
			<AuthCard
				title="Accept Invitation"
				subtitle="Confirm it's really you to activate your rider portal account."
			>
				<div className="space-y-5 text-center">
					<p className="text-neutral-400 text-sm">
						Click the button below to activate your account and set your
						password.
					</p>
					{error && (
						<div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
							<p className="text-sm text-red-400">{error}</p>
						</div>
					)}
					<button
						type="button"
						onClick={() => void handleActivate()}
						disabled={activating}
						className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{activating ? "Activating..." : "Activate My Account"}
					</button>
				</div>
			</AuthCard>
		);
	}

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
					{error ? (
						<div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
							<p className="text-sm text-red-400">{error}</p>
						</div>
					) : (
						<p className="text-neutral-400 text-sm">
							No active invite session found. Open the invitation link from your
							email, or ask the shop to resend it.
						</p>
					)}
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
						placeholder="At least 8 characters"
						minLength={8}
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
						minLength={8}
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
