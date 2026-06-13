"use client";

import { useEffect, useRef, useState } from "react";
import {
	FiArrowLeft,
	FiArrowRight,
	FiImage,
	FiUploadCloud,
	FiX,
} from "react-icons/fi";
import type { BikeFormData, BikeImage, BikeListing, BikeStatus } from "@/types";

export type UnifiedImage =
	| { id: string; url: string; isNew: false; dbImage: BikeImage }
	| { id: string; url: string; isNew: true; file: File };

interface AdminBikeFormProps {
	initialData?: BikeListing | null;
	onSave: (
		data: BikeFormData,
		images: UnifiedImage[],
		deletedImages: BikeImage[],
	) => Promise<void>;
	onCancel: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label: string;
}
const FormInput = ({ label, id, ...props }: FormInputProps) => (
	<div>
		<label
			htmlFor={id}
			className="block text-xs text-neutral-500 uppercase tracking-wider mb-2"
		>
			{label}
		</label>
		<input
			id={id}
			{...props}
			className="w-full bg-neutral-950 border border-neutral-800 text-white px-4 py-3 focus:outline-none focus:border-red-600 transition-colors"
		/>
	</div>
);

export default function AdminBikeForm({
	initialData,
	onSave,
	onCancel,
}: AdminBikeFormProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const currentYear = new Date().getFullYear();
	const years = Array.from(
		{ length: currentYear - 1970 + 2 },
		(_, i) => currentYear + 1 - i,
	);

	const [formData, setFormData] = useState<BikeFormData>({
		year: initialData?.year || currentYear,
		make: initialData?.make || "",
		model: initialData?.model || "",
		price: initialData?.price || 0,
		mileage: initialData?.mileage || 0,
		description: initialData?.description || "",
		status: initialData?.status || "available",
	});

	const [images, setImages] = useState<UnifiedImage[]>(() => {
		if (!initialData?.images) return [];
		return initialData.images.map((img) => ({
			id: img.id,
			url: img.image_url,
			isNew: false,
			dbImage: img,
		}));
	});

	const [deletedImages, setDeletedImages] = useState<BikeImage[]>([]);
	const [isDragging, setIsDragging] = useState(false);

	const dragCounterRef = useRef(0);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const generatedUrlsRef = useRef<string[]>([]);

	const handleFiles = (files: FileList | File[]) => {
		const validFiles = Array.from(files).filter(
			(file) =>
				ACCEPTED_IMAGE_TYPES.has(file.type) && file.size <= MAX_FILE_SIZE,
		);

		if (validFiles.length === 0) return;

		const newImages: UnifiedImage[] = validFiles.map((file) => {
			const url = URL.createObjectURL(file);
			generatedUrlsRef.current.push(url); // Track for memory cleanup
			return { id: url, url, isNew: true, file };
		});

		setImages((prev) => [...prev, ...newImages]);
	};

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files) return;
		handleFiles(e.target.files);
		e.target.value = "";
	};

	const removeImage = (indexToRemove: number) => {
		const target = images[indexToRemove];
		if (!target.isNew) {
			setDeletedImages((prev) => [...prev, target.dbImage]);
		} else {
			URL.revokeObjectURL(target.url);
		}
		setImages((prev) => prev.filter((_, i) => i !== indexToRemove));
	};

	const moveImage = (index: number, direction: -1 | 1) => {
		const newIndex = index + direction;
		if (newIndex < 0 || newIndex >= images.length) return;
		setImages((prev) => {
			const arr = [...prev];
			[arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
			return arr;
		});
	};

	const cleanupMemory = () => {
		generatedUrlsRef.current.forEach(URL.revokeObjectURL);
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: <false positive>
	useEffect(() => {
		return cleanupMemory;
	}, []);

	const handleCancel = () => {
		cleanupMemory();
		onCancel();
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		try {
			await onSave(formData, images, deletedImages);
		} catch (error) {
			console.error("Failed to save bike", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	// Drag-and-drop handlers
	const hasFiles = (e: React.DragEvent) =>
		Array.from(e.dataTransfer.types).includes("Files");
	const handleDragEnter = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (!hasFiles(e)) return;
		dragCounterRef.current += 1;
		setIsDragging(true);
	};
	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		dragCounterRef.current -= 1;
		if (dragCounterRef.current <= 0) {
			dragCounterRef.current = 0;
			setIsDragging(false);
		}
	};
	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		e.dataTransfer.dropEffect = "copy";
	};
	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		dragCounterRef.current = 0;
		setIsDragging(false);
		handleFiles(e.dataTransfer.files);
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="bg-neutral-900 border border-neutral-800 p-6 md:p-8 rounded-lg mb-8 shadow-xl"
		>
			<div className="flex justify-between items-center mb-6 border-b border-neutral-800 pb-4">
				<h3 className="text-xl font-bold text-white uppercase tracking-widest">
					{initialData ? "Edit Motorcycle" : "Add New Motorcycle"}
				</h3>
				<button
					type="button"
					onClick={handleCancel}
					disabled={isSubmitting}
					className="text-neutral-500 hover:text-white transition-colors disabled:opacity-50"
				>
					<FiX
						aria-hidden="true"
						className="w-5 h-5 transition-colors"
						strokeWidth={3}
					/>
				</button>
			</div>

			<div className="grid md:grid-cols-3 gap-6 mb-8">
				<div>
					<label
						htmlFor="year"
						className="block text-xs text-neutral-500 uppercase tracking-wider mb-2"
					>
						Year
					</label>
					<select
						id="year"
						required
						className="w-full bg-neutral-950 border border-neutral-800 text-white px-4 py-3 focus:outline-none focus:border-red-600 transition-colors appearance-none"
						value={formData.year}
						onChange={(e) =>
							setFormData({ ...formData, year: parseInt(e.target.value, 10) })
						}
					>
						{years.map((y) => (
							<option key={y} value={y}>
								{y}
							</option>
						))}
					</select>
				</div>

				<FormInput
					label="Make"
					id="make"
					required
					placeholder="e.g. Ducati"
					value={formData.make}
					onChange={(e) => setFormData({ ...formData, make: e.target.value })}
				/>
				<FormInput
					label="Model"
					id="model"
					required
					placeholder="e.g. Monster 821"
					value={formData.model}
					onChange={(e) => setFormData({ ...formData, model: e.target.value })}
				/>
				<FormInput
					label="Price ($)"
					id="price"
					type="number"
					required
					min="0"
					step="1"
					value={formData.price || ""}
					onChange={(e) =>
						setFormData({ ...formData, price: parseFloat(e.target.value) })
					}
				/>
				<FormInput
					label="Mileage"
					id="mileage"
					type="number"
					required
					min="0"
					step="1"
					value={formData.mileage || ""}
					onChange={(e) =>
						setFormData({ ...formData, mileage: parseInt(e.target.value, 10) })
					}
				/>

				<div>
					<label
						htmlFor="status"
						className="block text-xs text-neutral-500 uppercase tracking-wider mb-2"
					>
						Status
					</label>
					<select
						id="status"
						className="w-full bg-neutral-950 border border-neutral-800 text-white px-4 py-3 focus:outline-none focus:border-red-600 transition-colors appearance-none"
						value={formData.status}
						onChange={(e) =>
							setFormData({ ...formData, status: e.target.value as BikeStatus })
						}
					>
						<option value="available">Available</option>
						<option value="sold">Sold</option>
						<option value="draft">Draft (Hidden)</option>
					</select>
				</div>
			</div>

			<div className="mb-8">
				<label
					htmlFor="description"
					className="block text-xs text-neutral-500 uppercase tracking-wider mb-2"
				>
					Description
				</label>
				<textarea
					id="description"
					rows={4}
					placeholder="Condition, recent maintenance, aftermarket parts..."
					className="w-full bg-neutral-950 border border-neutral-800 text-white px-4 py-3 focus:outline-none focus:border-red-600 transition-colors resize-y"
					value={formData.description}
					onChange={(e) =>
						setFormData({ ...formData, description: e.target.value })
					}
				></textarea>
			</div>

			<div className="mb-8">
				<label
					htmlFor="photos"
					className="block text-xs text-neutral-500 uppercase tracking-wider mb-2"
				>
					Photos
				</label>
				<input
					id="photos"
					type="file"
					multiple
					accept="image/png,image/jpeg,image/webp"
					className="hidden"
					ref={fileInputRef}
					onChange={handleImageChange}
				/>
				<button
					type="button"
					onClick={() => fileInputRef.current?.click()}
					onDragEnter={handleDragEnter}
					onDragLeave={handleDragLeave}
					onDragOver={handleDragOver}
					onDrop={handleDrop}
					className={`w-full border-2 border-dashed transition-all rounded-lg p-8 text-center cursor-pointer mb-4 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-neutral-950 ${isDragging ? "border-red-600 bg-red-950/30" : "border-neutral-700 hover:border-red-600 bg-neutral-950/50 hover:bg-neutral-900"}`}
				>
					{isDragging ? (
						<FiUploadCloud className="w-9 h-9 text-red-500 mx-auto mb-3" />
					) : (
						<FiImage className="w-9 h-9 text-neutral-500 mx-auto mb-3" />
					)}
					<span className="text-neutral-400 font-bold">Upload Photos</span>
					<p className="text-xs text-neutral-600 mt-1">
						PNG, JPG, WEBP up to 5MB
					</p>
				</button>

				<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
					{images.map((img, index) => (
						<div
							key={img.id}
							className={`relative aspect-video rounded border overflow-hidden group ${img.isNew ? "border-emerald-800" : "border-neutral-800"}`}
						>
							<div
								className="w-full h-full"
								style={{
									backgroundImage: `url(${img.url})`,
									backgroundSize: "cover",
									backgroundPosition: "center",
								}}
							/>

							{index === 0 && (
								<span className="absolute bottom-1 left-1 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase shadow-md">
									Primary
								</span>
							)}
							{img.isNew && index !== 0 && (
								<span className="absolute bottom-1 left-1 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase shadow-md">
									New
								</span>
							)}

							<div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1">
								<div className="flex justify-end">
									<button
										type="button"
										onClick={() => removeImage(index)}
										className="bg-red-600 hover:bg-red-500 text-white p-1 rounded transition-colors shadow-md"
									>
										<FiX className="w-4 h-4" />
									</button>
								</div>
								<div className="flex justify-between items-end gap-1">
									{index > 0 ? (
										<button
											type="button"
											onClick={() => moveImage(index, -1)}
											className="bg-neutral-800 hover:bg-neutral-700 text-white p-1.5 rounded transition-colors shadow-md"
										>
											<FiArrowLeft className="w-4 h-4" />
										</button>
									) : (
										<div />
									)}
									{index < images.length - 1 && (
										<button
											type="button"
											onClick={() => moveImage(index, 1)}
											className="bg-neutral-800 hover:bg-neutral-700 text-white p-1.5 rounded transition-colors shadow-md"
										>
											<FiArrowRight className="w-4 h-4" />
										</button>
									)}
								</div>
							</div>
						</div>
					))}
				</div>
			</div>

			<div className="flex justify-end gap-4 pt-4 border-t border-neutral-800">
				<button
					type="button"
					onClick={handleCancel}
					disabled={isSubmitting}
					className="px-6 py-3 font-bold uppercase tracking-widest text-neutral-400 hover:text-white transition-colors disabled:opacity-50"
				>
					Cancel
				</button>
				<button
					type="submit"
					disabled={isSubmitting}
					className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white px-8 py-3 rounded font-bold uppercase tracking-widest transition-all"
				>
					{isSubmitting
						? "Saving..."
						: initialData
							? "Update Motorcycle"
							: "Save Motorcycle"}
				</button>
			</div>
		</form>
	);
}
