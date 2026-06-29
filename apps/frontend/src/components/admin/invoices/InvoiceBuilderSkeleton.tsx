import { InvoiceListSkeleton } from "./InvoiceListSkeleton";

export function InvoiceBuilderSkeleton() {
	return (
		<div
			className="mx-auto max-w-5xl pb-20"
			aria-busy="true"
			aria-label="Loading invoice builder"
		>
			<div className="mb-8 flex animate-pulse items-end justify-between">
				<div>
					<div className="mb-2 h-9 w-56 rounded bg-neutral-800" />
					<div className="h-4 w-80 max-w-full rounded bg-neutral-900" />
				</div>
				<div className="h-9 w-28 rounded bg-neutral-800" />
			</div>

			<InvoiceListSkeleton />
		</div>
	);
}
