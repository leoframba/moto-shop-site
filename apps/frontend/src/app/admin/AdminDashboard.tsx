"use client";
import { useState } from "react";
import AdminBikesTab from "@/components/admin/AdminBikesTab";
import AdminInvoicesTab from "@/components/admin/AdminInvoicesTab";
import AdminPartsTab from "@/components/admin/AdminPartsTab";
import AdminSalesTab from "@/components/admin/AdminSalesTab";
import AdminShopSettingsTab from "@/components/admin/AdminShopSettingsTab";
import AdminSidebar, { type AdminTab } from "@/components/admin/AdminSidebar";
import AdminUsersTab from "@/components/admin/AdminUsersTab";
import { adminShellClass } from "@/components/admin/adminUi";
import AdminServiceTab from "@/components/admin/services/AdminServiceTab";

export default function AdminDashboard() {
	const [activeTab, setActiveTab] = useState<AdminTab>("services");

	return (
		<div className={`flex min-h-screen flex-col font-sans ${adminShellClass}`}>
			<AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

			<main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-10">
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
