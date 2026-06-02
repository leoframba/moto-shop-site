"use client";

import { easeOut, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";

const HERO_IMAGES = [
	"/hero1.jpg",
	"/hero2.jpg",
	"/hero3.jpg",
	"/hero4.jpg",
	"/hero5.jpg",
	"/hero6.jpg",
];

export default function Home() {
	const [currentIndex, setCurrentIndex] = useState(0);

	useEffect(() => {
		const timer = setInterval(() => {
			setCurrentIndex((prev) => (prev + 1) % HERO_IMAGES.length);
		}, 6000);

		return () => clearInterval(timer);
	}, []);

	const nextImage = () => {
		setCurrentIndex((prev) => (prev + 1) % HERO_IMAGES.length);
	};

	const prevImage = () => {
		setCurrentIndex(
			(prev) => (prev - 1 + HERO_IMAGES.length) % HERO_IMAGES.length,
		);
	};

	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				staggerChildren: 0.14,
				delayChildren: 0.2,
			},
		},
	};

	const itemVariants = {
		hidden: { opacity: 0, y: 18 },
		visible: {
			opacity: 1,
			y: 0,
			transition: {
				duration: 0.65,
				ease: easeOut,
			},
		},
	};

	return (
		<main className="min-h-screen bg-black font-sans text-white">
			<section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 pt-28">
				{/* SLIDESHOW */}
				{HERO_IMAGES.map((src, index) => (
					<motion.div
						key={src}
						initial={{ opacity: 0, scale: 1 }}
						animate={{
							opacity: index === currentIndex ? 1 : 0,
							scale: index === currentIndex ? 1.04 : 1,
						}}
						transition={{
							opacity: { duration: 1.2, ease: "easeInOut" },
							scale: {
								duration: 18,
								ease: "linear",
							},
						}}
						className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
						style={{ backgroundImage: `url('${src}')` }}
					/>
				))}
				{/* READABILITY OVERLAYS */}
				<div className="absolute inset-0 z-10 bg-black/35" />
				<div className="absolute inset-0 z-10 bg-gradient-to-t from-black via-black/55 to-transparent" />
				<div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.3)_100%)]" />
				{/* SLIDE CONTROLS
				<div className="pointer-events-none absolute inset-x-0 top-1/2 z-30 hidden -translate-y-1/2 justify-between px-4 sm:flex md:px-8">
					<button
						type="button"
						onClick={prevImage}
						aria-label="Previous hero image"
						className="pointer-events-auto rounded-full border border-white/10 bg-black/25 p-3 text-white/60 backdrop-blur-sm transition-all hover:border-white/30 hover:bg-black/60 hover:text-white"
					>
						<svg
							aria-hidden="true"
							className="h-6 w-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							role="img"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M15 19l-7-7 7-7"
							/>
						</svg>
					</button>

					<button
						type="button"
						onClick={nextImage}
						aria-label="Next hero image"
						className="pointer-events-auto rounded-full border border-white/10 bg-black/25 p-3 text-white/60 backdrop-blur-sm transition-all hover:border-white/30 hover:bg-black/60 hover:text-white"
					>
						<svg
							aria-hidden="true"
							className="h-6 w-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M9 5l7 7-7 7"
							/>
						</svg>
					</button>
				</div> */}
				{/* HERO */}
				<motion.div
					variants={containerVariants}
					initial="hidden"
					animate="visible"
					className="relative z-20 mx-auto flex max-w-6xl flex-col items-center text-center"
				>
					<motion.p
						variants={itemVariants}
						className="mb-4 text-xs font-bold uppercase tracking-[0.35em] text-red-500 sm:text-sm"
					>
						The Bay Area's Premier Motorcycle Shop
					</motion.p>

					<motion.h1
						variants={itemVariants}
						className="mx-auto mb-5 max-w-[11ch] text-center text-[clamp(3rem,14vw,8rem)] font-black uppercase italic leading-[0.82] tracking-[-0.08em] text-white drop-shadow-2xl md:max-w-none md:text-[clamp(5rem,9vw,8rem)]"
					>
						<span className="block md:inline">Advanced</span>{" "}
						<span className="block bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent md:inline pr-7 -mr-7">
							Cycle
						</span>{" "}
						<span className="block md:inline">Service</span>
					</motion.h1>

					<motion.p
						variants={itemVariants}
						className="mx-auto mb-9 max-w-2xl text-base font-medium leading-relaxed text-neutral-200 drop-shadow-md sm:text-lg md:text-2xl"
					>
						Trusted <span className="font-bold text-red-500">Ducati</span>{" "}
						service for over 30 years.
					</motion.p>

					<motion.div
						variants={itemVariants}
						className="flex w-full max-w-md flex-col items-center justify-center gap-3 sm:max-w-none sm:flex-row sm:gap-4"
					>
						<Link
							href="/services"
							className="w-full bg-red-600 px-8 py-4 text-center text-base font-bold uppercase tracking-wider text-white shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all hover:bg-red-500 sm:w-auto sm:text-lg"
						>
							View Services
						</Link>

						<Link
							href="/contact"
							className="w-full border-2 border-white/25 bg-black/20 px-8 py-4 text-center text-base font-bold uppercase tracking-wider text-white backdrop-blur-sm transition-all hover:border-red-600 hover:bg-neutral-950/80 sm:w-auto sm:text-lg"
						>
							Contact Us
						</Link>
					</motion.div>
				</motion.div>
				{/* DOTS
				<div className="absolute bottom-8 left-0 right-0 z-20 flex justify-center">
					<div className="flex gap-3 rounded-full border border-white/10 bg-black/25 px-4 py-3 backdrop-blur-sm">
						{HERO_IMAGES.map((src, index) => (
							<button
								key={src}
								type="button"
								onClick={() => setCurrentIndex(index)}
								aria-label={`Show hero image ${index + 1}`}
								className={`h-2.5 rounded-full transition-all duration-300 ${
									index === currentIndex
										? "w-8 bg-red-600"
										: "w-2.5 bg-white/35 hover:bg-white/70"
								}`}
							/>
						))}
					</div>
				</div> */}
			</section>
		</main>
	);
}
