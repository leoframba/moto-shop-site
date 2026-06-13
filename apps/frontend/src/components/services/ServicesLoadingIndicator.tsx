interface ServicesLoadingIndicatorProps {
	label?: string;
}

export default function ServicesLoadingIndicator({
	label = "Loading services...",
}: ServicesLoadingIndicatorProps) {
	return (
		<div
			className="flex justify-center items-center gap-4 py-8"
			role="status"
			aria-live="polite"
			aria-label={label}
		>
			<div
				className="w-4 h-4 bg-red-600 rounded-full animate-ping"
				aria-hidden="true"
			/>
			<p className="text-neutral-500 uppercase tracking-widest font-bold text-xs">
				{label}
			</p>
		</div>
	);
}
