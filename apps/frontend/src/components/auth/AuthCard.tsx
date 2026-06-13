import type { ReactNode } from "react";

interface AuthCardProps {
	title: string;
	subtitle: string;
	children: ReactNode;
	footer?: ReactNode;
}

export default function AuthCard({
	title,
	subtitle,
	children,
	footer,
}: AuthCardProps) {
	return (
		<main className="min-h-screen bg-black flex items-center justify-center p-4">
			<div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl">
				<div className="mb-8">
					<h1 className="text-2xl font-black text-white mb-2 uppercase italic tracking-tighter">
						{title}
					</h1>
					<p className="text-neutral-400 text-sm">{subtitle}</p>
				</div>
				{children}
				{footer ? (
					<div className="mt-6 pt-6 border-t border-neutral-800">{footer}</div>
				) : null}
			</div>
		</main>
	);
}

export const authInputClassName =
	"w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors";

export const authLabelClassName =
	"block text-sm font-medium text-neutral-300 mb-2";
