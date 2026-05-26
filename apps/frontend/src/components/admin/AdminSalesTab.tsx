"use client";

export default function AdminSalesTab() {
	return (
		<div className="max-w-5xl mx-auto pb-20">
			<div className="mb-8 flex justify-between items-end">
				<div>
					<h2 className="text-3xl font-bold tracking-tight text-white mb-1">
						Showroom Inventory
					</h2>
					<p className="text-neutral-400 text-sm">
						Add, edit, and manage motorcycles for sale.
					</p>
				</div>
				<button
					type="button"
					className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded font-bold uppercase tracking-widest text-sm transition-all"
				>
					+ Add Bike
				</button>
			</div>

			<div className="border border-dashed border-neutral-800 rounded-lg p-12 text-center bg-neutral-900/20">
				<p className="text-neutral-500 font-mono text-sm uppercase">
					Bike Inventory System Coming Soon...
				</p>
			</div>
		</div>
	);
}
