"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FiCheck, FiShare2, FiX } from "react-icons/fi";
import type { BikeListing } from "@/types";
import { formatPrice } from "@/utils/helper";

interface BikeDetailModalProps {
	bike: BikeListing;
	onClose: () => void;
}

export default function BikeDetailModal({
	bike,
	onClose,
}: BikeDetailModalProps) {
	const [activeImage, setActiveImage] = useState<string>(
		bike.images?.[0]?.image_url || "/placeholder-bike.jpg",
	);
	const [isCopied, setIsCopied] = useState(false);

	useEffect(() => {
		// Lock background scroll
		document.body.style.overflow = "hidden";

		// Setup Keyboard Escape listener
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", handleKeyDown);

		return () => {
			document.body.style.overflow = "unset";
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [onClose]);

	const handleShare = async () => {
		try {
			// SSR Safe check for window
			const baseUrl =
				typeof window !== "undefined" ? window.location.origin : "";
			const shareUrl = `${baseUrl}/sales/${bike.id}`;
			await navigator.clipboard.writeText(shareUrl);

			setIsCopied(true);
			setTimeout(() => setIsCopied(false), 2000);
		} catch (err) {
			console.error("Failed to copy link: ", err);
		}
	};

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-12">
			<button
				type="button"
				className="absolute inset-0 bg-black/80 backdrop-blur-sm w-full cursor-default"
				onClick={onClose}
				aria-label="Close modal background"
			/>

			<div className="relative w-full max-w-6xl max-h-full bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
				<div className="flex justify-between items-center p-4 border-b border-neutral-900 bg-neutral-950/80 backdrop-blur z-10 sticky top-0">
					<span className="text-neutral-500 text-xs font-bold uppercase tracking-widest">
						Quick View
					</span>

					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={handleShare}
							className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-full transition-all ${
								isCopied
									? "bg-emerald-600 text-white"
									: "bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800"
							}`}
						>
							{isCopied ? (
								<>
									<FiCheck className="w-4 h-4" /> Copied!
								</>
							) : (
								<>
									<FiShare2 className="w-4 h-4" /> Share
								</>
							)}
						</button>

						<button
							type="button"
							onClick={onClose}
							className="p-2 bg-neutral-900 hover:bg-red-600 text-white rounded-full transition-colors group ml-2"
							aria-label="Close modal"
						>
							<FiX className="w-5 h-5 group-hover:scale-110 transition-transform" />
						</button>
					</div>
				</div>

				<div className="overflow-y-auto p-6 md:p-10 flex-1">
					<div className="grid md:grid-cols-2 gap-12">
						<div className="space-y-4">
							<div className="relative aspect-[4/3] bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
								<Image
									src={activeImage}
									alt={`${bike.year} ${bike.make} ${bike.model}`}
									fill
									sizes="(max-width: 768px) 100vw, 50vw"
									className="object-cover"
									preload={true}
								/>
							</div>

							{bike.images && bike.images.length > 1 && (
								<div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
									{bike.images.map((img) => (
										<button
											type="button"
											key={img.id}
											onClick={() => setActiveImage(img.image_url)}
											className={`relative aspect-square rounded border overflow-hidden transition-all ${
												activeImage === img.image_url
													? "border-red-600 opacity-100"
													: "border-neutral-800 opacity-50 hover:opacity-100"
											}`}
										>
											<Image
												src={img.image_url}
												alt="Thumbnail"
												fill
												sizes="20vw"
												className="object-cover"
											/>
										</button>
									))}
								</div>
							)}
						</div>

						<div className="flex flex-col">
							<div className="mb-2">
								<h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-white">
									{bike.year} {bike.make}{" "}
									<span className="text-red-600">{bike.model}</span>
								</h1>
							</div>

							<div className="text-3xl font-mono text-white mb-8 border-b border-neutral-800 pb-8">
								{formatPrice(bike.price)}
							</div>

							<div className="grid grid-cols-2 gap-6 mb-8">
								<div>
									<span className="block text-xs text-neutral-500 uppercase tracking-widest mb-1">
										Mileage
									</span>
									<span className="text-lg font-mono text-white">
										{bike.mileage.toLocaleString()} mi
									</span>
								</div>
								<div>
									<span className="block text-xs text-neutral-500 uppercase tracking-widest mb-1">
										Status
									</span>
									<span
										className={`text-lg font-bold uppercase tracking-widest ${
											bike.status === "available"
												? "text-emerald-500"
												: "text-red-500"
										}`}
									>
										{bike.status}
									</span>
								</div>
							</div>

							<div className="mb-10 flex-1">
								<span className="block text-xs text-neutral-500 uppercase tracking-widest mb-3">
									Shop Notes
								</span>
								<p className="text-neutral-300 leading-relaxed whitespace-pre-wrap">
									{bike.description ||
										"No description provided for this motorcycle."}
								</p>
							</div>

							{bike.status === "available" && (
								<Link
									href={`/contact?service=Inquiry:+${bike.year}+${bike.make}+${bike.model}`}
									className="w-full text-center bg-red-600 hover:bg-red-500 text-white px-8 py-4 font-bold text-lg uppercase tracking-widest transition-all mt-auto rounded"
									onClick={onClose}
								>
									Contact Shop About This Bike
								</Link>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
