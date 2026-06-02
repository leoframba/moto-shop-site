import Link from "next/link";
import { FaFacebook, FaInstagram } from "react-icons/fa";
import type { SocialLinkProps } from "@/types";

export default function Footer() {
	return (
		<footer className="bg-neutral-950 border-t border-neutral-900 py-16 px-4">
			<div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
				{/* LOCATION */}
				<div className="flex flex-col items-center">
					<h4 className="text-white font-bold uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
						<span aria-hidden="true" className="text-red-600">
							{"///"}
						</span>{" "}
						Location
					</h4>
					{/* GOOGLE MAP */}
					<div className="w-full max-w-[280px] mb-5 h-32 rounded border border-neutral-800 overflow-hidden">
						<iframe
							width="100%"
							height="100%"
							title="ADVCycles Location Map"
							src="https://maps.google.com/maps?q=1135+Old+Bayshore+Highway,+San+Jose,+CA+95112&t=&z=14&ie=UTF8&iwloc=&output=embed"
							className="grayscale opacity-75 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
							loading="lazy"
						/>
					</div>
					<address className="text-neutral-400 leading-relaxed">
						1135 Old Bayshore Highway
						<br />
						San Jose, CA 95112
						<br />
						<a
							href="https://maps.google.com/?q=1135+Old+Bayshore+Highway,+San+Jose,+CA+95112"
							target="_blank"
							rel="noopener noreferrer"
							className="text-red-500 hover:text-red-400 text-sm mt-2 inline-block transition-colors uppercase tracking-wider"
						>
							Get Directions &rarr;
						</a>
					</address>
				</div>

				{/* HOURS */}
				<div className="flex flex-col items-center">
					<h4 className="text-white font-bold uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
						<span aria-hidden="true" className="text-red-600">
							{"///"}
						</span>{" "}
						Hours
					</h4>
					<ul className="text-neutral-400 space-y-2 text-left">
						<li className="flex gap-4">
							<span className="w-32 text-right">Tues - Fri:</span>
							<span className="text-white w-36">9:00 AM - 5:00 PM</span>
						</li>
						<li className="flex gap-4">
							<span className="w-32 text-right">Saturday:</span>
							<span className="text-white w-36">9:30 AM - 2:00 PM</span>
						</li>
						<li className="flex gap-4">
							<span className="w-32 text-right">Sunday - Monday:</span>
							<span className="text-red-500 italic w-36">Closed</span>
						</li>
					</ul>
				</div>

				{/* CONTACT */}
				<div className="flex flex-col items-center">
					<h4 className="text-white font-bold uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
						<span aria-hidden="true" className="text-red-600">
							{"///"}
						</span>{" "}
						Contact
					</h4>
					<div className="text-neutral-400 space-y-2">
						<p>
							<span className="block text-xs uppercase tracking-widest mb-1">
								Jim Davis
							</span>
							<a
								href="tel:+14082990508"
								className="text-2xl font-mono text-white hover:text-red-500 transition-colors"
							>
								(408)299-0508
							</a>
						</p>
						<p className="pt-2">
							<a
								href="mailto:jim@advcycles.com"
								className="hover:text-white transition-colors"
							>
								jim@advcycles.com
							</a>
						</p>
					</div>
				</div>
			</div>

			{/* COPYRIGHT/SOCIALS */}
			<div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-neutral-900 flex flex-col items-center gap-6 text-center">
				<div className="flex gap-8">
					{SOCIAL_LINKS.map((social) => (
						<SocialLink
							key={social.name}
							href={social.href}
							icon={social.icon}
							name={social.name}
						/>
					))}
				</div>
				<p className="text-neutral-600 text-sm uppercase tracking-widest">
					&copy; {new Date().getFullYear()} ADVCycles. All rights reserved.
				</p>
			</div>
		</footer>
	);
}

const SOCIAL_LINKS = [
	{
		name: "Instagram",
		href: "https://www.instagram.com/explore/locations/15907117/advanced-cycle-service/",
		icon: FaInstagram,
	},
	{
		name: "Facebook",
		href: "https://www.facebook.com/profile.php?id=100054527407297",
		icon: FaFacebook,
	},
];

const SocialLink = ({ href, icon: Icon, name }: SocialLinkProps) => (
	<Link
		href={href}
		target="_blank"
		rel="noopener noreferrer"
		className="group flex items-center gap-2 text-neutral-500 hover:text-white transition-colors text-sm uppercase tracking-widest"
	>
		<Icon className="text-lg group-hover:scale-110 transition-transform" />
		<span>{name}</span>
	</Link>
);
