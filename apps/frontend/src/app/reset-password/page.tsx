"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { EmailOtpType } from "@supabase/supabase-js";
import AuthCard, {
	authInputClassName,
	authLabelClassName,
} from "@/components/auth/AuthCard";
import {
	clearAuthHashFromUrl,
	parseAuthHashError,
	parseAuthHashTokens,
} from "@/utils/auth-errors";
import {
	normalizeAuthLinkOtpType,
	RECOVERY_LINK_EXPIRED_MESSAGE,
} from "@/utils/auth-link-flow";
import { createClient } from "@/utils/supabase/client";

export default function ResetPasswordPage() {
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
	const [pendingCode, setPendingCode] = useState<string | null>(null);
	const [pendingHashTokens, setPendingHashTokens] = useState<{
		accessToken: string;
		refreshToken: string;
	} | null>(null);
	const [activating, setActivating] = useState(false);
	const router = useRouter();

	const supabase = createClient();
	const legacyFlowStarted = useRef(false);

	const markReady = useCallback(() => {
		setReady(true);
		setError(null);
	}, []);

	useEffect(() => {
		let cancelled = false;

		const bootstrap = async () => {
			setBootstrapping(true);

			// Button-gated token_hash flow (defeats email link scanners).
			const search = new URLSearchParams(window.location.search);
			const tokenHash = search.get("token_hash");
			const otpType = normalizeAuthLinkOtpType(search.get("type"));
			if (tokenHash && otpType) {
				if (!cancelled) {
					setPendingToken({ tokenHash, type: otpType });
					setBootstrapping(false);
				}
				return;
			}

			const code = search.get("code");
			if (code) {
				if (!cancelled) {
					setPendingCode(code);
					setBootstrapping(false);
				}
				return;
			}

			if (!legacyFlowStarted.current) {
				legacyFlowStarted.current = true;

				const hashTokens = parseAuthHashTokens();
				if (hashTokens) {
					if (!cancelled) {
						setPendingHashTokens(hashTokens);
						setBootstrapping(false);
					}
					return;
				}
			}

			const {
				data: { session },
			} = await supabase.auth.getSession();
			if (session) {
				if (!cancelled) {
					clearAuthHashFromUrl();
					markReady();
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
				setReady(false);
				setBootstrapping(false);
			}
		};

		void bootstrap();

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((event, session) => {
			if (event === "PASSWORD_RECOVERY" && session) {
				markReady();
			}
		});

		return () => {
			cancelled = true;
			subscription.unsubscribe();
		};
	}, [supabase, markReady]);

	const handleActivate = async () => {
		setActivating(true);
		setError(null);

		if (pendingToken) {
			const { error: verifyError } = await supabase.auth.verifyOtp({
				token_hash: pendingToken.tokenHash,
				type: pendingToken.type,
			});

			if (verifyError) {
				setError(RECOVERY_LINK_EXPIRED_MESSAGE);
				setActivating(false);
				setPendingToken(null);
				return;
			}
		} else if (pendingCode) {
			const { error: exchangeError } =
				await supabase.auth.exchangeCodeForSession(pendingCode);

			if (exchangeError) {
				setError(RECOVERY_LINK_EXPIRED_MESSAGE);
				setActivating(false);
				setPendingCode(null);
				return;
			}
		} else if (pendingHashTokens) {
			const { error: setSessionError } = await supabase.auth.setSession({
				access_token: pendingHashTokens.accessToken,
				refresh_token: pendingHashTokens.refreshToken,
			});

			if (setSessionError) {
				setError(RECOVERY_LINK_EXPIRED_MESSAGE);
				setActivating(false);
				setPendingHashTokens(null);
				return;
			}
		} else {
			setActivating(false);
			return;
		}

		window.history.replaceState({}, "", "/reset-password");
		setPendingToken(null);
		setPendingCode(null);
		setPendingHashTokens(null);
		markReady();
		setActivating(false);
	};

	const handleUpdate = async (event: React.SyntheticEvent) => {
		event.preventDefault();
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

		const { error: updateError } = await supabase.auth.updateUser({ password });

		if (updateError) {
			setError(updateError.message);
			setLoading(false);
			return;
		}

		router.push("/account");
		router.refresh();
	};

	if (bootstrapping) {
		return (
			<AuthCard title="Reset Password" subtitle="Loading your reset link...">
				<p className="text-center text-neutral-500 text-sm animate-pulse">
					Loading...
				</p>
			</AuthCard>
		);
	}

	if (pendingToken || pendingCode || pendingHashTokens) {
		return (
			<AuthCard
				title="Reset Password"
				subtitle="Confirm it's really you before choosing a new password."
			>
				<div className="space-y-5 text-center">
					<p className="text-neutral-400 text-sm">
						Click the button below to activate this reset link. This prevents
						email scanners from using your one-time link before you do.
					</p>
					{error ? (
						<div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
							<p className="text-sm text-red-400">{error}</p>
						</div>
					) : null}
					<button
						type="button"
						onClick={() => void handleActivate()}
						disabled={activating}
						className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{activating ? "Activating..." : "Continue to Reset Password"}
					</button>
				</div>
			</AuthCard>
		);
	}

	if (!ready) {
		return (
			<AuthCard
				title="Reset Password"
				subtitle="Use the link from your email to set a new password."
			>
				<div className="space-y-4 text-center">
					{error ? (
						<div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
							<p className="text-sm text-red-400">{error}</p>
						</div>
					) : (
						<p className="text-neutral-400 text-sm">
							No active reset session found. Request a new link below.
						</p>
					)}
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
						onChange={(event) => setPassword(event.target.value)}
						id="new-password"
						className={authInputClassName}
						placeholder="At least 8 characters"
						minLength={8}
						autoComplete="new-password"
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
						onChange={(event) => setConfirmPassword(event.target.value)}
						id="confirm-password"
						className={authInputClassName}
						placeholder="Repeat password"
						minLength={8}
						autoComplete="new-password"
						required
					/>
				</div>

				{error ? (
					<div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
						<p className="text-sm text-red-400 text-center">{error}</p>
					</div>
				) : null}

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
