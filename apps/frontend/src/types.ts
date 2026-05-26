import type { IconType } from "react-icons";

export interface Category {
	id: string;
	name: string;
}

export interface Service {
	id: string;
	name: string;
	description: string;
	category_id: string;
	categories?: Category;
	pricing_type: "hourly" | "fixed" | "contact";
	estimated_hours?: number | null;
	calculated_price?: number | null;
	fixed_price?: number | null;
}

export interface AdminInitialData {
	hourly_rate: number;
	categories: Category[];
	services: Service[];
}

export interface ServiceResponse {
	hourly_rate: number;
	categories: Category[];
	services: Service[];
}

export interface SocialLinkProps {
	name: string;
	href: string;
	icon: IconType;
}

export interface ServiceFormData {
	name: string;
	description: string;
	category_id: string;
	pricing_type: "hourly" | "fixed" | "contact";
	estimated_hours: number;
	fixed_price: number;
}

export type PricingType = "hourly" | "fixed" | "contact";

export type BikeStatus = "available" | "sold" | "draft";

export interface BikeImage {
	id: string;
	listing_id: string;
	image_url: string;
	is_primary: boolean;
	display_order: number;
	created_at: string;
}

export interface BikeListing {
	id: string;
	year: number;
	make: string;
	model: string;
	price: number;
	mileage: number;
	description: string | null;
	status: BikeStatus;
	created_at: string;
	images?: BikeImage[];
}

export interface BikeFormData {
	year: number;
	make: string;
	model: string;
	price: number;
	mileage: number;
	description: string;
	status: BikeStatus;
}
