"use client";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { BikeListing } from "@/types";
import { formatPrice, sortBikeImages } from "@/utils/helper";
import { createClient } from "@/utils/supabase/client";

export default function SalesDetailPage() {
	const params = useParams();
	const id = params.id as string;

	const [bike, setBike] = useState<BikeListing | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [activeImage, setActiveImage] = useState<string>("");

	useEffect(() => {
		const fetchBikeDetails = async () => {
			const supabase = createClient();
			try {
				const { data, error } = await supabase
					.from("bike_listings")
					.select(`*, images:bike_images(*)`)
					.eq("id", id)
					.single();

				if (error) throw error;

				const sortedImages = sortBikeImages(data.images);

				setBike({ ...data, images: sortedImages });
				setActiveImage(sortedImages[0]?.image_url || "/placeholder.jpg");
			} catch (error) {
				console.error("Failed to load bike:", error);
			} finally {
				setIsLoading(false);
			}
		};

		if (id) fetchBikeDetails();
	}, [id]);

	if (isLoading)
		return (
			<div className="min-h-screen bg-black flex items-center justify-center text-white font-mono uppercase">
				Loading details...
			</div>
		);
	if (!bike)
		return (
			<div className="min-h-screen bg-black flex items-center justify-center text-white font-mono uppercase">
				Motorcycle not found.
			</div>
		);

	return (
		<main className="min-h-screen bg-black font-sans text-white">
			<div className="pt-32 pb-20 max-w-6xl mx-auto px-4">
				<Link
					href="/sales"
					className="text-neutral-500 hover:text-white text-sm uppercase tracking-widest font-bold mb-8 inline-block transition-colors"
				>
					&larr; Back to Showroom
				</Link>

				<div className="grid md:grid-cols-2 gap-12">
					{/* LEFT: IMAGE CAROUSEL */}
					<div className="space-y-4">
						<div className="relative aspect-[4/3] bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
							<Image
								src={activeImage}
								alt={`${bike.year} ${bike.make} ${bike.model}`}
								fill
								sizes="(max-width: 768px) 100vw, 50vw"
								className="object-cover"
								preload
							/>
						</div>

						{/* Thumbnails */}
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

					{/* RIGHT: BIKE DETAILS */}
					<div className="flex flex-col">
						<div className="flex justify-between items-start mb-2">
							<h1 className="text-4xl font-black uppercase italic tracking-tighter">
								{bike.year} {bike.make}{" "}
								<span className="text-red-600">{bike.model}</span>
							</h1>
						</div>

						<div className="text-3xl font-mono text-white mb-8 border-b border-neutral-800 pb-8">
							{formatPrice(bike.price)}
						</div>

						{/* Specs Grid */}
						<div className="grid grid-cols-2 gap-6 mb-8">
							<div>
								<span className="block text-xs text-neutral-500 uppercase tracking-widest mb-1">
									Mileage
								</span>
								<span className="text-lg font-mono">
									{bike.mileage.toLocaleString()} mi
								</span>
							</div>
							<div>
								<span className="block text-xs text-neutral-500 uppercase tracking-widest mb-1">
									Status
								</span>
								<span
									className={`text-lg font-bold uppercase tracking-widest ${bike.status === "available" ? "text-emerald-500" : "text-red-500"}`}
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
								className="w-full text-center bg-red-600 hover:bg-red-500 text-white px-8 py-4 font-bold text-lg uppercase tracking-widest transition-all mt-auto"
							>
								Contact Shop About This Bike
							</Link>
						)}
					</div>
				</div>
			</div>
		</main>
	);
}
