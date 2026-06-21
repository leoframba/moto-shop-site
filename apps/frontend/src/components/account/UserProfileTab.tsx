"use client";

import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getUserDisplayName } from "@/utils/auth";
import { createClient } from "@/utils/supabase/client";

interface UserProfileTabProps {
	user: User;
}

const profileInputClassName =
	"w-full rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-3 text-white placeholder:text-neutral-500 outline-none transition-colors focus:border-red-600";

export default function UserProfileTab({ user }: UserProfileTabProps) {
	const router = useRouter();
	const supabase = createClient();
	const displayName = getUserDisplayName(user);
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [passwordError, setPasswordError] = useState<string | null>(null);
	const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
	const [passwordLoading, setPasswordLoading] = useState(false);
	const memberSince = user.created_at
		? new Date(user.created_at).toLocaleDateString("en-US", {
				month: "long",
				day: "numeric",
				year: "numeric",
			})
		: "—";

	const handleSignOut = async () => {
		await supabase.auth.signOut();
		router.push("/");
		router.refresh();
	};

	const handleChangePassword = async (event: React.SyntheticEvent) => {
		event.preventDefault();
		setPasswordError(null);
		setPasswordMessage(null);

		if (newPassword !== confirmPassword) {
			setPasswordError("Passwords do not match.");
			return;
		}

		if (newPassword.length < 8) {
			setPasswordError("Password must be at least 8 characters.");
			return;
		}

		setPasswordLoading(true);

		const { error } = await supabase.auth.updateUser({ password: newPassword });

		if (error) {
			setPasswordError(error.message);
			setPasswordLoading(false);
			return;
		}

		setNewPassword("");
		setConfirmPassword("");
		setPasswordMessage("Your password has been updated.");
		setPasswordLoading(false);
	};

	return (
		<div className="max-w-xl">
			<header className="mb-8">
				<h2 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tighter mb-2">
					Your <span className="text-red-600">Profile</span>
				</h2>
				<p className="text-neutral-400 text-sm">
					Manage your account settings and security.
				</p>
			</header>

			<div className="space-y-6">
				<div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
					<div className="flex items-center gap-4 mb-6">
						<div className="w-14 h-14 rounded-full bg-red-600/20 border border-red-600/40 flex items-center justify-center text-red-500 font-black text-xl uppercase">
							{displayName.charAt(0)}
						</div>
						<div>
							<p className="text-white font-bold text-lg">{displayName}</p>
							<p className="text-neutral-400 text-sm">{user.email}</p>
						</div>
					</div>

					<dl className="space-y-4 text-sm">
						<div className="flex justify-between border-b border-neutral-800 pb-3">
							<dt className="text-neutral-500 uppercase tracking-widest text-xs">
								Member Since
							</dt>
							<dd className="text-white font-mono">{memberSince}</dd>
						</div>
						<div className="flex justify-between">
							<dt className="text-neutral-500 uppercase tracking-widest text-xs">
								Email Verified
							</dt>
							<dd
								className={
									user.email_confirmed_at
										? "text-red-500 font-bold uppercase text-xs"
										: "text-neutral-400 text-xs"
								}
							>
								{user.email_confirmed_at ? "Yes" : "Pending"}
							</dd>
						</div>
					</dl>
				</div>

				<div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
					<h3 className="text-white font-bold uppercase tracking-widest text-sm">
						Security
					</h3>
					<p className="text-neutral-400 text-sm">
						Update your password while signed in. If you are locked out, use
						Forgot password on the sign-in page to get a reset link by email.
					</p>
					<form onSubmit={handleChangePassword} className="space-y-4">
						<div>
							<label
								htmlFor="profile-new-password"
								className="mb-1.5 block text-xs uppercase tracking-widest text-neutral-500"
							>
								New Password
							</label>
							<input
								id="profile-new-password"
								type="password"
								value={newPassword}
								onChange={(event) => setNewPassword(event.target.value)}
								className={profileInputClassName}
								placeholder="At least 8 characters"
								minLength={8}
								autoComplete="new-password"
								required
							/>
						</div>
						<div>
							<label
								htmlFor="profile-confirm-password"
								className="mb-1.5 block text-xs uppercase tracking-widest text-neutral-500"
							>
								Confirm Password
							</label>
							<input
								id="profile-confirm-password"
								type="password"
								value={confirmPassword}
								onChange={(event) => setConfirmPassword(event.target.value)}
								className={profileInputClassName}
								placeholder="Repeat new password"
								minLength={8}
								autoComplete="new-password"
								required
							/>
						</div>

						{passwordError ? (
							<div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
								<p className="text-center text-sm text-red-400">
									{passwordError}
								</p>
							</div>
						) : null}

						{passwordMessage ? (
							<div className="rounded-lg border border-red-600/20 bg-red-600/10 p-3">
								<p className="text-center text-sm text-red-300">
									{passwordMessage}
								</p>
							</div>
						) : null}

						<button
							type="submit"
							disabled={passwordLoading}
							className="inline-block bg-neutral-950 border border-neutral-700 hover:border-red-600 text-white px-6 py-2 text-sm uppercase tracking-widest font-bold transition-all hover:bg-red-600/10 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{passwordLoading ? "Updating..." : "Change Password"}
						</button>
					</form>
				</div>

				<button
					type="button"
					onClick={handleSignOut}
					className="w-full md:w-auto bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-8 rounded-lg uppercase tracking-widest transition-colors"
				>
					Sign Out
				</button>
			</div>
		</div>
	);
}
