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
	is_hidden?: boolean;
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

export interface ShopSettings {
	id: number;
	shop_name?: string | null;
	shop_address?: string | null;
	shop_phone?: string | null;
	shop_email?: string | null;
	hourly_rate: number;
	tax_rate?: number | null;
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

export interface AdminUser {
	id: string;
	email: string;
	first_name?: string | null;
	last_name?: string | null;
	address?: string | null;
	phone_number?: string | null;
	is_admin?: boolean;
}

export interface InvoiceBike {
	id: string;
	owner_id?: string | null;
	year: number;
	make: string;
	model: string;
	vin?: string | null;
	license_plate?: string | null;
	color?: string | null;
	admin_notes?: string | null;
	created_at?: string;
	updated_at?: string;
	owner?: AdminUser | null;
}

export interface InvoiceBikeFormData {
	owner_id: string;
	year: number;
	make: string;
	model: string;
	vin: string;
	license_plate: string;
	color: string;
	admin_notes: string;
}

export interface Part {
	id: string;
	part_number: string | null;
	description: string;
	base_price: number;
	created_at?: string;
	updated_at?: string;
}

export interface PartFormData {
	part_number: string;
	description: string;
	base_price: number;
}

export type InvoiceItemType = "service" | "part";

export type InvoiceStatus =
	| "draft"
	| "estimate"
	| "in_progress"
	| "completed"
	| "paid"
	| "void";

export type LinePricingType = "hourly" | "fixed";

export interface InvoiceLineItemPayload {
	item_type: InvoiceItemType;
	service_id?: string | null;
	part_id?: string | null;
	snapshot_name: string;
	pricing_type?: LinePricingType | null;
	unit_price: number;
	quantity: number;
}

export interface InvoiceCreatePayload {
	owner_id?: string | null;
	bike_id?: string | null;
	status?: InvoiceStatus;
	odometer_in?: number | null;
	odometer_out?: number | null;
	mechanic_notes?: string | null;
	line_items: InvoiceLineItemPayload[];
}

export interface InvoiceRecord {
	id: string;
	invoice_number: number;
	owner_id?: string | null;
	bike_id?: string | null;
	status: InvoiceStatus;
	odometer_in?: number | null;
	odometer_out?: number | null;
	mechanic_notes?: string | null;
	created_at?: string;
}

export interface InvoiceLineItemRecord {
	id: string;
	invoice_id: string;
	item_type: InvoiceItemType;
	service_id?: string | null;
	part_id?: string | null;
	snapshot_name: string;
	pricing_type?: LinePricingType | null;
	unit_price: number;
	quantity: number;
	total_price?: number | null;
	created_at?: string;
}

export type CustomerInvoiceViewLevel = "summary" | "estimate" | "full";

export interface InvoiceWithRelations extends InvoiceRecord {
	owner?: AdminUser | null;
	bike?: InvoiceBike | null;
	line_items: InvoiceLineItemRecord[];
	/** Set by the rider portal API to control detail visibility. */
	customer_view_level?: CustomerInvoiceViewLevel;
}

export interface InvoicePhoto {
	id: string;
	invoice_id?: string;
	caption?: string | null;
	storage_path?: string | null;
	created_at?: string;
	signed_url?: string | null;
}
