import PublicServicesList from "@/components/services/PublicServicesList";

export default function ServicesPage() {
	return (
		<main className="min-h-screen bg-black font-sans">
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

			<div className="max-w-5xl mx-auto px-4 py-8">
				<PublicServicesList />
			</div>
		</main>
	);
}
