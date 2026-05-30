import type { BikeImage } from "@/types";

/**
 * Formats a raw number into a USD currency string (e.g., 12500 -> $12,500)
 */
export const formatPrice = (price: number): string => {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 0,
	}).format(price);
};

/**
 * Sorts an array of bike images ensuring the primary image is always first,
 * followed by the exact display_order set by the admin.
 */
export const sortBikeImages = (images: BikeImage[]): BikeImage[] => {
	return [...images].sort((a, b) => {
		// Primary image always goes to the front
		if (a.is_primary && !b.is_primary) return -1;
		if (!a.is_primary && b.is_primary) return 1;

		// Everything else is sorted by their display_order integer
		return a.display_order - b.display_order;
	});
};
