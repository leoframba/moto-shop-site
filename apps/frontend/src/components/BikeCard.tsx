"use client";

import Image from "next/image";
import {
	FiArrowRight,
	FiEdit3,
	FiEye,
	FiImage,
	FiTrash2,
} from "react-icons/fi";
import type { BikeListing } from "@/types";
import { formatPrice } from "@/utils/helper";

interface BikeCardProps {
	bike: BikeListing;
	isAdmin?: boolean;
	onView: (bike: BikeListing) => void;
	onEdit?: (bike: BikeListing) => void;
	onDelete?: (id: string) => void;
}

export default function BikeCard({
	bike,
	isAdmin = false,
	onView,
	onEdit,
	onDelete,
}: BikeCardProps) {
	const primaryImage = bike.images?.[0]?.image_url || "/placeholder-bike.jpg";
	const isSold = bike.status === "sold";

	// UI states determined by role and bike status
	const cardBorder =
		isSold && !isAdmin ? "border-neutral-900 opacity-75" : "border-neutral-800";
	const priceColor =
		isSold && !isAdmin ? "text-neutral-600 line-through" : "text-red-500";

	return (
		<div
			className={`bg-neutral-950 border ${cardBorder} rounded-lg overflow-hidden group flex flex-col transition-colors duration-300 `}
		>
			<button
				type="button"
				onClick={() => onView(bike)}
				className="relative aspect-[4/3] bg-neutral-950 overflow-hidden block w-full cursor-pointer"
				aria-label={`View details for ${bike.year} ${bike.make} ${bike.model}`}
			>
				<Image
					priority
					src={primaryImage}
					alt={`${bike.year} ${bike.make} ${bike.model}`}
					fill
					sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
					className={`object-cover ${isSold && !isAdmin ? "grayscale" : ""}`}
				/>

				{isSold && !isAdmin && (
					<div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px] z-10">
						<span className="border-4 border-red-600 text-red-600 font-black text-4xl uppercase tracking-widest px-6 py-2 -rotate-12 rounded">
							Sold
						</span>
					</div>
				)}

				{isAdmin && (
					<div className="absolute top-3 left-3 flex gap-2 z-20">
						<span
							className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded text-white ${
								bike.status === "available"
									? "bg-emerald-600"
									: bike.status === "sold"
										? "bg-red-600"
										: "bg-neutral-600"
							}`}
						>
							{bike.status}
						</span>
					</div>
				)}

				{(!isSold || isAdmin) && bike.images && bike.images.length > 1 && (
					<div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md px-2 py-1 rounded text-xs text-white flex items-center gap-1 font-mono z-20 shadow-xl">
						<FiImage aria-hidden="true" className="h-3 w-3" />
						{bike.images.length}
					</div>
				)}
			</button>

			<div className="p-5 flex-1 flex flex-col">
				<h3 className="text-xl font-bold text-white mb-1 truncate">
					{bike.year} {bike.make} {bike.model}
				</h3>

				<div
					className={`flex justify-between items-center mb-4 ${!isAdmin ? "pb-4 border-b border-neutral-900" : ""}`}
				>
					<span className={`font-mono font-bold ${priceColor}`}>
						{formatPrice(bike.price)}
					</span>
					<span className="text-neutral-500 text-sm font-mono">
						{bike.mileage.toLocaleString()} mi
					</span>
				</div>

				{isAdmin ? (
					<div className="mt-auto grid grid-cols-3 gap-2 pt-4 border-t border-neutral-800">
						<button
							type="button"
							onClick={() => onView(bike)}
							className="py-2 text-sm font-bold uppercase tracking-widest text-neutral-400 hover:text-emerald-500 transition-colors inline-flex items-center justify-center gap-2"
						>
							<FiEye aria-hidden="true" className="h-4 w-4" /> View
						</button>
						<button
							type="button"
							onClick={() => onEdit?.(bike)}
							className="py-2 text-sm font-bold uppercase tracking-widest text-neutral-400 hover:text-white transition-colors inline-flex items-center justify-center gap-2"
						>
							<FiEdit3 aria-hidden="true" className="h-4 w-4" /> Edit
						</button>
						<button
							type="button"
							onClick={() => onDelete?.(bike.id)}
							className="py-2 text-sm font-bold uppercase tracking-widest text-neutral-400 hover:text-red-500 transition-colors inline-flex items-center justify-center gap-2"
						>
							<FiTrash2 aria-hidden="true" className="h-4 w-4" /> Delete
						</button>
					</div>
				) : (
					<button
						type="button"
						onClick={() => onView(bike)}
						className="w-full mt-auto py-3 bg-neutral-900 hover:bg-red-600 text-white font-bold uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2 rounded group"
					>
						View Details
						<FiArrowRight className="w-4 h-4" />
					</button>
				)}
			</div>
		</div>
	);
}
