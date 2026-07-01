"use client";

import { useEffect, useState } from "react";
import { AdminButton } from "../AdminButton";
import { TbMoneybagPlus } from "react-icons/tb";
import { AdminModal } from "../modals";


type ShopRateManagerProps = {
	initialRate: number | null;
	onSaveRate: (newRate: number) => Promise<void>;
};

export default function ShopRateManager({
	initialRate,
	onSaveRate,
}: ShopRateManagerProps) {
	const [hourlyRate, setHourlyRate] = useState<number | null>(initialRate);
	const [isFormVisible, setIsFormVisible] = useState<boolean>(false);
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		setHourlyRate(initialRate);
	}, [initialRate]);

	const handleSave = async () => {
		if (hourlyRate === null) return;

		setIsSaving(true);
		try {
			await onSaveRate(hourlyRate);
		} finally {
			setIsSaving(false);
		}
	};
	const handleModalClose = () => {
		setIsFormVisible(false)
	}

	if (initialRate === null || hourlyRate === null) {
		return (
			<section className="p-8 border border-neutral-800 rounded-2xl bg-neutral-900 shadow-xl animate-pulse">
				<div className="h-3 w-32 bg-neutral-800 rounded mb-6" />
				<div className="flex items-center gap-4 mt-4">
					<div className="h-12 w-40 bg-neutral-800 rounded-lg" />
					<div className="h-12 w-24 bg-neutral-800 rounded-lg" />
				</div>
			</section>
		);
	}

	return (
		<div className="flex flex-col">
			<div>
				{isFormVisible && (
					<AdminModal open={isFormVisible} onClose={handleModalClose} title="Edit Shop Rate">
						<form onSubmit={handleSave} className="flex gap-4">
							<input className="w-full rounded border border-neutral-700 p-3 bg-neutral-950 outline-none "
								value={hourlyRate}
								onChange={(e) => setHourlyRate(Number(e.target.value))}
							>
							</input>
							<AdminButton
								type="submit"
								size="lg"

							>
								Save
							</AdminButton>
						</form>

					</AdminModal>
				)}
			</div>
			<div className="flex justify-between">
				<span></span>
				<AdminButton
					variant="text"
					size="lg"
					iconLeft={<TbMoneybagPlus />}
					className="pr-1"
					onClick={() => setIsFormVisible(true)}
				>
					Edit Shop Rate
				</AdminButton>
			</div>
			<div className="mb-8 flex flex-wrap justify-center md:justify-between items-center bg-neutral-900/30 border border-neutral-800/60 px-6 py-4 rounded text-sm gap-4">
				<div className="flex items-center gap-3">
					<span className="text-neutral-300 font-bold uppercase tracking-widest">
						Base Shop Rate
					</span>
					<span className="text-neutral-600 hidden md:inline">|</span>
					<span className="text-neutral-500 uppercase tracking-wider text-xs hidden md:inline">
						Used to calculate est. labor
					</span>
				</div>
				<div className="font-mono text-red-500 font-bold text-xl md:text-2xl">
					${hourlyRate}
					<span className="text-sm text-neutral-500 font-sans">/hr</span>
				</div>
			</div>
		</div>
		// <section className="p-8 border border-neutral-800 rounded-2xl bg-neutral-900 shadow-xl">
		// 	<h2 className="text-xs font-bold uppercase tracking-widest text-neutral-300 mb-2">
		// 		Global Shop Rate
		// 	</h2>
		// 	<div className="flex items-center gap-4 mt-4">
		// 		<span className="text-xl font-mono text-neutral-300">$</span>
		// 		<input
		// 			type="number"
		// 			value={hourlyRate}
		// 			onChange={(e) => setHourlyRate(Number(e.target.value))}
		// 			className="bg-neutral-950 border border-neutral-700 rounded-lg px-4 py-3 text-2xl font-mono text-emerald-400 w-32 focus:outline-none focus:border-emerald-500"
		// 		/>
		// 		<button
		// 			type="button"
		// 			onClick={() => handleSave()}
		// 			className="bg-emerald-600 hover:bg-emerald-500 px-6 py-3 rounded-lg font-bold"
		// 		>
		// 			{isSaving ? "Saving..." : "Save"}
		// 		</button>
		// 	</div>
		// </section>
	);
}
