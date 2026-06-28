"use client";

import Link from "next/link";
import CategoryFolder from "@/components/CategoryFolder";
import ServiceListSkeleton from "@/components/services/ServiceListSkeleton";
import { groupServicesByCategory, useServices } from "@/hooks/useServices";

export default function PublicServicesList() {
	const { data, isLoading, hasError } = useServices();

	if (isLoading) {
		return <ServiceListSkeleton />;
	}

	if (hasError) {
		return (
			<div className="bg-red-950/30 border border-red-900/50 p-8 text-center mb-12 rounded">
				<h3 className="text-red-500 font-bold uppercase tracking-widest mb-2">
					System Offline
				</h3>
				<p className="text-neutral-400">
					We are currently updating our service menu. Please call the shop for
					pricing.
				</p>
			</div>
		);
	}

	const services = data?.services ?? [];
	const hourlyRate = data?.hourly_rate ?? 0;
	const groupedServices = groupServicesByCategory(services);

	return (
		<>
			<div className="mb-8 flex flex-wrap justify-center md:justify-between items-center bg-neutral-900/30 border border-neutral-800/60 px-6 py-4 rounded text-sm gap-4">
				<div className="flex items-center gap-3">
					<span className="text-neutral-300 font-bold uppercase tracking-widest">
						Base Shop Rate
					</span>
					<span className="text-neutral-600 hidden md:inline">|</span>
					<span className="text-neutral-500 uppercase tracking-wider text-xs hidden md:inline">
						Used to calculate est. labor
					</span>
				</div>
				<div className="font-mono text-red-500 font-bold text-xl md:text-2xl">
					${hourlyRate}
					<span className="text-sm text-neutral-500 font-sans">/hr</span>
				</div>
			</div>

			<div className="mt-8">
				{services.length === 0 ? (
					<p className="text-center text-neutral-500 py-12 italic">
						No services are currently listed. Check back soon.
					</p>
				) : (
					Object.entries(groupedServices).map(
						([category, categoryServices]) => (
							<CategoryFolder
								key={category}
								category={category}
								services={categoryServices}
								hourlyRate={hourlyRate}
							/>
						),
					)
				)}
			</div>

			<div className="mt-16 text-center border-t border-neutral-900 pt-12">
				<h2 className="text-xl md:text-2xl font-bold text-white mb-6 uppercase tracking-wider italic">
					Don't see what you're looking for? Reach out and we'll get you sorted.
				</h2>
				<Link
					href="/contact"
					className="inline-block bg-red-600 hover:bg-red-500 text-white px-10 py-4 font-bold text-lg uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(220,38,38,0.2)]"
				>
					Contact the Shop
				</Link>
				<p className="text-neutral-500 text-sm mt-6 uppercase tracking-widest">
					First come, first served. Walk-ins always welcome.
				</p>
			</div>
		</>
	);
}
