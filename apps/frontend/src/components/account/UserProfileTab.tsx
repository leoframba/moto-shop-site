"use client";

import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getUserDisplayName } from "@/utils/auth";
import { createClient } from "@/utils/supabase/client";

interface UserProfileTabProps {
	user: User;
}

export default function UserProfileTab({ user }: UserProfileTabProps) {
	const router = useRouter();
	const supabase = createClient();
	const displayName = getUserDisplayName(user);
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
						Need to change your password? We&apos;ll email you a secure reset
						link.
					</p>
					<Link
						href="/forgot-password"
						className="inline-block bg-neutral-950 border border-neutral-700 hover:border-red-600 text-white px-6 py-2 text-sm uppercase tracking-widest font-bold transition-all hover:bg-red-600/10"
					>
						Reset Password
					</Link>
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
