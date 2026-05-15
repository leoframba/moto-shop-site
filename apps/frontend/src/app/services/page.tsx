import Link from "next/link";
import Navbar from "@/components/Navbar";
import type { Service, ServiceResponse } from "@/types";
import { apiRequest } from "@/utils/api";

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

	return (
		<main className="min-h-screen bg-black font-sans">
			<Navbar />

			{/* PAGE HEADER */}
			<div className="pt-32 pb-16 px-4 border-b border-neutral-900 bg-neutral-950/30">
				<div className="max-w-4xl mx-auto text-center">
					<h1 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tighter uppercase italic">
						Service <span className="text-red-600">Menu</span>
					</h1>

					{/* SHOP POLICIES CARD */}
					<div className="grid md:grid-cols-2 gap-6 text-left bg-neutral-900/40 border border-neutral-800 p-6 md:p-8 rounded-sm">
						{/* Policy 1: Pricing */}
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

						{/* Policy 2: Scheduling */}
						<div className="border-t border-neutral-800 pt-6 md:pt-0 md:border-t-0 md:border-l md:pl-6">
							<h3 className="text-white font-bold uppercase tracking-widest text-sm mb-2">
								Turnaround Times
							</h3>
							<p className="text-neutral-400 text-sm leading-relaxed">
								<strong className="text-neutral-300 font-medium">
									No appointments. First come, first served.
								</strong>{" "}
								We take the time needed to do every job right. Smaller services
								(Oil, Tires, etc) can typically be done same day or while you
								wait.
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* MAIN CONTENT AREA */}
			<div className="max-w-5xl mx-auto px-4 py-16">
				{/* SHOP RATE BANNER */}
				{!fetchError && (
					<div className="mb-12 flex flex-col md:flex-row justify-between items-center bg-neutral-900/50 border border-neutral-800 p-6 rounded-sm">
						<div>
							<h2 className="text-white font-bold uppercase tracking-widest text-sm mb-1">
								Current Shop Rate
							</h2>
							<p className="text-neutral-500 text-xs uppercase tracking-wider">
								Used to calculate base labor costs
							</p>
						</div>
						<div className="mt-4 md:mt-0 text-3xl font-mono text-red-500 font-bold">
							${hourlyRate}
							<span className="text-lg text-neutral-500 font-sans">/hr</span>
						</div>
					</div>
				)}

				{/* ERROR STATE */}
				{fetchError && (
					<div className="bg-red-950/30 border border-red-900/50 p-8 text-center mb-12">
						<h3 className="text-red-500 font-bold uppercase tracking-widest mb-2">
							System Offline
						</h3>
						<p className="text-neutral-400">
							We are currently updating our service menu. Please call the shop
							for pricing.
						</p>
					</div>
				)}

				{/* SERVICES LIST */}
				<div className="space-y-6">
					{services.length === 0 && !fetchError ? (
						<p className="text-center text-neutral-500 py-12 italic">
							No services are currently listed. Check back soon.
						</p>
					) : (
						services.map((service) => (
							<div
								key={service.id}
								className="group border-b border-neutral-900 pb-8 hover:bg-neutral-900/20 p-4 -mx-4 rounded-sm transition-colors flex flex-col md:flex-row justify-between md:items-center gap-6"
							>
								{/* SERVICE DETAILS */}
								<div className="max-w-2xl">
									<h3 className="text-xl md:text-2xl font-bold text-white mb-2 tracking-wide uppercase">
										{service.name}
									</h3>
									<p className="text-neutral-400 leading-relaxed text-sm md:text-base">
										{service.description}
									</p>
								</div>

								{/* PRICING & TIME */}
								<div className="flex items-center md:items-end gap-8 md:flex-col md:gap-2 shrink-0">
									<div className="text-left md:text-right">
										<span className="block text-xs text-neutral-600 uppercase tracking-widest mb-1">
											Est. Labor
										</span>
										<span className="text-neutral-300 font-mono">
											{service.estimated_hours} hours
										</span>
									</div>

									<div className="text-left md:text-right border-l border-neutral-800 md:border-none pl-6 md:pl-0">
										<span className="block text-xs text-neutral-600 uppercase tracking-widest mb-1">
											Est. Price
										</span>
										<span className="text-2xl md:text-3xl font-mono text-white font-bold group-hover:text-red-500 transition-colors">
											${(service.estimated_hours * hourlyRate).toFixed(2)}
										</span>
									</div>
								</div>
							</div>
						))
					)}
				</div>

				{/* INQUIRY BUTTON */}
				<div className="mt-20 text-center border-t border-neutral-900 pt-16">
					<h2 className="text-2xl font-bold text-white mb-6 uppercase tracking-wider italic">
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
