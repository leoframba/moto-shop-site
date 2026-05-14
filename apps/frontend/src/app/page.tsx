import Link from "next/link";

export default function Home() {
	return (
		<main className="min-h-screen bg-black font-sans">
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
		</main>
	);
}
