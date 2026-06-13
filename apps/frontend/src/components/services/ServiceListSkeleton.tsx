import ServicesLoadingIndicator from "./ServicesLoadingIndicator";

const SERVICE_FOLDER_SKELETON_IDS = [
	"service-folder-skeleton-1",
	"service-folder-skeleton-2",
	"service-folder-skeleton-3",
	"service-folder-skeleton-4",
	"service-folder-skeleton-5",
] as const;

interface ServiceListSkeletonProps {
	folderCount?: number;
	showShopRate?: boolean;
}

export default function ServiceListSkeleton({
	folderCount = 3,
	showShopRate = true,
}: ServiceListSkeletonProps) {
	return (
		<div>
			<ServicesLoadingIndicator />

			<div className="animate-pulse">
				{showShopRate && (
					<div className="mb-8 flex flex-wrap justify-between items-center bg-neutral-900/30 border border-neutral-800/60 px-6 py-4 rounded gap-4">
						<div className="h-4 w-40 bg-neutral-800 rounded" />
						<div className="h-8 w-24 bg-neutral-800 rounded" />
					</div>
				)}

				<div className="mt-8 space-y-6">
					{SERVICE_FOLDER_SKELETON_IDS.slice(0, folderCount).map((id) => (
						<div
							key={id}
							className="border border-neutral-800 rounded-lg overflow-hidden bg-neutral-950/50"
						>
							<div className="flex justify-between items-center p-5 md:p-6 bg-neutral-900/40">
								<div className="h-6 w-48 bg-neutral-800 rounded" />
								<div className="h-6 w-6 bg-neutral-800 rounded" />
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
