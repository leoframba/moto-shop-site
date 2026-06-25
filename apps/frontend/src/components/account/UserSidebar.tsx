"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiHome, FiLogOut, FiMenu, FiSettings, FiX } from "react-icons/fi";
import { createClient } from "@/utils/supabase/client";

export type AccountTab = "garage" | "services" | "inventory" | "profile";

interface UserSidebarProps {
	activeTab: AccountTab;
	setActiveTab: (tab: AccountTab) => void;
	userDisplayName: string;
	userContactLabel: string;
	isAdmin?: boolean;
}

const ACCOUNT_TABS: { id: AccountTab; label: string }[] = [
	{ id: "garage", label: "Garage" },
	{ id: "profile", label: "Profile" },
];

function tabButtonClass(isActive: boolean) {
	return `w-full rounded-md px-4 py-3 text-left text-sm font-bold uppercase tracking-widest transition-colors ${
		isActive
			? "bg-red-600 text-white shadow-lg"
			: "text-neutral-400 hover:bg-neutral-800 hover:text-white"
	}`;
}

function UserSidebarFooter({
	onNavigate,
	isAdmin,
}: {
	onNavigate?: () => void;
	isAdmin?: boolean;
}) {
	const router = useRouter();
	const supabase = createClient();

	const handleSignOut = async () => {
		onNavigate?.();
		await supabase.auth.signOut();
		router.push("/");
		router.refresh();
	};

	return (
		<div className="space-y-2 border-t border-neutral-800 p-4">
			{isAdmin && (
				<Link
					href="/admin"
					onClick={onNavigate}
					className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-neutral-700 bg-neutral-900 px-4 py-3 text-xs font-bold uppercase tracking-widest text-neutral-200 transition-colors hover:border-neutral-500 hover:bg-neutral-800 hover:text-white"
				>
					<FiSettings className="h-4 w-4 shrink-0" aria-hidden />
					Admin Dashboard
				</Link>
			)}
			<Link
				href="/"
				onClick={onNavigate}
				className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-neutral-700 bg-neutral-900 px-4 py-3 text-xs font-bold uppercase tracking-widest text-neutral-200 transition-colors hover:border-neutral-500 hover:bg-neutral-800 hover:text-white"
			>
				<FiHome className="h-4 w-4 shrink-0" aria-hidden />
				Back to Home
			</Link>
			<button
				type="button"
				onClick={() => void handleSignOut()}
				className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-red-900/70 bg-red-950/30 px-4 py-3 text-xs font-bold uppercase tracking-widest text-red-400 transition-colors hover:border-red-700 hover:bg-red-950/50 hover:text-red-300"
			>
				<FiLogOut className="h-4 w-4 shrink-0" aria-hidden />
				Sign Out
			</button>
		</div>
	);
}

export default function UserSidebar({
	activeTab,
	setActiveTab,
	userDisplayName,
	userContactLabel,
	isAdmin = false,
}: UserSidebarProps) {
	const [menuOpen, setMenuOpen] = useState(false);

	const activeTabLabel =
		ACCOUNT_TABS.find((tab) => tab.id === activeTab)?.label ?? "Account";

	const selectTab = (tab: AccountTab) => {
		setActiveTab(tab);
		setMenuOpen(false);
	};

	useEffect(() => {
		if (!menuOpen) return;

		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") setMenuOpen(false);
		};
		window.addEventListener("keydown", onKeyDown);

		return () => {
			document.body.style.overflow = previousOverflow;
			window.removeEventListener("keydown", onKeyDown);
		};
	}, [menuOpen]);

	return (
		<>
			<header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-neutral-800 bg-neutral-950 px-4 py-3 md:px-6">
				<div className="flex min-w-0 flex-1 items-center gap-3">
					<button
						type="button"
						onClick={() => setMenuOpen(true)}
						className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md border border-neutral-800 text-white transition-colors hover:bg-neutral-800"
						aria-label="Open account menu"
						aria-expanded={menuOpen}
					>
						<FiMenu className="h-5 w-5" aria-hidden />
					</button>

					<div className="min-w-0">
						<p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 md:text-xs">
							My Account
						</p>
						<p className="truncate text-sm font-bold text-white md:text-base">
							{activeTabLabel}
						</p>
					</div>
				</div>

				<Link
					href="/"
					className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-md border border-neutral-800 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400 transition-colors hover:border-neutral-600 hover:bg-neutral-900 hover:text-white md:text-xs"
				>
					<FiHome className="h-3.5 w-3.5 md:h-4 md:w-4" aria-hidden />
					<span className="hidden sm:inline">Back to Home</span>
					<span className="sm:hidden">Exit</span>
				</Link>
			</header>

			<AnimatePresence>
				{menuOpen && (
					<>
						<motion.button
							type="button"
							className="fixed inset-0 z-50 bg-black/70 backdrop-blur-[1px]"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							onClick={() => setMenuOpen(false)}
							aria-label="Close account menu"
						/>
						<motion.aside
							className="fixed inset-y-0 left-0 z-50 flex w-[min(100%,18rem)] flex-col border-r border-neutral-800 bg-neutral-950 shadow-2xl md:w-72"
							initial={{ x: "-100%" }}
							animate={{ x: 0 }}
							exit={{ x: "-100%" }}
							transition={{ type: "spring", damping: 28, stiffness: 320 }}
							role="dialog"
							aria-modal="true"
							aria-label="Account navigation"
						>
							<div className="flex items-center justify-between border-b border-neutral-800 px-4 py-4 md:px-5">
								<div className="min-w-0 pr-3">
									<h1 className="text-lg font-black uppercase italic tracking-tighter text-white md:text-xl">
										My <span className="text-red-600">Account</span>
									</h1>
									<p className="mt-1 truncate text-sm font-semibold text-white">
										{userDisplayName}
									</p>
									{userContactLabel ? (
										<p className="truncate text-xs text-neutral-500">
											{userContactLabel}
										</p>
									) : null}
								</div>
								<button
									type="button"
									onClick={() => setMenuOpen(false)}
									className="inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-md border border-neutral-800 text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white"
									aria-label="Close account menu"
								>
									<FiX className="h-5 w-5" aria-hidden />
								</button>
							</div>

							<nav className="flex-1 space-y-1 overflow-y-auto p-3 md:p-4">
								{ACCOUNT_TABS.map((tab) => (
									<button
										key={tab.id}
										type="button"
										onClick={() => selectTab(tab.id)}
										className={tabButtonClass(activeTab === tab.id)}
									>
										{tab.label}
									</button>
								))}
							</nav>

							<UserSidebarFooter
								onNavigate={() => setMenuOpen(false)}
								isAdmin={isAdmin}
							/>
						</motion.aside>
					</>
				)}
			</AnimatePresence>
		</>
	);
}
