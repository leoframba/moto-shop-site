"use client";
import { useState } from "react";

type ShopRateManagerProps = {
	initialRate: number;
	onSaveRate: (newRate: number) => Promise<void>;
};

export default function ShopRateManager({
	initialRate,
	onSaveRate,
}: ShopRateManagerProps) {
	const [hourlyRate, setHourlyRate] = useState<number>(initialRate);
	const [isSaving, setIsSaving] = useState<boolean>(false);

	const handleSave = async () => {
		setIsSaving(true);
		try {
			await onSaveRate(hourlyRate);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<section className="p-8 border border-neutral-800 rounded-2xl bg-neutral-900 shadow-xl">
			<h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">
				Global Shop Rate
			</h2>
			<div className="flex items-center gap-4 mt-4">
				<span className="text-xl font-mono text-neutral-500">$</span>
				<input
					type="number"
					value={hourlyRate}
					onChange={(e) => setHourlyRate(Number(e.target.value))}
					className="bg-neutral-950 border border-neutral-700 rounded-lg px-4 py-3 text-2xl font-mono text-emerald-400 w-32 focus:outline-none focus:border-emerald-500"
				/>
				<button
					type="button"
					onClick={() => handleSave()}
					className="bg-emerald-600 hover:bg-emerald-500 px-6 py-3 rounded-lg font-bold"
				>
					{isSaving ? "Saving..." : "Save"}
				</button>
			</div>
		</section>
	);
}
