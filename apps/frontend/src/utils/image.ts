export interface CompressImageOptions {
	/** Longest edge in pixels. The image is scaled down to fit. */
	maxDimension?: number;
	/** Encoder quality between 0 and 1. */
	quality?: number;
	/** Output mime type. Defaults to WebP for the best size/quality ratio. */
	mimeType?: "image/webp" | "image/jpeg";
}

/**
 * Downscale and re-encode an image in the browser before upload to keep storage
 * costs low. EXIF orientation is corrected automatically. If the file can't be
 * decoded (e.g. some HEIC files) or compression wouldn't help, the original
 * file is returned unchanged so uploads never silently fail.
 */
export async function compressImage(
	file: File,
	options: CompressImageOptions = {},
): Promise<File> {
	const {
		maxDimension = 1600,
		quality = 0.8,
		mimeType = "image/webp",
	} = options;

	if (!file.type.startsWith("image/")) return file;
	if (
		typeof document === "undefined" ||
		typeof createImageBitmap !== "function"
	) {
		return file;
	}

	let bitmap: ImageBitmap;
	try {
		bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
	} catch {
		return file;
	}

	try {
		const longestEdge = Math.max(bitmap.width, bitmap.height);
		const scale = Math.min(1, maxDimension / longestEdge);
		const width = Math.max(1, Math.round(bitmap.width * scale));
		const height = Math.max(1, Math.round(bitmap.height * scale));

		const canvas = document.createElement("canvas");
		canvas.width = width;
		canvas.height = height;
		const ctx = canvas.getContext("2d");
		if (!ctx) return file;
		ctx.drawImage(bitmap, 0, 0, width, height);

		const blob = await new Promise<Blob | null>((resolve) => {
			canvas.toBlob((result) => resolve(result), mimeType, quality);
		});

		if (!blob || blob.size >= file.size) return file;

		const extension = mimeType === "image/webp" ? ".webp" : ".jpg";
		const baseName = file.name.replace(/\.[^./\\]+$/, "") || "photo";
		return new File([blob], `${baseName}${extension}`, {
			type: mimeType,
			lastModified: Date.now(),
		});
	} finally {
		bitmap.close?.();
	}
}
