"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { sendContactEmail } from "@/actions/contact";
import type { Service, ServiceResponse } from "@/types";
import { apiRequest } from "@/utils/api";

function ContactForm() {
	const searchParams = useSearchParams();
	const preselectedService = searchParams.get("service") || "";

	const [services, setServices] = useState<Service[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const currentYear = new Date().getFullYear();
	const years = Array.from(
		{ length: currentYear - 1970 + 2 },
		(_, i) => currentYear + 1 - i,
	);

	const [formData, setFormData] = useState({
		name: "",
		phone: "",
		email: "",
		year: "",
		make: "",
		model: "",
		message: "",
		selectedService: preselectedService,
	});

	useEffect(() => {
		async function fetchServices() {
			try {
				const data = await apiRequest<ServiceResponse>("/api/services", {
					cache: "no-store",
				});
				setServices(data.services);
			} catch (error) {
				console.error("Failed to load services for form:", error);
			} finally {
				setIsLoading(false);
			}
		}
		fetchServices();
	}, []);

	// Group services by category for the dropdown
	const groupedServices = services.reduce(
		(acc, service) => {
			const cat = service.categories?.name || "General";
			if (!acc[cat]) acc[cat] = [];
			acc[cat].push(service);
			return acc;
		},
		{} as Record<string, Service[]>,
	);

	const clearForm = () => {
		setFormData({
			name: "",
			phone: "",
			email: "",
			year: "",
			make: "",
			model: "",
			message: "",
			selectedService: "",
		});
	};

	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (e: React.SubmitEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			const res = await sendContactEmail(formData);

			if (res.success) {
				alert("Thanks for reaching out! We'll be in touch soon.");
				clearForm();
			}
		} catch (error) {
			alert("Something went wrong. Please try again later.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="bg-neutral-900/30 border border-neutral-800 p-6 md:p-10 rounded-sm space-y-8 shadow-2xl"
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

			{/* BIKE & SERVICE INFO */}
			<div className="space-y-6">
				<h2 className="text-white font-bold uppercase tracking-widest border-b border-neutral-800 pb-2">
					Bike & Service
				</h2>
				<div className="grid md:grid-cols-3 gap-6">
					<div>
						<label
							htmlFor="year-contact"
							className="block text-xs text-neutral-500 uppercase tracking-wider mb-2"
						>
							Year
						</label>
						<select
							required
							id="year-contact"
							className="w-full bg-neutral-950 border border-neutral-800 text-white px-4 py-3 focus:outline-none focus:border-red-600 transition-colors appearance-none"
							value={formData.year}
							onChange={(e) =>
								setFormData({ ...formData, year: e.target.value })
							}
						>
							<option value="">-- Year --</option>
							{years.map((y) => (
								<option key={y} value={y}>
									{y}
								</option>
							))}
							<option value="Older">Older than 1970</option>
						</select>
					</div>
					<div>
						<label
							htmlFor="make-contact"
							className="block text-xs text-neutral-500 uppercase tracking-wider mb-2"
						>
							Make
						</label>
						<input
							type="text"
							required
							id="make-contact"
							placeholder="e.g. Ducati"
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
							Model
						</label>
						<input
							type="text"
							required
							id="model-contact"
							placeholder="e.g. Monster 821"
							className="w-full bg-neutral-950 border border-neutral-800 text-white px-4 py-3 focus:outline-none focus:border-red-600 transition-colors"
							value={formData.model}
							onChange={(e) =>
								setFormData({ ...formData, model: e.target.value })
							}
						/>
					</div>

					{/* DROPDOWN */}
					<div className="md:col-span-2">
						<label
							htmlFor="service-contact"
							className="block text-xs text-neutral-500 uppercase tracking-wider mb-2"
						>
							Primary Service Needed (Optional)
						</label>
						<select
							id="service-contact"
							className="w-full bg-neutral-950 border border-neutral-800 text-white px-4 py-3 focus:outline-none focus:border-red-600 transition-colors appearance-none"
							value={formData.selectedService}
							onChange={(e) =>
								setFormData({ ...formData, selectedService: e.target.value })
							}
							disabled={isLoading}
						>
							<option value="">-- Select a Service --</option>
							<option value="Not Sure / Diagnostic">
								Not Sure / Diagnostic
							</option>

							{Object.entries(groupedServices).map(
								([category, categoryServices]) => (
									<optgroup
										key={category}
										label={`── ${category.toUpperCase()} ──`}
										className="bg-neutral-900 text-red-500 font-bold"
									>
										{categoryServices.map((service) => (
											<option
												key={service.id}
												value={service.name}
												className="text-white font-normal"
											>
												{service.name}
											</option>
										))}
									</optgroup>
								),
							)}
						</select>
					</div>
				</div>
			</div>

			{/* NOTES */}
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
					{isSubmitting ? "Sending..." : "Send Inquiry"}
				</button>
			</div>
		</form>
	);
}

export default function ContactPage() {
	return (
		<main className="min-h-screen bg-black font-sans">
			<div className="pt-32 pb-16 px-4">
				<div className="max-w-3xl mx-auto">
					<h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tighter uppercase italic text-center">
						Contact <span className="text-red-600">The Shop</span>
					</h1>
					{/* DIRECT CONTACT */}
					<div className="grid md:grid-cols-2 gap-6 mb-16">
						{/* LEFT: CALL & HOURS */}
						<div className="bg-neutral-900/50 border border-neutral-800 p-8 flex flex-col justify-center">
							<div className="flex items-center gap-4 mb-6">
								<div className="w-12 h-12 bg-red-600/10 text-red-500 rounded-full flex items-center justify-center">
									<svg
										aria-hidden="true"
										className="w-6 h-6"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
										/>
									</svg>
								</div>
								<div>
									<h3 className="text-white font-bold uppercase tracking-widest text-sm">
										Call <span className="text-red-500 lowercase">|</span> Text
									</h3>
									<a
										href="tel:+14082990508"
										className="text-2xl font-mono text-white hover:text-red-400 transition-colors"
									>
										(408)&thinsp;299-0508
									</a>
									<p className="mt-1">
										<a
											href="mailto:jim@advcycles.com"
											className="text-neutral-500 hover:text-white transition-colors text-sm"
										>
											jim@advcycles.com
										</a>
									</p>
								</div>
							</div>

							<div className="border-t border-neutral-800 pt-6">
								<h3 className="text-white font-bold uppercase tracking-widest text-sm mb-4">
									Shop Hours
								</h3>
								<ul className="text-neutral-400 space-y-2 text-sm">
									<li className="flex justify-between">
										<span>Tues - Fri:</span>
										<span className="text-white">9:30 AM - 5:00 PM</span>
									</li>
									<li className="flex justify-between">
										<span>Saturday:</span>
										<span className="text-white">9:30 AM - 2:00 PM</span>
									</li>
									<li className="flex justify-between border-t border-neutral-800/50 pt-2 mt-2">
										<span>Sunday - Monday:</span>
										<span className="text-red-500 italic">Closed</span>
									</li>
								</ul>
							</div>
						</div>

						{/* RIGHT COLUMN: MAP & LOCATION */}
						<div className="bg-neutral-900/50 border border-neutral-800 flex flex-col overflow-hidden group">
							{/* Live Google Map */}
							<div className="w-full h-48 bg-neutral-950 relative border-b border-neutral-800">
								<iframe
									width="100%"
									height="100%"
									title="ADVCycles Location Map"
									src="https://maps.google.com/maps?q=1135+Old+Bayshore+Highway,+San+Jose,+CA+95112&t=&z=14&ie=UTF8&iwloc=&output=embed"
									className="absolute inset-0 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
									loading="lazy"
								/>
							</div>

							{/* Address Info */}
							<div className="p-6 md:p-8 flex-1 flex flex-col justify-center items-center text-center">
								<h3 className="text-white font-bold uppercase tracking-widest text-sm mb-2">
									Find Us
								</h3>
								<address className="text-neutral-400 not-italic leading-relaxed mb-4">
									1135 Old Bayshore Highway
									<br />
									San Jose, CA 95112
								</address>
								<a
									href="https://maps.google.com/?q=1135+Old+Bayshore+Highway,+San+Jose,+CA+95112"
									target="_blank"
									rel="noopener noreferrer"
									className="inline-block border border-neutral-700 hover:border-red-600 text-white px-6 py-2 text-sm uppercase tracking-widest font-bold transition-all hover:bg-red-600/10"
								>
									Get Directions
								</a>
							</div>
						</div>
					</div>

					{/* VISUAL DIVIDER */}
					<div className="flex items-center gap-4 mb-12">
						<div className="flex-1 h-px bg-neutral-800"></div>
						<span className="text-neutral-500 text-xs font-bold uppercase tracking-widest text-center">
							Or message us directly
						</span>
						<div className="flex-1 h-px bg-neutral-800"></div>
					</div>
					<Suspense
						fallback={
							<div className="text-center text-red-500 animate-pulse">
								Loading form...
							</div>
						}
					>
						<ContactForm />
					</Suspense>
				</div>
			</div>
		</main>
	);
}
