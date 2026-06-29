const INVOICE_ROW_SKELETON_IDS = [
	"invoice-row-skeleton-1",
	"invoice-row-skeleton-2",
	"invoice-row-skeleton-3",
	"invoice-row-skeleton-4",
] as const;

export function InvoiceListSkeleton() {
	return (
		<section
			className="mt-6 rounded-lg border border-neutral-800 bg-neutral-900 p-4 sm:p-5"
			aria-busy="true"
			aria-label="Loading invoices"
		>
			<div className="mb-5 flex animate-pulse flex-col gap-4">
				<div className="h-4 w-32 rounded bg-neutral-800" />
				<div className="grid gap-4 md:grid-cols-2">
					<div className="h-12 rounded-md bg-neutral-800/80" />
					<div className="h-12 rounded-md bg-neutral-800/80" />
				</div>
				<div className="h-11 rounded-md bg-neutral-800/80" />
				<div className="flex flex-wrap gap-2">
					{INVOICE_ROW_SKELETON_IDS.map((id) => (
						<div key={id} className="h-8 w-20 rounded-full bg-neutral-800/70" />
					))}
				</div>
			</div>

			<div className="animate-pulse space-y-3">
				{INVOICE_ROW_SKELETON_IDS.map((id) => (
					<div
						key={`${id}-row`}
						className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-4"
					>
						<div className="flex items-center justify-between gap-4">
							<div className="flex flex-1 items-center gap-3">
								<div className="h-4 w-4 rounded bg-neutral-800" />
								<div className="space-y-2">
									<div className="h-4 w-36 rounded bg-neutral-800" />
									<div className="h-3 w-52 max-w-full rounded bg-neutral-900" />
								</div>
							</div>
							<div className="h-8 w-24 rounded-md bg-neutral-800" />
						</div>
					</div>
				))}
			</div>
		</section>
	);
}
