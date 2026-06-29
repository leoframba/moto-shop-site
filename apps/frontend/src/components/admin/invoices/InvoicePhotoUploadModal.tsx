"use client";

import { useId } from "react";
import { AdminModal } from "@/components/admin/modals/AdminModal";
import {
	invoiceFieldInputClass,
	invoiceHeaderSaveButtonClass,
	invoiceLabelClass,
	invoiceSecondaryButtonClass,
} from "@/components/admin/invoices/invoiceUi";

export interface PendingPhotoUpload {
	id: string;
	file: File;
	previewUrl: string;
	caption: string;
}

interface InvoicePhotoUploadModalProps {
	open: boolean;
	uploads: PendingPhotoUpload[];
	isUploading: boolean;
	onCaptionChange: (id: string, caption: string) => void;
	onConfirm: () => void;
	onCancel: () => void;
}

export function InvoicePhotoUploadModal({
	open,
	uploads,
	isUploading,
	onCaptionChange,
	onConfirm,
	onCancel,
}: InvoicePhotoUploadModalProps) {
	const formId = useId();

	return (
		<AdminModal
			open={open}
			onClose={onCancel}
			title="Add Photo Captions"
			size="lg"
			panelClassName="max-h-[90vh] overflow-y-auto"
			closeOnBackdrop={!isUploading}
			closeOnEscape={!isUploading}
		>
			<p className="mb-4 text-xs leading-relaxed text-neutral-300">
				Images are compressed. Add an optional caption for each photo before
				saving.
			</p>

			<form
				id={formId}
				onSubmit={(event) => {
					event.preventDefault();
					onConfirm();
				}}
				className="space-y-4"
			>
				{uploads.map((upload, index) => (
					<div
						key={upload.id}
						className="flex flex-col gap-3 rounded-lg border border-neutral-700/60 bg-neutral-900/80 p-3 sm:flex-row"
					>
						<div className="shrink-0 overflow-hidden rounded-md border border-neutral-800 bg-black/30 sm:w-32">
							{/* biome-ignore lint/performance/noImgElement: blob preview URL */}
							<img
								src={upload.previewUrl}
								alt={`Preview ${index + 1}`}
								className="h-28 w-full object-cover sm:h-24"
							/>
						</div>
						<div className="min-w-0 flex-1">
							<label
								htmlFor={`${formId}-caption-${upload.id}`}
								className={invoiceLabelClass}
							>
								Caption {uploads.length > 1 ? `(${index + 1})` : ""}
							</label>
							<input
								id={`${formId}-caption-${upload.id}`}
								type="text"
								value={upload.caption}
								onChange={(event) =>
									onCaptionChange(upload.id, event.target.value)
								}
								disabled={isUploading}
								placeholder="Optional description"
								className={invoiceFieldInputClass}
								maxLength={500}
							/>
						</div>
					</div>
				))}
			</form>

			<div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
				<button
					type="button"
					onClick={onCancel}
					disabled={isUploading}
					className={invoiceSecondaryButtonClass}
				>
					Cancel
				</button>
				<button
					type="submit"
					form={formId}
					disabled={isUploading || uploads.length === 0}
					className={invoiceHeaderSaveButtonClass}
				>
					{isUploading
						? "Uploading..."
						: uploads.length === 1
							? "Save Photo"
							: "Save Photos"}
				</button>
			</div>
		</AdminModal>
	);
}
