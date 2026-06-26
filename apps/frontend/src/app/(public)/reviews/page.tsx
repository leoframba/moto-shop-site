import Link from "next/link";
import reviewsData from "@/data/reviews.json";

export default function ReviewsPage() {
	const { shopLinks, testimonials } = reviewsData;

	return (
		<main className="min-h-screen bg-black font-sans">
			{/* PAGE HEADER */}
			<div className="pt-32 pb-16 px-4 border-b border-neutral-900 bg-neutral-950/30">
				<div className="max-w-4xl mx-auto text-center">
					<h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tighter uppercase italic">
						Rider <span className="text-red-600">Reviews</span>
					</h1>
					<p className="text-neutral-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-8">
						Don't just take our word for it. Here is what the local community
						has to say about our work.
					</p>

					{/* VERIFICATION LINKS */}
					<div className="flex flex-col sm:flex-row justify-center items-center gap-4">
						<a
							href={shopLinks.google}
							target="_blank"
							rel="noopener noreferrer"
							className="w-full sm:w-auto px-8 py-3 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-sm uppercase tracking-widest border border-neutral-700 transition-colors"
						>
							Verify on Google
						</a>
						<a
							href={shopLinks.yelp}
							target="_blank"
							rel="noopener noreferrer"
							className="w-full sm:w-auto px-8 py-3 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-sm uppercase tracking-widest border border-neutral-700 transition-colors"
						>
							Verify on Yelp
						</a>
					</div>
				</div>
			</div>

			{/* REVIEWS GRID */}
			<div className="max-w-7xl mx-auto px-4 py-16">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{testimonials.map((review) => (
						<a
							key={review.id}
							href={review.link}
							target="_blank"
							rel="noopener noreferrer"
							className="group block no-underline"
						>
							<div className="h-full bg-neutral-900/40 border border-neutral-800 p-8 rounded-sm hover:border-neutral-600 hover:bg-neutral-900/60 transition-all duration-300 flex flex-col justify-between cursor-pointer">
								<div>
									{/* PLATFORM & RATING */}
									<div className="flex justify-between items-center mb-6">
										<span
											className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
												review.platform === "Google"
													? "bg-blue-900/30 text-blue-400 border border-blue-800/50"
													: "bg-red-900/30 text-red-400 border border-red-800/50"
											}`}
										>
											{review.platform}
										</span>

										<div className="text-yellow-500 text-sm">
											{"★".repeat(review.rating)}
										</div>
									</div>

									{/* REVIEW TEXT */}
									<p className="text-neutral-300 leading-relaxed mb-8 italic group-hover:text-white transition-colors whitespace-pre-line">
										"{review.text}"
									</p>
								</div>

								{/* AUTHOR & DATE */}
								<div className="border-t border-neutral-800 pt-4 flex justify-between items-center">
									<span className="text-white font-bold uppercase tracking-wide text-sm group-hover:text-red-500 transition-colors">
										{review.author}
									</span>
									<span className="text-neutral-600 text-xs font-mono">
										{review.date}
									</span>
								</div>
							</div>
						</a>
					))}
				</div>
			</div>

			{/* BOTTOM CTA */}
			<div className="pb-24 text-center px-4">
				<h2 className="text-xl md:text-2xl font-bold text-white mb-6 uppercase tracking-wider italic">
					Need some work done?
				</h2>
				<Link
					href="/contact"
					className="inline-block bg-red-600 hover:bg-red-500 text-white px-10 py-4 font-bold text-lg uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(220,38,38,0.2)]"
				>
					Contact the Shop
				</Link>
			</div>
		</main>
	);
}
