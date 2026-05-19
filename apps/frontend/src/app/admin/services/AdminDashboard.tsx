"use client";
import { useState } from "react";
import type { AdminInitialData, Service, ServiceResponse } from "@/types";
import { apiRequest, authApiRequest } from "@/utils/api";

interface AdminDashboardProps {
	initialData: AdminInitialData;
}

export default function AdminDashboard({ initialData }: AdminDashboardProps) {
	const [hourlyRate, setHourlyRate] = useState<number>(initialData.hourly_rate);
	const [services, setServices] = useState<Service[]>(initialData.services);

	// Editing service states
	const [editingId, setEditingId] = useState<string | number | null>(null);
	const [editForm, setEditForm] = useState({
		name: "",
		description: "",
		estimated_hours: 0,
	});
	// Add service states
	const [isAdding, setIsAdding] = useState(false);
	const [addForm, setAddForm] = useState({
		name: "",
		description: "",
		estimated_hours: 1,
	});

	const saveRate = async (newRate: number) => {
		console.log("Sending new rate to backend = ", newRate);

		try {
			await authApiRequest("/api/admin/shop-rate", {
				method: "PATCH",
				body: JSON.stringify({ hourly_rate: newRate }),
			});

			alert("Shop rate updated successfully in database!");
		} catch (error) {
			console.error("Error saving rate:", error);
			alert("Failed to save rate. Check console.");
		}
	};

	const startEditing = (service: Service) => {
		setEditingId(service.id);
		setEditForm({
			name: service.name,
			description: service.description,
			estimated_hours: service.estimated_hours,
		});
	};

	const saveEdit = async (id: string | number) => {
		try {
			await authApiRequest(`/api/admin/services/${id}`, {
				method: "PATCH",
				body: JSON.stringify(editForm),
			});

			setServices((prev) =>
				prev.map((s) => (s.id === id ? { ...s, ...editForm } : s)),
			);
			setEditingId(null);
		} catch (error) {
			console.error(error);
			alert("Failed to save changes.");
		}
	};

	const saveNewService = async () => {
		try {
			const newService = await authApiRequest<Service>("/api/admin/services", {
				method: "POST",
				body: JSON.stringify(addForm),
			});

			setServices([...services, newService]);

			setAddForm({ name: "", description: "", estimated_hours: 1 });
			setIsAdding(false);
		} catch (error) {
			console.error(error);
			alert("Failed to add new service.");
		}
	};

	const deleteService = async (service_to_delete: Service) => {
		if (!confirm("Are you sure you want to delete this service?")) return;
		const prevServices = [...services];

		setServices(
			services.filter((service) => service.id !== service_to_delete.id),
		);

		try {
			await apiRequest(`/api/admin/services/${service_to_delete.id}`, {
				method: "DELETE",
			});

			alert("Service deleted successfully!");
		} catch (error) {
			console.error("Error deleting service:", error);
			setServices(prevServices);
			alert("Failed to delete service. Check console.");
		}
	};

	return (
		<div className="p-8 bg-neutral-950 min-h-screen text-white font-sans">
			<div className="max-w-5xl mx-auto">
				<div className="mb-8 flex justify-between items-end">
					<div>
						<h1 className="text-3xl font-bold tracking-tight text-white mb-1">
							Admin Dashboard
						</h1>
						<p className="text-neutral-400 text-sm">
							Manage shop rate and service menu.
						</p>
					</div>
				</div>

				{/* GLOBAL SETTINGS CARD */}
				<section className="mb-12 p-8 border border-neutral-800 rounded-2xl bg-neutral-900 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
					<div>
						<h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">
							Global Shop Rate
						</h2>
						<p className="text-neutral-400 text-sm max-w-sm">
							Updating this rate instantly recalculates estimated prices.
						</p>
					</div>
					<div className="flex items-center gap-4">
						<span className="text-xl font-mono text-neutral-500">$</span>
						<input
							type="number"
							value={hourlyRate}
							onChange={(e) => setHourlyRate(Number(e.target.value))}
							className="bg-neutral-950 border border-neutral-700 rounded-lg px-4 py-3 text-2xl font-mono text-emerald-400 w-32 focus:outline-none focus:border-emerald-500"
						/>
						<button
							type="button"
							onClick={() => saveRate(hourlyRate)}
							className="bg-emerald-600 hover:bg-emerald-500 px-6 py-3 rounded-lg font-bold"
						>
							Save Rate
						</button>
					</div>
				</section>

				{/* SERVICE MANAGEMENT LIST */}
				<section>
					<div className="flex justify-between items-center mb-4">
						<h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500">
							Service Menu Previews
						</h2>
						<button
							type="button"
							onClick={() => setIsAdding(!isAdding)}
							className="text-sm font-semibold text-emerald-400 hover:text-emerald-300"
						>
							{isAdding ? "Cancel Adding" : "+ Add New Service"}
						</button>
					</div>

					<div className="space-y-4">
						{/* ADD NEW SERVICE FORM */}
						{isAdding && (
							<div className="p-6 bg-neutral-900 border border-emerald-500/50 rounded-xl mb-6 shadow-lg shadow-emerald-900/20">
								<p className="text-sm text-emerald-400 font-semibold mb-4">
									Create New Service
								</p>
								<div className="grid gap-4 mb-4">
									<input
										placeholder="Service Name (e.g., Oil Change)"
										className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-emerald-500 outline-none"
										value={addForm.name}
										onChange={(e) =>
											setAddForm({ ...addForm, name: e.target.value })
										}
									/>
									<textarea
										placeholder="Description..."
										className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-emerald-500 outline-none h-24"
										value={addForm.description}
										onChange={(e) =>
											setAddForm({ ...addForm, description: e.target.value })
										}
									/>
									<div className="flex items-center gap-4">
										<label
											htmlFor="set-est-hour"
											className="text-sm text-neutral-400"
										>
											Est. Hours:
										</label>
										<input
											type="number"
											id="set-est-hour"
											step="0.1"
											className="w-32 bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-emerald-500 outline-none"
											value={addForm.estimated_hours}
											onChange={(e) =>
												setAddForm({
													...addForm,
													estimated_hours: Number(e.target.value),
												})
											}
										/>
									</div>
								</div>
								<button
									type="button"
									onClick={saveNewService}
									className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded font-bold text-sm"
								>
									Create Service
								</button>
							</div>
						)}

						{/* EXISTING SERVICES LIST */}
						{services.map((service) => (
							<div
								key={service.id}
								className="border border-neutral-800 rounded-xl bg-neutral-900 overflow-hidden"
							>
								{/* EDIT MODE */}
								{editingId === service.id ? (
									<div className="p-6 bg-neutral-800/30 border-l-4 border-emerald-500">
										<p className="text-sm text-emerald-400 font-semibold mb-4">
											Editing Service
										</p>
										<div className="grid gap-4 mb-4">
											<input
												className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-emerald-500 outline-none"
												value={editForm.name}
												onChange={(e) =>
													setEditForm({ ...editForm, name: e.target.value })
												}
											/>
											<textarea
												className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-emerald-500 outline-none h-24"
												value={editForm.description}
												onChange={(e) =>
													setEditForm({
														...editForm,
														description: e.target.value,
													})
												}
											/>
											<div className="flex items-center gap-4">
												<label
													htmlFor="edit-est-hours"
													className="text-sm text-neutral-400"
												>
													Est. Hours:
												</label>
												<input
													type="number"
													step="0.1"
													id="edit-est-hours"
													className="w-32 bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-emerald-500 outline-none"
													value={editForm.estimated_hours}
													onChange={(e) =>
														setEditForm({
															...editForm,
															estimated_hours: Number(e.target.value),
														})
													}
												/>
											</div>
										</div>
										<div className="flex gap-3">
											<button
												type="button"
												onClick={() => saveEdit(service.id)}
												className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded font-bold text-sm"
											>
												Save Changes
											</button>
											<button
												type="button"
												onClick={() => deleteService(service)}
												className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-bold text-sm"
											>
												Delete
											</button>
											<button
												type="button"
												onClick={() => setEditingId(null)}
												className="bg-neutral-700 hover:bg-neutral-600 px-4 py-2 rounded font-bold text-sm"
											>
												Cancel
											</button>
										</div>
									</div>
								) : (
									/* PREVIEW MODE */
									<div className="p-6 md:p-8 hover:bg-neutral-800/50 transition-colors flex flex-col md:flex-row justify-between md:items-center gap-6">
										<div className="max-w-xl">
											<h2 className="text-xl font-semibold text-white mb-1">
												{service.name}
											</h2>
											<p className="text-neutral-400 text-sm leading-relaxed">
												{service.description}
											</p>
										</div>
										<div className="flex items-center gap-8">
											<div className="flex items-center gap-6">
												<div className="text-right hidden md:block">
													<span className="text-xs text-neutral-500 uppercase">
														Est. Time
													</span>
													<p className="text-sm font-mono text-neutral-300">
														{service.estimated_hours} hrs
													</p>
												</div>
												<div className="text-right">
													<span className="text-xs text-neutral-500 uppercase">
														Preview Price
													</span>
													<p className="text-2xl font-mono text-white">
														${(service.estimated_hours * hourlyRate).toFixed(2)}
													</p>
												</div>
											</div>
											<div className="pl-6 border-l border-neutral-800">
												<button
													type="button"
													onClick={() => startEditing(service)}
													className="text-neutral-400 hover:text-white transition-colors bg-neutral-800 hover:bg-neutral-700 px-4 py-2 rounded-lg text-sm font-semibold"
												>
													Edit
												</button>
											</div>
										</div>
									</div>
								)}
							</div>
						))}
					</div>
				</section>
			</div>
		</div>
	);
}
