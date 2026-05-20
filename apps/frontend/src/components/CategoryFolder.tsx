"use client";
import { useState } from "react";
import type { Service } from "@/types";

interface CategoryFolderProps {
	category: string;
	services: Service[];
	hourlyRate: number;
}

export default function CategoryFolder({
	category,
	services,
}: CategoryFolderProps) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className="border border-red-900/30 rounded-lg overflow-hidden bg-neutral-950/50 mb-6 shadow-lg">
			{/* HEADER */}
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				aria-expanded={isOpen}
				className="w-full flex justify-between items-center p-5 md:p-6 bg-gradient-to-r from-red-950/40 to-neutral-900/40 hover:from-red-900/50 transition-colors text-left border-b border-transparent data-[open=true]:border-red-900/30"
				data-open={isOpen}
			>
				<h2 className="text-xl md:text-2xl font-bold text-white uppercase tracking-widest flex items-center gap-3">
					<span className="text-red-600">{"///"}</span> {category}
				</h2>
				<div className="flex items-center gap-4">
					<span className="text-xs font-mono text-red-500/70 uppercase hidden md:block">
						{services.length} {services.length === 1 ? "Service" : "Services"}
					</span>
					<span className="text-red-500 font-mono text-3xl font-light leading-none w-6 text-center">
						{isOpen ? "−" : "+"}
					</span>
				</div>
			</button>

			{/* CONTENTS */}
			{isOpen && (
				<div className="p-2 md:p-4 space-y-2">
					{services.map((service) => (
						<div
							key={service.id}
							className="group bg-neutral-900/30 hover:bg-neutral-900/80 p-5 rounded border border-neutral-800/50 transition-colors flex flex-col md:flex-row justify-between md:items-center gap-6"
						>
							<div className="max-w-2xl">
								<h3 className="text-lg md:text-xl font-bold text-neutral-200 mb-1 tracking-wide uppercase">
									{service.name}
								</h3>
								{service.description && (
									<p className="text-neutral-400 leading-relaxed text-sm">
										{service.description}
									</p>
								)}
							</div>

							{/* PRICING BLOCK */}
							<div className="flex items-center shrink-0">
								{service.pricing_type === "contact" ? (
									<span className="text-lg md:text-xl font-bold text-neutral-400 uppercase tracking-widest italic">
										Call for Quote
									</span>
								) : (
									<div className="flex items-center gap-4 md:gap-8">
										{/* BIG LABOR HOURS */}
										{service.pricing_type === "hourly" && (
											<div className="text-right">
												<span className="block text-[10px] md:text-xs text-neutral-500 uppercase tracking-widest mb-1">
													Est. Labor
												</span>
												<span className="text-lg md:text-xl font-mono text-neutral-200">
													{service.estimated_hours}{" "}
													<span className="text-xs md:text-sm text-neutral-500 font-sans uppercase">
														hrs
													</span>
												</span>
											</div>
										)}

										{service.pricing_type === "hourly" && (
											<div className="w-px h-10 bg-neutral-800 hidden md:block"></div>
										)}

										<div className="text-right border-l border-neutral-800 pl-4 md:border-none md:pl-0">
											<span className="block text-[10px] md:text-xs text-neutral-500 uppercase tracking-widest mb-1">
												{service.pricing_type === "fixed"
													? "Fixed Rate"
													: "Est. Labor Price"}
											</span>
											<span className="text-2xl md:text-3xl font-mono text-white font-bold group-hover:text-red-400 transition-colors">
												${service.calculated_price?.toFixed(2)}
											</span>
										</div>
									</div>
								)}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
