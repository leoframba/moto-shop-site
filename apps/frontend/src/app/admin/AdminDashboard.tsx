"use client";
import { useState } from "react";
import AdminSalesTab from "@/components/admin/AdminSalesTab";
import AdminServiceTab from "@/components/admin/AdminServiceTab";
import AdminSidebar from "@/components/admin/AdminSidebar";
import type { AdminInitialData } from "@/types";

interface AdminDashboardProps {
	initialData: AdminInitialData;
}

export default function AdminDashboard({ initialData }: AdminDashboardProps) {
	const [activeTab, setActiveTab] = useState<"services" | "sales">("services");

	return (
		<div className="flex flex-col md:flex-row min-h-screen bg-neutral-950 font-sans overflow-hidden">
			<AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

			<main className="flex-1 p-6 md:p-10 overflow-y-auto max-h-screen pb-24 md:pb-10">
				{activeTab === "services" && (
					<AdminServiceTab initialData={initialData} />
				)}
				{activeTab === "sales" && <AdminSalesTab />}
			</main>
		</div>
	);
}
