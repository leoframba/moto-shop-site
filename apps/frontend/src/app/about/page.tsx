import Link from "next/link";

export default function AboutPage() {
	return (
		<div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
			<div className="bg-slate-100 p-8 rounded-full mb-6">
				<span className="text-6xl" role="img" aria-label="wrench">
					🔧
				</span>
			</div>

			<h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
				WIP
			</h1>

			<p className="mt-6 text-lg leading-7 text-slate-600 max-w-xl">
				<strong>ADVCycles</strong>.
			</p>

			<div className="mt-10 flex items-center justify-center gap-x-6">
				<Link
					href="/"
					className="rounded-md bg-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 transition-colors"
				>
					Back to Home
				</Link>

				<Link
					href="/services"
					className="text-sm font-semibold text-slate-900 hover:text-orange-600 transition-colors"
				>
					View Services <span aria-hidden="true">→</span>
				</Link>
			</div>
		</div>
	);
}
