import ServicesLoadingIndicator from "./ServicesLoadingIndicator";

const ADMIN_SERVICE_SKELETON_IDS = [
	"admin-skeleton-rate",
	"admin-skeleton-categories",
	"admin-skeleton-folder",
] as const;

export default function AdminServicesSkeleton() {
	return (
		<div>
			<ServicesLoadingIndicator />

			<div className="animate-pulse space-y-8">
				<div>
					<div className="h-8 w-64 bg-neutral-800 rounded mb-2" />
					<div className="h-4 w-96 max-w-full bg-neutral-900 rounded" />
				</div>

				<div className="h-24 bg-neutral-900/50 border border-neutral-800 rounded-lg" />

				<div className="h-16 bg-neutral-900/50 border border-neutral-800 rounded-lg" />

				<div className="space-y-4">
					{ADMIN_SERVICE_SKELETON_IDS.map((id) => (
						<div
							key={id}
							className="h-20 bg-neutral-900/40 border border-neutral-800 rounded-lg"
						/>
					))}
				</div>
			</div>
		</div>
	);
}
