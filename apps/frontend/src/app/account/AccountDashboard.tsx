"use client";

import type { User } from "@supabase/supabase-js";
import { useState } from "react";
import GarageTab from "@/components/account/GarageTab";
import UserProfileTab from "@/components/account/UserProfileTab";
import UserSidebar, { type AccountTab } from "@/components/account/UserSidebar";
import { isAdminUser } from "@/utils/auth";

interface AccountDashboardProps {
	user: User;
}

export default function AccountDashboard({ user }: AccountDashboardProps) {
	const [activeTab, setActiveTab] = useState<AccountTab>("garage");

	return (
		<div className="flex min-h-screen flex-col bg-neutral-950 font-sans">
			<UserSidebar
				activeTab={activeTab}
				setActiveTab={setActiveTab}
				userEmail={user.email ?? ""}
				isAdmin={isAdminUser(user)}
			/>

			<main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-10">
				{activeTab === "garage" && <GarageTab />}
				{activeTab === "profile" && <UserProfileTab user={user} />}
			</main>
		</div>
	);
}
