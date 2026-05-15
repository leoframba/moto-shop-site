"use client";
import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
	const [isOpen, setIsOpen] = useState(false);

	const navLinks = [
		{ name: "Services", href: "/services" },
		{ name: "Reviews", href: "/reviews" },
		{ name: "About", href: "/about" },
		{ name: "Contact", href: "/contact" },
	];

	return (
		<nav className="fixed w-full z-50 bg-black/80 backdrop-blur-md border-b border-neutral-900">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between items-center h-20">
					{/* LOGO AREA */}
					<div className="flex-shrink-0 flex items-center">
						<Link
							href="/"
							className="text-4xl font-black text-white tracking-tighter uppercase italic transition-all duration-300 ease-in-out hover:scale-110 active:scale-95"
						>
							A<span className="text-red-600">C</span>S
						</Link>
					</div>

					{/* DESKTOP MENU */}
					<div className="hidden md:flex space-x-8 items-center">
						{navLinks.map((link) => (
							<Link
								key={link.name}
								href={link.href}
								className="text-neutral-400 hover:text-white font-bold transition-colors text-sm uppercase tracking-widest"
							>
								{link.name}
							</Link>
						))}
						<Link
							href="/contact"
							className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded font-bold uppercase tracking-wider transition-all"
						>
							Contact Us
						</Link>
					</div>

					{/* MOBILE MENU BUTTON */}
					<div className="md:hidden flex items-center">
						<button
							type="button"
							onClick={() => setIsOpen(!isOpen)}
							className="text-neutral-300 hover:text-white focus:outline-none"
						>
							<svg
								aria-label={isOpen ? "Close menu" : "Open menu"}
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

			{/* MOBILE MENU DROPDOWN */}
			{isOpen && (
				<div className="md:hidden bg-neutral-950 border-b border-neutral-900">
					<div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
						{navLinks.map((link) => (
							<Link
								key={link.name}
								href={link.href}
								className="block px-3 py-4 text-base font-bold uppercase tracking-wider text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-md"
								onClick={() => setIsOpen(false)}
							>
								{link.name}
							</Link>
						))}
					</div>
				</div>
			)}
		</nav>
	);
}
