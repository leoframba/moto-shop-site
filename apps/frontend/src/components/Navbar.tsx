"use client";

import type { User } from "@supabase/supabase-js";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FiLogOut, FiMenu, FiUser, FiX } from "react-icons/fi";
import { getUserDisplayName, isAdminUser } from "@/utils/auth";
import { createClient } from "@/utils/supabase/client";

export default function Navbar() {
	const [isOpen, setIsOpen] = useState(false);
	const [user, setUser] = useState<User | null>(null);
	const router = useRouter();

	const pathname = usePathname();
	const isHomePage = pathname === "/";
	const supabase = useMemo(() => createClient(), []);

	useEffect(() => {
		if (pathname) setIsOpen(false);
	}, [pathname]);

	useEffect(() => {
		const loadUser = async () => {
			const {
				data: { user: currentUser },
			} = await supabase.auth.getUser();
			setUser(currentUser);
		};

		void loadUser();

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setUser(session?.user ?? null);
		});

		return () => subscription.unsubscribe();
	}, [supabase]);

	const handleSignOut = async () => {
		await supabase.auth.signOut();
		setUser(null);
		setIsOpen(false);
		router.push("/");
		router.refresh();
	};

	const navState = isHomePage ? "hero" : "solid";

	const navLinks = [
		{ name: "Services", href: "/services" },
		{ name: "Inventory", href: "/sales" },
		{ name: "Reviews", href: "/reviews" },
		{ name: "Contact", href: "/contact" },
	];

	if (pathname.startsWith("/admin") || pathname.startsWith("/account")) {
		return null;
	}

	const displayName = user ? getUserDisplayName(user) : null;

	return (
		<motion.nav
			layout
			initial={false}
			animate={navState}
			variants={{
				hero: {
					top: 16,
					width: "calc(100% - 2rem)",
					maxWidth: "80rem",
					borderRadius: 22,
				},
				solid: {
					top: 16,
					width: "calc(100% - 2rem)",
					maxWidth: "80rem",
					borderRadius: 18,
				},
			}}
			transition={{
				duration: 0.35,
				ease: [0.22, 1, 0.36, 1],
			}}
			className="fixed left-1/2 z-50 -translate-x-1/2 overflow-hidden"
		>
			<motion.div
				aria-hidden="true"
				initial={false}
				animate={navState}
				variants={{
					hero: {
						backgroundColor: "rgba(0, 0, 0, 0.14)",
						borderColor: "rgba(255, 255, 255, 0)",
						boxShadow: "0 12px 35px rgba(0, 0, 0, 0.18)",
					},
					solid: {
						backgroundColor: "rgba(0, 0, 0, 0.92)",
						borderColor: "rgba(255, 255, 255, 0.08)",
						boxShadow: "0 18px 50px rgba(0, 0, 0, 0.35)",
					},
				}}
				transition={{
					duration: 0.25,
					ease: [0.22, 1, 0.36, 1],
				}}
				className="pointer-events-none absolute inset-0 -z-10 border backdrop-blur-sm"
				style={{
					borderRadius: "inherit",
				}}
			/>

			<div className="px-4 sm:px-6 lg:px-8">
				<div className="flex h-20 items-center justify-between">
					<div className="flex flex-shrink-0 items-center">
						<Link
							href="/"
							onClick={() => setIsOpen(false)}
							className="text-4xl font-black uppercase italic tracking-tighter text-white drop-shadow-lg transition-transform duration-300 ease-in-out hover:scale-105 active:scale-95"
						>
							A<span className="text-red-600">C</span>S
						</Link>
					</div>
					{/* DESKTOP MENU */}
					<div className="hidden items-center gap-6 md:flex lg:gap-8">
						{navLinks.map((link) => (
							<Link
								key={link.name}
								href={link.href}
								className="group relative text-sm font-bold uppercase tracking-widest text-white/80 drop-shadow-md transition-colors hover:text-white"
							>
								{link.name}
								<span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-red-600 transition-all duration-300 group-hover:w-full" />
							</Link>
						))}

						{user ? (
							<div className="flex items-center gap-6">
								{isAdminUser(user) && (
									<Link
										href="/admin"
										className="group relative text-sm font-bold uppercase tracking-widest text-white/80 drop-shadow-md transition-colors hover:text-white"
									>
										Admin
										<span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-red-600 transition-all duration-300 group-hover:w-full" />
									</Link>
								)}
								<Link
									href="/account"
									className="flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-4 py-2 text-sm font-bold uppercase tracking-wider text-white transition-all hover:border-red-600 hover:bg-red-600/10"
								>
									<FiUser className="h-4 w-4 text-red-500" />
									<span className="max-w-[8rem] truncate">{displayName}</span>
								</Link>
								<button
									type="button"
									onClick={handleSignOut}
									aria-label="Sign out"
									className="flex h-10 w-10 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
								>
									<FiLogOut className="h-4 w-4" />
								</button>
							</div>
						) : (
							<div className="flex items-center gap-3">
								<Link
									href="/login"
									className="rounded bg-red-600 px-6 py-2 font-bold uppercase tracking-wider text-white drop-shadow-lg transition-all hover:bg-red-500"
								>
									Rider Portal
								</Link>
							</div>
						)}
					</div>
					{/* MOBILE MENU BUTTON */}
					<div className="flex items-center md:hidden">
						<button
							type="button"
							onClick={() => setIsOpen((prev) => !prev)}
							aria-label={isOpen ? "Close menu" : "Open menu"}
							className="flex h-11 w-11 items-center justify-center text-white/90 drop-shadow-md hover:text-white focus:outline-none"
						>
							{isOpen ? (
								<FiX className="h-7 w-7" />
							) : (
								<FiMenu className="h-7 w-7" />
							)}
						</button>
					</div>
				</div>
			</div>

			{/* MOBILE MENU */}
			<AnimatePresence initial={false}>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0, height: 0 }}
						transition={{ duration: 0.25, ease: "easeInOut" }}
						className="md:hidden overflow-hidden border-t border-white/10"
					>
						<div className="space-y-1 px-3 pb-4 pt-2">
							{navLinks.map((link) => (
								<Link
									key={link.name}
									href={link.href}
									onClick={() => setIsOpen(false)}
									className="block rounded-md px-3 py-4 text-base font-bold uppercase tracking-wider text-neutral-300 transition-colors hover:bg-white/10 hover:text-white"
								>
									{link.name}
								</Link>
							))}

							<div className="mt-2 border-t border-white/10 pt-2">
								{user ? (
									<>
										<Link
											href="/account"
											onClick={() => setIsOpen(false)}
											className="flex items-center gap-3 rounded-md px-3 py-4 text-base font-bold uppercase tracking-wider text-white transition-colors hover:bg-white/10"
										>
											<FiUser className="h-5 w-5 text-red-500" />
											{displayName}
										</Link>
										{isAdminUser(user) && (
											<Link
												href="/admin"
												onClick={() => setIsOpen(false)}
												className="block rounded-md px-3 py-4 text-base font-bold uppercase tracking-wider text-neutral-300 transition-colors hover:bg-white/10 hover:text-white"
											>
												Admin Dashboard
											</Link>
										)}
										<button
											type="button"
											onClick={handleSignOut}
											className="flex w-full items-center gap-3 rounded-md px-3 py-4 text-base font-bold uppercase tracking-wider text-red-400 transition-colors hover:bg-white/10"
										>
											<FiLogOut className="h-5 w-5" />
											Sign Out
										</button>
									</>
								) : (
									<Link
										href="/login"
										onClick={() => setIsOpen(false)}
										className="block rounded-md bg-red-600 px-3 py-4 text-center text-base font-bold uppercase tracking-wider text-white transition-colors hover:bg-red-500"
									>
										Rider Portal
									</Link>
								)}
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.nav>
	);
}
