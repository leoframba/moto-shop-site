"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FiPlus } from "react-icons/fi";
import AdminBikeForm, {
	type UnifiedImage,
} from "@/components/admin/AdminBikeForm";
import BikeCard from "@/components/BikeCard";
import BikeDetailModal from "@/components/BikeDetailModal";
import type { BikeFormData, BikeImage, BikeListing } from "@/types";
import { sortBikeImages } from "@/utils/helper";
import { createClient } from "@/utils/supabase/client";

export default function AdminSalesTab() {
	const [isAdding, setIsAdding] = useState(false);
	const [bikes, setBikes] = useState<BikeListing[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isDeleting, setIsDeleting] = useState(false);
	const [editingBike, setEditingBike] = useState<BikeListing | null>(null);
	const [viewingBike, setViewingBike] = useState<BikeListing | null>(null);

	const supabase = useMemo(() => createClient(), []);

	const fetchBikes = useCallback(async () => {
		setIsLoading(true);
		try {
			const { data, error } = await supabase
				.from("bike_listings")
				.select(`*, images:bike_images(*)`)
				.order("created_at", { ascending: false });

			if (error) throw error;

			const formattedBikes = (data ?? []).map((bike) => ({
				...bike,
				images: sortBikeImages(bike.images),
			})) as BikeListing[];

			setBikes(formattedBikes);
		} catch (error) {
			console.error("Error fetching bikes:", error);
		} finally {
			setIsLoading(false);
		}
	}, [supabase]);

	useEffect(() => {
		void fetchBikes();
	}, [fetchBikes]);

	const handleSaveBike = async (
		data: BikeFormData,
		orderedImages: UnifiedImage[],
		deletedImages: BikeImage[],
	) => {
		try {
			let bikeId = editingBike?.id;

			if (bikeId) {
				const { error: updateError } = await supabase
					.from("bike_listings")
					.update({ ...data })
					.eq("id", bikeId);
				if (updateError) throw updateError;
			} else {
				const { data: newBike, error: insertError } = await supabase
					.from("bike_listings")
					.insert({ ...data })
					.select()
					.single();
				if (insertError) throw insertError;
				bikeId = newBike.id;
			}

			if (deletedImages.length > 0) {
				const pathsToRemove = deletedImages
					.map((img) => img.image_url.split("/sales_images/")[1])
					.filter(Boolean);
				if (pathsToRemove.length > 0)
					await supabase.storage.from("sales_images").remove(pathsToRemove);

				const idsToRemove = deletedImages.map((img) => img.id);
				await supabase.from("bike_images").delete().in("id", idsToRemove);
			}

			const imageRecordsToInsert = [];
			const updatePromises = [];

			for (let i = 0; i < orderedImages.length; i++) {
				const img = orderedImages[i];
				const isPrimary = i === 0;

				if (img.isNew && img.file) {
					const fileExt = img.file.name.split(".").pop();
					const fileName = `${bikeId}/${Date.now()}-${i}.${fileExt}`;

					const { error: uploadError } = await supabase.storage
						.from("sales_images")
						.upload(fileName, img.file);
					if (uploadError) continue;

					const { data: publicUrlData } = supabase.storage
						.from("sales_images")
						.getPublicUrl(fileName);

					imageRecordsToInsert.push({
						listing_id: bikeId,
						image_url: publicUrlData.publicUrl,
						is_primary: isPrimary,
						display_order: i,
					});
				} else if (!img.isNew && img.dbImage) {
					if (
						img.dbImage.display_order !== i ||
						img.dbImage.is_primary !== isPrimary
					) {
						updatePromises.push(
							supabase
								.from("bike_images")
								.update({ display_order: i, is_primary: isPrimary })
								.eq("id", img.dbImage.id),
						);
					}
				}
			}

			if (imageRecordsToInsert.length > 0) {
				const { error: imagesError } = await supabase
					.from("bike_images")
					.insert(imageRecordsToInsert);
				if (imagesError) throw imagesError;
			}

			if (updatePromises.length > 0) await Promise.all(updatePromises);

			alert(`Motorcycle ${editingBike ? "updated" : "added"} successfully!`);
			setIsAdding(false);
			setEditingBike(null);
			await fetchBikes();
		} catch (error) {
			console.error("Save bike error:", error);
			alert(
				error instanceof Error
					? error.message
					: "An error occurred while saving the bike.",
			);
		}
	};

	const handleDeleteBike = async (bikeId: string) => {
		if (
			!confirm(
				"Are you sure? This will permanently delete the bike and all its images.",
			)
		)
			return;

		setIsDeleting(true);
		try {
			const { data: files } = await supabase.storage
				.from("sales_images")
				.list(bikeId);
			if (files && files.length > 0) {
				const filePaths = files.map((file) => `${bikeId}/${file.name}`);
				await supabase.storage.from("sales_images").remove(filePaths);
			}

			const { error } = await supabase
				.from("bike_listings")
				.delete()
				.eq("id", bikeId);
			if (error) throw new Error(error.message);

			alert("Motorcycle deleted successfully.");
			await fetchBikes();
		} catch (error: any) {
			console.error("Delete error:", error);
			alert(error.message || "Failed to delete bike.");
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<div className="max-w-5xl mx-auto pb-20 relative">
			{/* Loading Overlay for Deletion */}
			{isDeleting && (
				<div className="absolute inset-0 bg-neutral-950/50 backdrop-blur-[1px] z-50 flex items-center justify-center rounded-lg">
					<span className="text-white font-bold uppercase tracking-widest animate-pulse">
						Processing...
					</span>
				</div>
			)}

			{viewingBike && (
				<BikeDetailModal
					bike={viewingBike}
					onClose={() => setViewingBike(null)}
				/>
			)}

			<div className="mb-8 flex justify-between items-end">
				<div>
					<h2 className="text-3xl font-bold tracking-tight text-white mb-1">
						Showroom Inventory
					</h2>
					<p className="text-neutral-400 text-sm">
						Add, edit, and manage motorcycles for sale.
					</p>
				</div>

				{!isAdding && (
					<button
						type="button"
						onClick={() => setIsAdding(true)}
						className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded font-bold uppercase tracking-widest text-sm transition-all inline-flex items-center gap-2 shadow-lg"
					>
						<FiPlus aria-hidden="true" className="h-4 w-4" /> Add Bike
					</button>
				)}
			</div>

			{isAdding && (
				<AdminBikeForm
					initialData={editingBike}
					onSave={handleSaveBike}
					onCancel={() => {
						setIsAdding(false);
						setEditingBike(null);
					}}
				/>
			)}

			{!isAdding &&
				(isLoading ? (
					<div className="text-center py-20 text-neutral-500 animate-pulse uppercase tracking-widest font-bold">
						Loading Inventory...
					</div>
				) : bikes.length === 0 ? (
					<div className="border border-dashed border-neutral-800 rounded-lg p-12 text-center bg-neutral-900/20">
						<p className="text-neutral-500 font-mono text-sm uppercase mb-4">
							No motorcycles in inventory.
						</p>
						<button
							type="button"
							onClick={() => setIsAdding(true)}
							className="text-red-500 hover:text-red-400 font-bold uppercase tracking-widest text-sm inline-flex items-center gap-2 mx-auto"
						>
							Add your first bike <span aria-hidden="true">&rarr;</span>
						</button>
					</div>
				) : (
					<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
						{bikes.map((bike) => (
							<BikeCard
								key={bike.id}
								bike={bike}
								isAdmin={true}
								onView={setViewingBike}
								onEdit={(bikeToEdit) => {
									setEditingBike(bikeToEdit);
									setIsAdding(true);
								}}
								onDelete={handleDeleteBike}
							/>
						))}
					</div>
				))}
		</div>
	);
}
