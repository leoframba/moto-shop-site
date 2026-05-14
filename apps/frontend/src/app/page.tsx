import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function Home() {
	return (
		<main className="min-h-screen bg-black font-sans">
			{/* NAVIGATION */}
			<Navbar />

			<div className="relative h-screen flex items-center justify-center overflow-hidden">
				<div
					className="absolute inset-0 z-0 opacity-50 bg-cover bg-center bg-no-repeat grayscale-[30%]"
					style={{ backgroundImage: "url('/hero-bg.jpg')" }}
				/>

				<div className="absolute inset-0 z-10 bg-gradient-to-t from-black via-black/70 to-transparent" />

				<div className="relative z-20 text-center px-4 max-w-5xl mx-auto mt-20">
					<h1 className="text-5xl md:text-8xl font-black text-white mb-4 tracking-tighter uppercase italic">
						Advance
						<span className="text-transparent bg-clip-text pr-7 -mr-7 bg-gradient-to-r from-red-500 to-red-700">
							Cycle
						</span>
						Service
					</h1>

					<p className="text-lg md:text-2xl text-neutral-300 mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
						The Bay Area's Premier Motorcycle Shop of 20+ Years.
					</p>

					<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
						<Link
							href="/services"
							className="w-full sm:w-auto bg-red-600 hover:bg-red-500 text-white px-8 py-4 font-bold text-lg uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)]"
						>
							View Services
						</Link>
						<Link
							href="/contact"
							className="w-full sm:w-auto bg-transparent hover:bg-neutral-900 text-white px-8 py-4 font-bold text-lg uppercase tracking-wider transition-all border-2 border-neutral-700 hover:border-red-600"
						>
							Contact Us
						</Link>
					</div>
				</div>
			</div>

			{/* FOOTER */}
			<footer className="bg-neutral-950 border-t border-neutral-900 py-16 px-4">
				<div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
					{/* LOCATION */}
					<div>
						<h4 className="text-white font-bold uppercase tracking-widest mb-4 flex items-center justify-center md:justify-start gap-2">
							<span className="text-red-600">{"///"}</span> Location
						</h4>
						<p className="text-neutral-400 leading-relaxed">
							1135 Old Bayshore Highway
							<br />
							San Jose, CA 95112
							<br />
							<a
								href="https://maps.google.com/?q=1135+Old+Bayshore+Highway,+San+Jose,+CA+95112"
								target="_blank"
								rel="noopener noreferrer"
								className="text-red-500 hover:text-red-400 text-sm mt-2 inline-block transition-colors uppercase tracking-wider"
							>
								Get Directions &rarr;
							</a>
						</p>
					</div>

					{/* HOURS */}
					<div>
						<h4 className="text-white font-bold uppercase tracking-widest mb-4 flex items-center justify-center md:justify-start gap-2">
							<span className="text-red-600">{"///"}</span> Hours
						</h4>
						<ul className="text-neutral-400 space-y-2">
							<li className="flex justify-center md:justify-start gap-4">
								<span className="w-24">Tues - Fri:</span>
								<span className="text-white">9:30 AM - 5:00 PM</span>
							</li>
							<li className="flex justify-center md:justify-start gap-4">
								<span className="w-24">Saturday:</span>
								<span className="text-white">9:30 AM - 2:00 PM</span>
							</li>
							<li className="flex justify-center md:justify-start gap-4">
								<span className="w-24">Sunday-Monday:</span>
								<span className="text-red-500 italic">Closed</span>
							</li>
						</ul>
					</div>

					{/* CONTACT */}
					<div>
						<h4 className="text-white font-bold uppercase tracking-widest mb-4 flex items-center justify-center md:justify-start gap-2">
							<span className="text-red-600">{"///"}</span> Contact
						</h4>
						<div className="text-neutral-400 space-y-2">
							<p>
								<span className="block text-xs uppercase tracking-widest text-neutral-600 mb-1">
									Jim Davis
								</span>
								<a
									href="tel:+14155551234"
									className="text-2xl font-mono text-white hover:text-red-500 transition-colors"
								>
									(408)299-0508
								</a>
							</p>
							<p className="pt-2">
								<a
									href="mailto:service@rossomoto.com"
									className="hover:text-white transition-colors"
								>
									jim@advcycles.com
								</a>
							</p>
						</div>
					</div>
				</div>

				{/* COPYRIGHT */}
				<div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-neutral-900 text-center flex flex-col md:flex-row justify-between items-center gap-4">
					<p className="text-neutral-600 text-sm uppercase tracking-widest">
						&copy; {new Date().getFullYear()} ADVCycles. All rights reserved.
					</p>
					<div className="flex gap-6">
						<Link
							href="#"
							className="text-neutral-600 hover:text-white transition-colors text-sm uppercase tracking-widest"
						>
							Instagram
						</Link>
						<Link
							href="#"
							className="text-neutral-600 hover:text-white transition-colors text-sm uppercase tracking-widest"
						>
							Facebook
						</Link>
					</div>
				</div>
			</footer>
		</main>
	);
}
