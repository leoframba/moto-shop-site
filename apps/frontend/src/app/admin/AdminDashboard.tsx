"use client";
import { useState } from "react";
import AdminBikesTab from "@/components/admin/AdminBikesTab";
import AdminInvoicesTab from "@/components/admin/AdminInvoicesTab";
import AdminPartsTab from "@/components/admin/AdminPartsTab";
import AdminSalesTab from "@/components/admin/AdminSalesTab";
import AdminServiceTab from "@/components/admin/AdminServiceTab";
import AdminShopSettingsTab from "@/components/admin/AdminShopSettingsTab";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminUsersTab from "@/components/admin/AdminUsersTab";

export default function AdminDashboard() {
	const [activeTab, setActiveTab] = useState<
		"services" | "sales" | "bikes" | "parts" | "invoices" | "users" | "settings"
	>("services");

	return (
		<div className="flex flex-col md:flex-row min-h-screen bg-neutral-950 font-sans overflow-hidden">
			<AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

			<main className="flex-1 p-6 md:p-10 overflow-y-auto max-h-screen pb-24 md:pb-10">
				{activeTab === "services" && <AdminServiceTab />}
				{activeTab === "sales" && <AdminSalesTab />}
				{activeTab === "bikes" && <AdminBikesTab />}
				{activeTab === "parts" && <AdminPartsTab />}
				{activeTab === "invoices" && <AdminInvoicesTab />}
				{activeTab === "users" && <AdminUsersTab />}
				{activeTab === "settings" && <AdminShopSettingsTab />}
			</main>
		</div>
	);
}
