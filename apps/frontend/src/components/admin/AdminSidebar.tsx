import Link from "next/link";

interface AdminSidebarProps {
	activeTab: "services" | "sales";
	setActiveTab: (tab: "services" | "sales") => void;
}

export default function AdminSidebar({
	activeTab,
	setActiveTab,
}: AdminSidebarProps) {
	return (
		<aside className="fixed bottom-0 left-0 w-full z-50 bg-neutral-950 border-t border-neutral-900 md:static md:w-64 md:border-r md:border-t-0 md:bg-neutral-900/50 flex flex-row md:flex-col shrink-0 pb-safe">
			{/* Logo */}
			<div className="p-6 border-b border-neutral-900 hidden md:block">
				<h1 className="text-xl font-black text-white tracking-tighter uppercase italic">
					Shop <span className="text-red-600">Admin</span>
				</h1>
			</div>

			{/* Navigation Tabs*/}
			<nav className="flex-1 flex flex-row md:flex-col p-2 md:p-4 gap-2">
				<button
					type="button"
					onClick={() => setActiveTab("services")}
					className={`flex-1 md:flex-none px-2 md:px-4 py-3 md:py-3 rounded text-xs md:text-sm font-bold uppercase tracking-widest transition-all text-center md:text-left ${
						activeTab === "services"
							? "bg-red-600 text-white shadow-lg"
							: "text-neutral-500 hover:bg-neutral-800 hover:text-white"
					}`}
				>
					Services
				</button>
				<button
					type="button"
					onClick={() => setActiveTab("sales")}
					className={`flex-1 md:flex-none px-2 md:px-4 py-3 md:py-3 rounded text-xs md:text-sm font-bold uppercase tracking-widest transition-all text-center md:text-left ${
						activeTab === "sales"
							? "bg-red-600 text-white shadow-lg"
							: "text-neutral-500 hover:bg-neutral-800 hover:text-white"
					}`}
				>
					Bike Sales
				</button>
			</nav>

			<div className="md:mt-auto p-2 md:p-4 md:border-t border-neutral-900 flex items-center justify-center md:justify-start">
				<Link
					href="/"
					className="text-[10px] md:text-xs text-neutral-500 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-2 text-center md:text-left"
				>
					<span className="hidden md:inline">&larr; Back to Live Site</span>
					<span className="md:hidden">Exit</span>
				</Link>
			</div>
		</aside>
	);
}
