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
