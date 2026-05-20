import Link from "next/link";
import CategoryFolder from "@/components/CategoryFolder"; // <--- Import the new component
import Navbar from "@/components/Navbar";
import type { Service, ServiceResponse } from "@/types";
import { apiRequest } from "@/utils/api";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
	let hourlyRate = 0;
	let services: Service[] = [];
	let fetchError = false;

	try {
		const data = await apiRequest<ServiceResponse>("/api/services", {
			cache: "no-store",
		});
		hourlyRate = data.hourly_rate;
		services = data.services;
	} catch (error) {
		console.error("Failed to fetch services:", error);
		fetchError = true;
	}

	const groupedServices = services.reduce(
		(acc, service) => {
			const cat = service.categories?.name || "Uncategorized";
			if (!acc[cat]) acc[cat] = [];
			acc[cat].push(service);
			return acc;
		},
		{} as Record<string, Service[]>,
	);

	return (
		<main className="min-h-screen bg-black font-sans">
			<Navbar />

			{/* HEADER AREA */}
			<div className="pt-32 pb-8 px-4 border-b border-neutral-900 bg-neutral-950/30">
				<div className="max-w-4xl mx-auto text-center">
					<h1 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tighter uppercase italic">
						Service <span className="text-red-600">Menu</span>
					</h1>

					<div className="grid md:grid-cols-2 gap-6 text-left bg-neutral-900/40 border border-neutral-800 p-6 rounded-sm">
						<div>
							<h3 className="text-white font-bold uppercase tracking-widest text-sm mb-2">
								Pricing & Quotes
							</h3>
							<p className="text-neutral-400 text-sm leading-relaxed">
								<strong className="text-neutral-300 font-medium">
									Base prices shown; parts extra unless specified.
								</strong>{" "}
								Every bike is unique, so please visit or call for a firm quote.
							</p>
						</div>
						<div className="border-t border-neutral-800 pt-6 md:pt-0 md:border-t-0 md:border-l md:pl-6">
							<h3 className="text-white font-bold uppercase tracking-widest text-sm mb-2">
								Turnaround Times
							</h3>
							<p className="text-neutral-400 text-sm leading-relaxed">
								<strong className="text-neutral-300 font-medium">
									No appointments. First come, first served.
								</strong>{" "}
								We take the time needed to do every job right. Smaller services
								can typically be done same day or while you wait.
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* MAIN CONTENT */}
			<div className="max-w-5xl mx-auto px-4 py-8">
				{!fetchError && (
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
				)}

				{fetchError && (
					<div className="bg-red-950/30 border border-red-900/50 p-8 text-center mb-12 rounded">
						<h3 className="text-red-500 font-bold uppercase tracking-widest mb-2">
							System Offline
						</h3>
						<p className="text-neutral-400">
							We are currently updating our service menu. Please call the shop
							for pricing.
						</p>
					</div>
				)}

				{/* FOLDERS LIST */}
				<div className="mt-8">
					{services.length === 0 && !fetchError ? (
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
						Don't see what you're looking for? Reach out and we'll get you
						sorted.
					</h2>
					<Link
						href="/contact"
						className="inline-block bg-red-600 hover:bg-red-500 text-white px-10 py-4 font-bold text-lg uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(220,38,38,0.2)]"
					>
						Send an Inquiry
					</Link>
					<p className="text-neutral-500 text-sm mt-6 uppercase tracking-widest">
						First come, first served. Walk-ins always welcome.
					</p>
				</div>
			</div>
		</main>
	);
}
