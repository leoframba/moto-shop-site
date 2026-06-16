"use client";

import type { User } from "@supabase/supabase-js";
import { useState } from "react";
import GarageTab from "@/components/account/GarageTab";
import UserProfileTab from "@/components/account/UserProfileTab";
import UserSidebar, { type AccountTab } from "@/components/account/UserSidebar";

interface AccountDashboardProps {
	user: User;
}

export default function AccountDashboard({ user }: AccountDashboardProps) {
	const [activeTab, setActiveTab] = useState<AccountTab>("garage");

	return (
		<div className="flex flex-col md:flex-row min-h-screen bg-neutral-950 font-sans overflow-hidden">
			<UserSidebar
				activeTab={activeTab}
				setActiveTab={setActiveTab}
				userEmail={user.email ?? ""}
			/>

			<main className="flex-1 p-6 md:p-10 overflow-y-auto max-h-screen pb-24 md:pb-10">
				{activeTab === "garage" && <GarageTab />}
				{activeTab === "profile" && <UserProfileTab user={user} />}
			</main>
		</div>
	);
}
