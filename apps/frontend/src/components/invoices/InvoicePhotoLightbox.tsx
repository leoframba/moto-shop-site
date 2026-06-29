"use client";

import { useEffect, useRef, useState } from "react";
import {
	FiChevronLeft,
	FiChevronRight,
	FiExternalLink,
	FiX,
} from "react-icons/fi";
import { invoiceFieldInputClass } from "@/components/admin/invoices/invoiceUi";
import type { InvoicePhoto } from "@/types";

interface InvoicePhotoLightboxProps {
	photos: InvoicePhoto[];
	activeIndex: number;
	onClose: () => void;
	onNavigate: (index: number) => void;
	editable?: boolean;
	onSaveCaption?: (photoId: string, caption: string) => Promise<void>;
}

const CAPTION_FOOTER_CLASS =
	"shrink-0 h-14 border-t border-neutral-800/80 bg-neutral-950/90 px-4 sm:px-8";

export function InvoicePhotoLightbox({
	photos,
	activeIndex,
	onClose,
	onNavigate,
	editable = false,
	onSaveCaption,
}: InvoicePhotoLightboxProps) {
	const photo = photos[activeIndex];
	const hasPrevious = activeIndex > 0;
	const hasNext = activeIndex < photos.length - 1;
	const [draftCaption, setDraftCaption] = useState("");
	const [isEditingCaption, setIsEditingCaption] = useState(false);
	const [isSavingCaption, setIsSavingCaption] = useState(false);
	const captionInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		setDraftCaption(photo?.caption ?? "");
		setIsEditingCaption(false);
	}, [photo?.id, photo?.caption]);

	useEffect(() => {
		if (isEditingCaption) {
			captionInputRef.current?.focus();
			captionInputRef.current?.select();
		}
	}, [isEditingCaption]);

	const savedCaption = photo?.caption ?? "";
	const captionIsDirty = draftCaption !== savedCaption;

	useEffect(() => {
		const scrollY = window.scrollY;
		const {
			overflow: bodyOverflow,
			position: bodyPosition,
			top: bodyTop,
			width: bodyWidth,
		} = document.body.style;
		const htmlOverflow = document.documentElement.style.overflow;

		document.documentElement.style.overflow = "hidden";
		document.body.style.overflow = "hidden";
		document.body.style.position = "fixed";
		document.body.style.top = `-${scrollY}px`;
		document.body.style.width = "100%";

		const onKeyDown = (event: KeyboardEvent) => {
			const tag = (event.target as HTMLElement | null)?.tagName;
			if (tag === "INPUT" || tag === "TEXTAREA") {
				if (event.key === "Escape") {
					event.stopPropagation();
					setDraftCaption(savedCaption);
					setIsEditingCaption(false);
				}
				return;
			}

			if (event.key === "Escape") {
				if (isEditingCaption) {
					setDraftCaption(savedCaption);
					setIsEditingCaption(false);
					return;
				}
				onClose();
			}
			if (event.key === "ArrowLeft" && hasPrevious) {
				onNavigate(activeIndex - 1);
			}
			if (event.key === "ArrowRight" && hasNext) {
				onNavigate(activeIndex + 1);
			}
		};
		window.addEventListener("keydown", onKeyDown);

		return () => {
			document.documentElement.style.overflow = htmlOverflow;
			document.body.style.overflow = bodyOverflow;
			document.body.style.position = bodyPosition;
			document.body.style.top = bodyTop;
			document.body.style.width = bodyWidth;
			window.scrollTo(0, scrollY);
			window.removeEventListener("keydown", onKeyDown);
		};
	}, [
		activeIndex,
		hasNext,
		hasPrevious,
		isEditingCaption,
		onClose,
		onNavigate,
		savedCaption,
	]);

	const saveCaption = async () => {
		if (!photo || !onSaveCaption || isSavingCaption) return;

		if (!captionIsDirty) {
			setIsEditingCaption(false);
			return;
		}

		setIsSavingCaption(true);
		try {
			await onSaveCaption(photo.id, draftCaption);
			setIsEditingCaption(false);
		} finally {
			setIsSavingCaption(false);
		}
	};

	if (!photo?.signed_url) return null;

	const canEditCaption = editable && onSaveCaption;
	const showFooter = canEditCaption || Boolean(photo.caption);

	return (
		<div
			className="fixed inset-0 z-[100] flex flex-col bg-black/95"
			role="dialog"
			aria-modal="true"
			aria-label={photo.caption || "Photo viewer"}
		>
			<div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3">
				<p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
					{photos.length > 1 ? `${activeIndex + 1} of ${photos.length}` : "Photo"}
				</p>
				<div className="flex items-center gap-2">
					<a
						href={photo.signed_url}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:text-white"
					>
						<FiExternalLink className="h-3.5 w-3.5" />
						Open original
					</a>
					<button
						type="button"
						onClick={onClose}
						className="rounded-md p-1.5 text-neutral-300 transition-colors hover:text-white"
						aria-label="Close photo viewer"
					>
						<FiX className="h-5 w-5" />
					</button>
				</div>
			</div>

			<div className="relative flex min-h-0 flex-1 items-center justify-center px-12 sm:px-16">
				<button
					type="button"
					className="absolute inset-0 cursor-default"
					aria-label="Close photo viewer"
					onClick={onClose}
					tabIndex={-1}
				/>
				{hasPrevious ? (
					<button
						type="button"
						onClick={() => onNavigate(activeIndex - 1)}
						className="absolute left-2 z-10 rounded-full bg-black/60 p-2 text-white transition-colors hover:bg-black/80 sm:left-4"
						aria-label="Previous photo"
					>
						<FiChevronLeft className="h-6 w-6" />
					</button>
				) : null}
				<div className="relative z-[1] flex h-full w-full items-center justify-center">
					{/* biome-ignore lint/performance/noImgElement: signed URLs are short-lived and not optimizable by next/image */}
					<img
						src={photo.signed_url}
						alt={photo.caption || "Invoice photo"}
						className="max-h-full max-w-full object-contain"
					/>
				</div>
				{hasNext ? (
					<button
						type="button"
						onClick={() => onNavigate(activeIndex + 1)}
						className="absolute right-2 z-10 rounded-full bg-black/60 p-2 text-white transition-colors hover:bg-black/80 sm:right-4"
						aria-label="Next photo"
					>
						<FiChevronRight className="h-6 w-6" />
					</button>
				) : null}
			</div>

			{showFooter ? (
				<div className={`${CAPTION_FOOTER_CLASS} flex items-center`}>
					{canEditCaption ? (
						isEditingCaption ? (
							<input
								ref={captionInputRef}
								type="text"
								value={draftCaption}
								onChange={(event) => setDraftCaption(event.target.value)}
								disabled={isSavingCaption}
								placeholder="Add caption"
								className={`${invoiceFieldInputClass} mx-auto w-full max-w-3xl py-2 text-center text-sm sm:text-base`}
								maxLength={500}
								onKeyDown={(event) => {
									if (event.key === "Enter") {
										event.preventDefault();
										void saveCaption();
									}
								}}
								onBlur={() => void saveCaption()}
							/>
						) : (
							<button
								type="button"
								onClick={() => setIsEditingCaption(true)}
								className="mx-auto w-full max-w-3xl truncate text-center text-sm text-neutral-100 transition-colors hover:text-white sm:text-base"
							>
								{photo.caption ? (
									photo.caption
								) : (
									<span className="text-neutral-500">Add caption</span>
								)}
							</button>
						)
					) : (
						<p className="mx-auto w-full max-w-3xl truncate text-center text-sm text-neutral-100 sm:text-base">
							{photo.caption}
						</p>
					)}
				</div>
			) : null}
		</div>
	);
}
