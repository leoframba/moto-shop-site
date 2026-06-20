"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FiTrash2, FiUploadCloud } from "react-icons/fi";
import { toast } from "sonner";
import type { InvoicePhoto } from "@/types";
import { authApiRequest, authApiUpload } from "@/utils/api";
import { compressImage } from "@/utils/image";

interface InvoicePhotosManagerProps {
	invoiceId: string;
	embedded?: boolean;
}

export function InvoicePhotosManager({
	invoiceId,
	embedded = false,
}: InvoicePhotosManagerProps) {
	const [photos, setPhotos] = useState<InvoicePhoto[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isUploading, setIsUploading] = useState(false);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const loadPhotos = useCallback(async () => {
		setIsLoading(true);
		try {
			const rows = await authApiRequest<InvoicePhoto[]>(
				`/api/admin/invoices/${invoiceId}/photos`,
				{ cache: "no-store" },
			);
			setPhotos(rows);
		} catch (error) {
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	}, [invoiceId]);

	useEffect(() => {
		void loadPhotos();
	}, [loadPhotos]);

	const handleFiles = async (fileList: FileList | null) => {
		if (!fileList || fileList.length === 0) return;

		setIsUploading(true);
		try {
			const formData = new FormData();
			for (const file of Array.from(fileList)) {
				const optimized = await compressImage(file);
				formData.append("files", optimized);
			}
			await authApiUpload(`/api/admin/invoices/${invoiceId}/photos`, formData);
			toast.success("Photos uploaded.");
			await loadPhotos();
		} catch (error) {
			console.error(error);
			toast.error(error instanceof Error ? error.message : "Upload failed.");
		} finally {
			setIsUploading(false);
			if (inputRef.current) inputRef.current.value = "";
		}
	};

	const handleDelete = async (photo: InvoicePhoto) => {
		if (!window.confirm("Delete this photo? This cannot be undone.")) return;
		setDeletingId(photo.id);
		try {
			await authApiRequest<{ message: string }>(
				`/api/admin/invoices/${invoiceId}/photos/${photo.id}`,
				{ method: "DELETE" },
			);
			setPhotos((prev) => prev.filter((item) => item.id !== photo.id));
		} catch (error) {
			console.error(error);
			toast.error("Failed to delete photo.");
		} finally {
			setDeletingId(null);
		}
	};

	return (
		<div
			className={
				embedded ? "space-y-3" : "mt-4 border-t border-neutral-800 pt-4"
			}
		>
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<p className="text-xs font-bold uppercase tracking-widest text-neutral-300">
					Photos {photos.length > 0 ? `(${photos.length})` : ""}
				</p>
				<label className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-neutral-800 px-4 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-neutral-700 sm:w-auto">
					<FiUploadCloud className="h-4 w-4" />
					{isUploading ? "Uploading..." : "Add Photos"}
					<input
						ref={inputRef}
						type="file"
						accept="image/*"
						multiple
						disabled={isUploading}
						onChange={(e) => void handleFiles(e.target.files)}
						className="hidden"
					/>
				</label>
			</div>

			{isLoading ? (
				<p className="text-xs text-neutral-300">Loading photos...</p>
			) : photos.length === 0 ? (
				<p className="text-xs text-neutral-300">
					No photos yet. Images are auto-compressed before upload.
				</p>
			) : (
				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
					{photos.map((photo) => (
						<div
							key={photo.id}
							className="relative group rounded overflow-hidden border border-neutral-800 bg-black/30"
						>
							{photo.signed_url ? (
								<a
									href={photo.signed_url}
									target="_blank"
									rel="noopener noreferrer"
								>
									{/* biome-ignore lint/performance/noImgElement: signed URLs are short-lived and not optimizable by next/image */}
									<img
										src={photo.signed_url}
										alt={photo.caption || "Invoice photo"}
										className="w-full h-28 object-cover"
										loading="lazy"
									/>
								</a>
							) : (
								<div className="w-full h-28 flex items-center justify-center text-[10px] text-neutral-300">
									Unavailable
								</div>
							)}
							<button
								type="button"
								onClick={() => void handleDelete(photo)}
								disabled={deletingId === photo.id}
								title="Delete photo"
								className="absolute top-1 right-1 bg-black/70 hover:bg-red-700 text-white rounded p-1.5 transition-colors"
							>
								<FiTrash2 className="h-3.5 w-3.5" />
							</button>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
