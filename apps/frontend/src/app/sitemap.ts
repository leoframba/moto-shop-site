import type { MetadataRoute } from "next";
import { createClient } from "@/utils/supabase/server";

const SITE_URL =
	process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.advcycles.com";

const STATIC_PAGES: Array<{
	path: string;
	changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
	priority: number;
}> = [
	{ path: "", changeFrequency: "weekly", priority: 1 },
	{ path: "/services", changeFrequency: "monthly", priority: 0.9 },
	{ path: "/sales", changeFrequency: "daily", priority: 0.9 },
	{ path: "/reviews", changeFrequency: "monthly", priority: 0.7 },
	{ path: "/about", changeFrequency: "monthly", priority: 0.6 },
	{ path: "/contact", changeFrequency: "monthly", priority: 0.6 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const staticEntries: MetadataRoute.Sitemap = STATIC_PAGES.map(
		({ path, changeFrequency, priority }) => ({
			url: `${SITE_URL}${path}`,
			lastModified: new Date(),
			changeFrequency,
			priority,
		}),
	);

	let listingEntries: MetadataRoute.Sitemap = [];
	try {
		const supabase = await createClient();
		const { data } = await supabase
			.from("bike_listings")
			.select("id, updated_at, created_at")
			.neq("status", "draft");

		listingEntries = (data ?? []).map((listing) => ({
			url: `${SITE_URL}/sales/${listing.id}`,
			lastModified: new Date(
				listing.updated_at ?? listing.created_at ?? Date.now(),
			),
			changeFrequency: "weekly" as const,
			priority: 0.8,
		}));
	} catch {
		// If Supabase is unavailable at build time, still publish static URLs.
	}

	return [...staticEntries, ...listingEntries];
}
