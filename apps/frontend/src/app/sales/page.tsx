"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import BikeCard from "@/components/BikeCard";
import BikeDetailModal from "@/components/BikeDetailModal";
import Footer from "@/components/Footer"; // Assuming you have your footer component here
import Navbar from "@/components/Navbar";
import type { BikeListing } from "@/types";
import { sortBikeImages } from "@/utils/helper";
import { createClient } from "@/utils/supabase/client";

export default function PublicSalesPage() {
	const [bikes, setBikes] = useState<BikeListing[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [viewingBike, setViewingBike] = useState<BikeListing | null>(null);

	const supabase = useMemo(() => createClient(), []);

	const fetchActiveBikes = useCallback(async () => {
		setIsLoading(true);

		try {
			// Only fetch bikes that are NOT drafts
			const { data, error } = await supabase
				.from("bike_listings")
				.select(`*, images:bike_images(*)`)
				.neq("status", "draft")
				.order("created_at", { ascending: false });

			if (error) throw error;

			const formattedBikes = (data ?? []).map((bike) => ({
				...bike,
				images: sortBikeImages(bike.images),
			})) as BikeListing[];

			setBikes(formattedBikes);
		} catch (error) {
			console.error("Error fetching showroom bikes:", error);
		} finally {
			setIsLoading(false);
		}
	}, [supabase]);

	useEffect(() => {
		void fetchActiveBikes();
	}, [fetchActiveBikes]);

	return (
		<main className="min-h-screen bg-black font-sans text-white flex flex-col">
			<Navbar />

			{/* MODAL MOUNT */}
			{viewingBike && (
				<BikeDetailModal
					bike={viewingBike}
					onClose={() => setViewingBike(null)}
				/>
			)}

			{/* HEADER */}
			<header className="pt-40 pb-16 px-4 md:px-8 border-b border-neutral-900 bg-neutral-950">
				<div className="max-w-4xl mx-auto text-center">
					<h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic mb-4">
						Current <span className="text-red-600">Inventory</span>
					</h1>
					<p className="text-neutral-400 max-w-2xl text-lg md:text-xl mx-auto leading-relaxed">
						Every motorcycle listed is offered on consignment from our
						customers. We only sell motorcycles we have personally serviced and
						maintained, guaranteeing complete transparency and a known
						mechanical history for your next ride.
					</p>
				</div>
			</header>

			{/* INVENTORY GRID */}
			<section className="flex-1 py-16 px-4 md:px-8 max-w-7xl mx-auto w-full">
				{isLoading ? (
					<div className="flex justify-center items-center py-32">
						<div className="text-neutral-500 animate-pulse uppercase tracking-widest font-bold flex items-center gap-4">
							<div className="w-4 h-4 bg-red-600 rounded-full animate-ping"></div>
							Loading Showroom...
						</div>
					</div>
				) : bikes.length === 0 ? (
					<div className="text-center py-32 border border-dashed border-neutral-800 rounded-xl bg-neutral-900/20">
						<p className="text-neutral-400 font-mono text-lg uppercase tracking-widest">
							Showroom is currently empty.
						</p>
						<p className="text-neutral-600 mt-2">
							Check back later or let us know what you're looking for.
						</p>
					</div>
				) : (
					<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
						{bikes.map((bike) => {
							return (
								<BikeCard
									key={bike.id}
									bike={bike}
									onView={() => setViewingBike(bike)}
								/>
							);
						})}
					</div>
				)}
			</section>

			<Footer />
		</main>
	);
}
