"use client";

import {
	AnimatePresence,
	motion,
	useMotionValueEvent,
	useScroll,
} from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navbar() {
	const [isOpen, setIsOpen] = useState(false);
	const [isScrolled, setIsScrolled] = useState(false);
	const { scrollY } = useScroll();

	const pathname = usePathname();
	const isHomePage = pathname === "/";

	useMotionValueEvent(scrollY, "change", (latest) => {
		setIsScrolled(latest > 50);
	});

	useEffect(() => {
		setIsOpen(false);
	}, []);

	const navState = isHomePage ? "hero" : "solid";

	const navLinks = [
		{ name: "Services", href: "/services" },
		{ name: "Inventory", href: "/sales" },
		{ name: "Reviews", href: "/reviews" },
	];

	if (pathname.startsWith("/admin")) {
		return null;
	}

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
							className="text-4xl font-black uppercase italic tracking-tighter text-white drop-shadow-lg transition-transform duration-300 ease-in-out hover:scale-105 active:scale-95"
						>
							A<span className="text-red-600">C</span>S
						</Link>
					</div>
					{/* DESKTOP MENU */}
					<div className="hidden items-center space-x-8 md:flex">
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

						<Link
							href="/contact"
							className="rounded bg-red-600 px-6 py-2 font-bold uppercase tracking-wider text-white drop-shadow-lg transition-all hover:bg-red-500"
						>
							Contact Us
						</Link>
					</div>
					{/* MOBILE MENU BUTTON */}
					<div className="flex items-center md:hidden">
						<button
							type="button"
							onClick={() => setIsOpen((prev) => !prev)}
							aria-label={isOpen ? "Close menu" : "Open menu"}
							className="text-white/90 drop-shadow-md hover:text-white focus:outline-none"
						>
							<svg
								aria-hidden="true"
								className="h-8 w-8"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								{isOpen ? (
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M6 18L18 6M6 6l12 12"
									/>
								) : (
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M4 6h16M4 12h16M4 18h16"
									/>
								)}
							</svg>
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
									className="block rounded-md px-3 py-4 text-base font-bold uppercase tracking-wider text-neutral-300 transition-colors hover:bg-white/10 hover:text-white"
								>
									{link.name}
								</Link>
							))}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.nav>
	);
}
