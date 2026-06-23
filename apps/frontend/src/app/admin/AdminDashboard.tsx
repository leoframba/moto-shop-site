"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import AdminSidebar, { type AdminTab } from "@/components/admin/AdminSidebar";
import {
	adminLoadingStateClass,
	adminShellClass,
} from "@/components/admin/adminUi";
import { InvoicesDataProvider } from "@/components/admin/invoices/InvoicesDataProvider";

function AdminTabLoader({ label }: { label: string }) {
	return (
		<div className="mx-auto max-w-5xl pb-20">
			<div className={adminLoadingStateClass}>Loading {label}...</div>
		</div>
	);
}

const AdminServiceTab = dynamic(
	() => import("@/components/admin/services/AdminServiceTab"),
	{ loading: () => <AdminTabLoader label="Services" /> },
);

const AdminSalesTab = dynamic(
	() => import("@/components/admin/AdminSalesTab"),
	{ loading: () => <AdminTabLoader label="Bike Sales" /> },
);

const AdminBikesTab = dynamic(
	() => import("@/components/admin/AdminBikesTab"),
	{ loading: () => <AdminTabLoader label="Bikes" /> },
);

const AdminPartsTab = dynamic(
	() => import("@/components/admin/AdminPartsTab"),
	{ loading: () => <AdminTabLoader label="Parts" /> },
);

const AdminInvoicesTab = dynamic(
	() => import("@/components/admin/AdminInvoicesTab"),
	{ loading: () => <AdminTabLoader label="Invoices" /> },
);

const AdminStatsBoardTab = dynamic(
	() => import("@/components/admin/AdminStatsBoardTab"),
	{ loading: () => <AdminTabLoader label="Stats Board" /> },
);

const AdminUsersTab = dynamic(
	() => import("@/components/admin/AdminUsersTab"),
	{ loading: () => <AdminTabLoader label="Users" /> },
);

const AdminShopSettingsTab = dynamic(
	() => import("@/components/admin/AdminShopSettingsTab"),
	{ loading: () => <AdminTabLoader label="Settings" /> },
);

export default function AdminDashboard() {
	const [activeTab, setActiveTab] = useState<AdminTab>("invoices");

	return (
		<InvoicesDataProvider>
			<div
				className={`flex min-h-screen flex-col font-sans ${adminShellClass}`}
			>
				<AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

				<main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-10">
					{activeTab === "services" && <AdminServiceTab />}
					{activeTab === "sales" && <AdminSalesTab />}
					{activeTab === "bikes" && <AdminBikesTab />}
					{activeTab === "parts" && <AdminPartsTab />}
					{activeTab === "invoices" && <AdminInvoicesTab />}
					{activeTab === "stats" && <AdminStatsBoardTab />}
					{activeTab === "users" && <AdminUsersTab />}
					{activeTab === "settings" && <AdminShopSettingsTab />}
				</main>
			</div>
		</InvoicesDataProvider>
	);
}
