"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import type { Service } from "@/types";

export default function ContactPage() {
	const [services, setServices] = useState<Service[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Form State
	const [formData, setFormData] = useState({
		name: "",
		phone: "",
		email: "",
		make: "",
		model: "",
		message: "",
		selectedServices: [] as string[],
	});

	useEffect(() => {
		async function fetchServices() {
			try {
				const res = await fetch("http://127.0.0.1:8000/api/services");
				if (res.ok) {
					const data = await res.json();
					setServices(data.services);
				}
			} catch (error) {
				console.error("Failed to load services for form:", error);
			} finally {
				setIsLoading(false);
			}
		}
		fetchServices();
	}, []);

	const handleCheckboxChange = (serviceName: string) => {
		setFormData((prev) => {
			const isSelected = prev.selectedServices.includes(serviceName);
			return {
				...prev,
				selectedServices: isSelected
					? prev.selectedServices.filter((s) => s !== serviceName)
					: [...prev.selectedServices, serviceName],
			};
		});
	};

	const handleSubmit = async (e: React.SubmitEvent) => {
		e.preventDefault();

		// TODO: Set up email func
		console.log("Form submitted:", formData);

		alert("Thanks for reaching out! We'll be in touch soon.");
	};

	return (
		<main className="min-h-screen bg-black font-sans">
			<Navbar />

			<div className="pt-32 pb-16 px-4">
				<div className="max-w-3xl mx-auto">
					<h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter uppercase italic text-center">
						Contact <span className="text-red-600">The Shop</span>
					</h1>
					<p className="text-neutral-400 text-center mb-12">
						We are a first-come, first-served shop. Fill out the form below to
						let us know what you need, or just ride down.
					</p>

					<form
						onSubmit={handleSubmit}
						className="bg-neutral-900/30 border border-neutral-800 p-6 md:p-10 rounded-sm space-y-8"
					>
						{/* CUSTOMER INFO */}
						<div className="space-y-6">
							<h2 className="text-white font-bold uppercase tracking-widest border-b border-neutral-800 pb-2">
								Your Info
							</h2>
							<div className="grid md:grid-cols-2 gap-6">
								<div>
									<label
										htmlFor="name-contact"
										className="block text-xs text-neutral-500 uppercase tracking-wider mb-2"
									>
										Name
									</label>
									<input
										type="text"
										required
										id="name-contact"
										className="w-full bg-neutral-950 border border-neutral-800 text-white px-4 py-3 focus:outline-none focus:border-red-600 transition-colors"
										value={formData.name}
										onChange={(e) =>
											setFormData({ ...formData, name: e.target.value })
										}
									/>
								</div>
								<div>
									<label
										htmlFor="phone-contact"
										className="block text-xs text-neutral-500 uppercase tracking-wider mb-2"
									>
										Phone
									</label>
									<input
										type="tel"
										required
										id="phone-contact"
										className="w-full bg-neutral-950 border border-neutral-800 text-white px-4 py-3 focus:outline-none focus:border-red-600 transition-colors"
										value={formData.phone}
										onChange={(e) =>
											setFormData({ ...formData, phone: e.target.value })
										}
									/>
								</div>
								<div className="md:col-span-2">
									<label
										htmlFor="email-contact"
										className="block text-xs text-neutral-500 uppercase tracking-wider mb-2"
									>
										Email
									</label>
									<input
										type="email"
										required
										id="email-contact"
										className="w-full bg-neutral-950 border border-neutral-800 text-white px-4 py-3 focus:outline-none focus:border-red-600 transition-colors"
										value={formData.email}
										onChange={(e) =>
											setFormData({ ...formData, email: e.target.value })
										}
									/>
								</div>
							</div>
						</div>

						{/* BIKE INFO */}
						<div className="space-y-6">
							<h2 className="text-white font-bold uppercase tracking-widest border-b border-neutral-800 pb-2">
								Bike Info
							</h2>
							<div className="grid md:grid-cols-2 gap-6">
								<div>
									<label
										htmlFor="make-contact"
										className="block text-xs text-neutral-500 uppercase tracking-wider mb-2"
									>
										Make (e.g., Ducati, Yamaha)
									</label>
									<input
										type="text"
										required
										id="make-contact"
										className="w-full bg-neutral-950 border border-neutral-800 text-white px-4 py-3 focus:outline-none focus:border-red-600 transition-colors"
										value={formData.make}
										onChange={(e) =>
											setFormData({ ...formData, make: e.target.value })
										}
									/>
								</div>
								<div>
									<label
										htmlFor="model-contact"
										className="block text-xs text-neutral-500 uppercase tracking-wider mb-2"
									>
										Model & Year
									</label>
									<input
										type="text"
										required
										id="model-contact"
										className="w-full bg-neutral-950 border border-neutral-800 text-white px-4 py-3 focus:outline-none focus:border-red-600 transition-colors"
										value={formData.model}
										onChange={(e) =>
											setFormData({ ...formData, model: e.target.value })
										}
									/>
								</div>
							</div>
						</div>

						{/* SERVICES INTERESTED IN */}
						<div className="space-y-6">
							<h2 className="text-white font-bold uppercase tracking-widest border-b border-neutral-800 pb-2">
								What do you need done? (Optional)
							</h2>
							{isLoading ? (
								<p className="text-neutral-500 italic text-sm">
									Loading service menu...
								</p>
							) : (
								<div className="grid md:grid-cols-2 gap-4">
									{services.map((service) => (
										<label
											key={service.id}
											className="flex items-start gap-3 cursor-pointer group"
										>
											<div className="mt-1 relative flex items-center justify-center">
												<input
													type="checkbox"
													className="peer appearance-none w-5 h-5 border border-neutral-700 bg-neutral-950 checked:bg-red-600 checked:border-red-600 transition-colors cursor-pointer"
													checked={formData.selectedServices.includes(
														service.name,
													)}
													onChange={() => handleCheckboxChange(service.name)}
												/>
												<svg
													className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
													strokeWidth={3}
													aria-hidden="true"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														d="M5 13l4 4L19 7"
													/>
												</svg>
											</div>
											<span className="text-neutral-400 group-hover:text-white transition-colors">
												{service.name}
											</span>
										</label>
									))}
								</div>
							)}
						</div>

						{/* ADDITIONAL NOTES */}
						<div className="space-y-6">
							<h2 className="text-white font-bold uppercase tracking-widest border-b border-neutral-800 pb-2">
								Additional Details
							</h2>
							<div>
								<textarea
									rows={4}
									placeholder="Describe any specific issues, aftermarket parts involved, etc."
									className="w-full bg-neutral-950 border border-neutral-800 text-white px-4 py-3 focus:outline-none focus:border-red-600 transition-colors resize-y"
									value={formData.message}
									onChange={(e) =>
										setFormData({ ...formData, message: e.target.value })
									}
								></textarea>
							</div>
						</div>

						{/* SUBMIT */}
						<div className="pt-4">
							<button
								type="submit"
								className="w-full bg-red-600 hover:bg-red-500 text-white px-10 py-4 font-bold text-lg uppercase tracking-widest transition-all"
							>
								Send Inquiry
							</button>
						</div>
					</form>
				</div>
			</div>
		</main>
	);
}
