"use client";

import { useEffect, useState } from "react";
import type { InvoicePhoto } from "@/types";
import { authApiRequest } from "@/utils/api";

interface GaragePhotosProps {
	invoiceId: string;
}

export default function GaragePhotos({ invoiceId }: GaragePhotosProps) {
	const [photos, setPhotos] = useState<InvoicePhoto[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		let isActive = true;
		const load = async () => {
			setIsLoading(true);
			try {
				const rows = await authApiRequest<InvoicePhoto[]>(
					`/api/portal/invoices/${invoiceId}/photos`,
					{ cache: "no-store" },
				);
				if (isActive) setPhotos(rows);
			} catch (error) {
				console.error(error);
			} finally {
				if (isActive) setIsLoading(false);
			}
		};
		void load();
		return () => {
			isActive = false;
		};
	}, [invoiceId]);

	if (isLoading) {
		return <p className="text-xs text-neutral-500 mt-3">Loading photos...</p>;
	}

	if (photos.length === 0) return null;

	return (
		<div className="mt-4">
			<p className="text-neutral-500 uppercase tracking-widest text-[10px] font-bold mb-2">
				Photos
			</p>
			<div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
				{photos.map((photo) =>
					photo.signed_url ? (
						<a
							key={photo.id}
							href={photo.signed_url}
							target="_blank"
							rel="noopener noreferrer"
							className="block rounded overflow-hidden border border-neutral-800 bg-black/30"
						>
							{/* biome-ignore lint/performance/noImgElement: signed URLs are short-lived and not optimizable by next/image */}
							<img
								src={photo.signed_url}
								alt={photo.caption || "Service photo"}
								className="w-full h-24 object-cover"
								loading="lazy"
							/>
						</a>
					) : null,
				)}
			</div>
		</div>
	);
}
