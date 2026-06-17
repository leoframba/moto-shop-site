"use client";

import { easeOut, motion } from "framer-motion";
import Image from "next/image";
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

export default function HeroSection() {
	const [currentIndex, setCurrentIndex] = useState(0);

	useEffect(() => {
		const timer = setInterval(() => {
			setCurrentIndex((prev) => (prev + 1) % HERO_IMAGES.length);
		}, 6000);

		return () => clearInterval(timer);
	}, []);

	return (
		<section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 pt-28">
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
					className="absolute inset-0 z-0"
				>
					<Image
						src={src}
						alt=""
						fill
						priority={index === 0}
						loading={index === 0 ? "eager" : "lazy"}
						sizes="100vw"
						className="object-cover object-center"
					/>
				</motion.div>
			))}

			<div className="absolute inset-0 z-10 bg-black/35" />
			<div className="absolute inset-0 z-10 bg-gradient-to-t from-black via-black/55 to-transparent" />
			<div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.3)_100%)]" />

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
					Trusted <span className="font-bold text-red-500">Ducati</span> service
					for over 30 years.
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
		</section>
	);
}
