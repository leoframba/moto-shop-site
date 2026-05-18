import type { IconType } from "react-icons";

export interface Service {
	id: string | number;
	name: string;
	description: string;
	price?: number;
	estimated_hours: number;
	calculated_price: number;
}

export interface AdminInitialData {
	hourly_rate: number;
	services: Service[];
}

export interface ServiceResponse {
	hourly_rate: number;
	services: Service[];
}

export interface SocialLinkProps {
	name: string;
	href: string;
	icon: IconType;
}
