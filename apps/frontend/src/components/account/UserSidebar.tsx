"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export type AccountTab = "services" | "inventory" | "profile";

interface UserSidebarProps {
	activeTab: AccountTab;
	setActiveTab: (tab: AccountTab) => void;
	userEmail: string;
}

const tabs: { id: AccountTab; label: string; mobileLabel: string }[] = [
	{ id: "profile", label: "Profile", mobileLabel: "Profile" },
];

export default function UserSidebar({
	activeTab,
	setActiveTab,
	userEmail,
}: UserSidebarProps) {
	const router = useRouter();
	const supabase = createClient();

	const handleSignOut = async () => {
		await supabase.auth.signOut();
		router.push("/");
		router.refresh();
	};

	return (
		<aside className="fixed bottom-0 left-0 w-full z-50 bg-neutral-950 border-t border-neutral-900 md:static md:w-64 md:border-r md:border-t-0 md:bg-neutral-900/50 flex flex-row md:flex-col shrink-0 pb-safe">
			<div className="p-6 border-b border-neutral-900 hidden md:block">
				<h1 className="text-xl font-black text-white tracking-tighter uppercase italic">
					My <span className="text-red-600">Account</span>
				</h1>
				<p className="text-neutral-500 text-xs mt-2 truncate">{userEmail}</p>
			</div>

			<nav className="flex-1 flex flex-row md:flex-col p-2 md:p-4 gap-2">
				{tabs.map((tab) => (
					<button
						key={tab.id}
						type="button"
						onClick={() => setActiveTab(tab.id)}
						className={`flex-1 md:flex-none px-2 md:px-4 py-3 rounded text-xs md:text-sm font-bold uppercase tracking-widest transition-all text-center md:text-left ${
							activeTab === tab.id
								? "bg-red-600 text-white shadow-lg"
								: "text-neutral-500 hover:bg-neutral-800 hover:text-white"
						}`}
					>
						<span className="md:hidden">{tab.mobileLabel}</span>
						<span className="hidden md:inline">{tab.label}</span>
					</button>
				))}
			</nav>

			<div className="hidden md:flex md:flex-col md:gap-2 p-4 border-t border-neutral-900">
				<Link
					href="/"
					className="text-xs text-neutral-500 hover:text-white uppercase tracking-widest transition-colors"
				>
					&larr; Back to Live Site
				</Link>
				<button
					type="button"
					onClick={handleSignOut}
					className="text-xs text-red-500 hover:text-red-400 uppercase tracking-widest font-bold text-left transition-colors"
				>
					Sign Out
				</button>
			</div>
		</aside>
	);
}
