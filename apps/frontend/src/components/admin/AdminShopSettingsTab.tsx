"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { ShopSettings } from "@/types";
import { authApiRequest } from "@/utils/api";

interface ShopSettingsFormData {
	shop_name: string;
	shop_address: string;
	shop_phone: string;
	shop_email: string;
	bar_number: string;
	hourly_rate: number;
	tax_rate: number;
	hazardous_waste_rate: number;
}

const toFormData = (settings: ShopSettings): ShopSettingsFormData => ({
	shop_name: settings.shop_name ?? "",
	shop_address: settings.shop_address ?? "",
	shop_phone: settings.shop_phone ?? "",
	shop_email: settings.shop_email ?? "",
	bar_number: settings.bar_number ?? "",
	hourly_rate: Number(settings.hourly_rate ?? 0),
	tax_rate: Number(settings.tax_rate ?? 0),
	hazardous_waste_rate: Number(settings.hazardous_waste_rate ?? 0),
});

export default function AdminShopSettingsTab() {
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [formData, setFormData] = useState<ShopSettingsFormData>({
		shop_name: "",
		shop_address: "",
		shop_phone: "",
		shop_email: "",
		bar_number: "",
		hourly_rate: 0,
		tax_rate: 0,
		hazardous_waste_rate: 0,
	});

	const fetchSettings = useCallback(async () => {
		setIsLoading(true);
		try {
			const settings = await authApiRequest<ShopSettings>(
				"/api/admin/shop-settings",
				{
					cache: "no-store",
				},
			);
			setFormData(toFormData(settings));
		} catch (error) {
			console.error(error);
			toast.error("Failed to load shop settings.");
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		void fetchSettings();
	}, [fetchSettings]);

	const updateField = (
		field: keyof ShopSettingsFormData,
		value: string | number,
	) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const saveSettings = async () => {
		setIsSaving(true);
		try {
			await authApiRequest<ShopSettings>("/api/admin/shop-settings", {
				method: "PATCH",
				body: JSON.stringify({
					shop_name: formData.shop_name || null,
					shop_address: formData.shop_address || null,
					shop_phone: formData.shop_phone || null,
					shop_email: formData.shop_email || null,
					bar_number: formData.bar_number || null,
					hourly_rate: Number(formData.hourly_rate),
					tax_rate: Number(formData.tax_rate),
					hazardous_waste_rate: Number(formData.hazardous_waste_rate),
				}),
			});
			toast.success("Shop settings updated.");
		} catch (error) {
			console.error(error);
			toast.error("Failed to save shop settings.");
		} finally {
			setIsSaving(false);
		}
	};

	if (isLoading) {
		return (
			<div className="max-w-4xl mx-auto pb-20">
				<div className="text-center py-20 text-neutral-300 animate-pulse uppercase tracking-widest font-bold">
					Loading Shop Settings...
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto pb-20">
			<div className="mb-8">
				<h2 className="text-3xl font-bold tracking-tight text-white mb-1">
					Shop Settings
				</h2>
				<p className="text-neutral-300 text-sm">
					Update business details used in invoices and pricing defaults.
				</p>
			</div>

			<div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 space-y-5">
				<div className="grid md:grid-cols-2 gap-4">
					<div>
						<label
							htmlFor="shop-name"
							className="text-xs text-neutral-300 block mb-1"
						>
							Shop Name
						</label>
						<input
							id="shop-name"
							value={formData.shop_name}
							onChange={(e) => updateField("shop_name", e.target.value)}
							className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-emerald-500 outline-none"
						/>
					</div>
					<div>
						<label
							htmlFor="shop-email"
							className="text-xs text-neutral-300 block mb-1"
						>
							Shop Email
						</label>
						<input
							id="shop-email"
							value={formData.shop_email}
							onChange={(e) => updateField("shop_email", e.target.value)}
							className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-emerald-500 outline-none"
						/>
					</div>
					<div>
						<label
							htmlFor="shop-phone"
							className="text-xs text-neutral-300 block mb-1"
						>
							Shop Phone
						</label>
						<input
							id="shop-phone"
							value={formData.shop_phone}
							onChange={(e) => updateField("shop_phone", e.target.value)}
							className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-emerald-500 outline-none"
						/>
					</div>
					<div>
						<label
							htmlFor="shop-rate"
							className="text-xs text-neutral-300 block mb-1"
						>
							Hourly Rate
						</label>
						<input
							id="shop-rate"
							type="number"
							min={0}
							step={0.01}
							value={formData.hourly_rate}
							onChange={(e) =>
								updateField("hourly_rate", Number(e.target.value) || 0)
							}
							className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-emerald-500 outline-none"
						/>
					</div>
					<div>
						<label
							htmlFor="shop-tax-rate"
							className="text-xs text-neutral-300 block mb-1"
						>
							Sales Tax Rate (%)
						</label>
						<input
							id="shop-tax-rate"
							type="number"
							min={0}
							step={0.001}
							value={formData.tax_rate}
							onChange={(e) =>
								updateField("tax_rate", Number(e.target.value) || 0)
							}
							className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-emerald-500 outline-none"
						/>
					</div>
					<div>
						<label
							htmlFor="shop-hazardous-waste-rate"
							className="text-xs text-neutral-300 block mb-1"
						>
							Hazardous Waste Unit Rate
						</label>
						<input
							id="shop-hazardous-waste-rate"
							type="number"
							min={0}
							step={0.01}
							value={formData.hazardous_waste_rate}
							onChange={(e) =>
								updateField("hazardous_waste_rate", Number(e.target.value) || 0)
							}
							className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-emerald-500 outline-none"
						/>
					</div>
					<div>
						<label
							htmlFor="shop-bar-number"
							className="text-xs text-neutral-300 block mb-1"
						>
							BAR#
						</label>
						<input
							id="shop-bar-number"
							value={formData.bar_number}
							onChange={(e) => updateField("bar_number", e.target.value)}
							placeholder="Bureau of Automotive Repair number"
							className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-emerald-500 outline-none"
						/>
					</div>
					<div className="md:col-span-2">
						<label
							htmlFor="shop-address"
							className="text-xs text-neutral-300 block mb-1"
						>
							Shop Address
						</label>
						<input
							id="shop-address"
							value={formData.shop_address}
							onChange={(e) => updateField("shop_address", e.target.value)}
							className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-emerald-500 outline-none"
						/>
					</div>
				</div>

				<div>
					<button
						type="button"
						onClick={() => void saveSettings()}
						disabled={isSaving}
						className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-700 px-5 py-2.5 rounded font-bold text-sm uppercase tracking-widest"
					>
						{isSaving ? "Saving..." : "Save Settings"}
					</button>
				</div>
			</div>
		</div>
	);
}
