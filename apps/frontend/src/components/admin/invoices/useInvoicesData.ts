import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { compareParts } from "@/components/admin/parts/partUtils";
import type {
	AdminUser,
	InvoiceBike,
	InvoiceWithRelations,
	Part,
	Service,
	ServiceResponse,
	ShopSettings,
} from "@/types";
import { apiRequest, authApiRequest } from "@/utils/api";
import { DEFAULT_SHOP_SETTINGS } from "./invoiceHelpers";

export interface InvoicesData {
	isLoading: boolean;
	users: AdminUser[];
	bikes: InvoiceBike[];
	services: Service[];
	parts: Part[];
	shopHourlyRate: number;
	shopSettings: ShopSettings;
	invoices: InvoiceWithRelations[];
	setInvoices: React.Dispatch<React.SetStateAction<InvoiceWithRelations[]>>;
	refetch: () => Promise<void>;
	addPart: (part: Part) => void;
}

export function useInvoicesData(): InvoicesData {
	const [isLoading, setIsLoading] = useState(true);
	const [users, setUsers] = useState<AdminUser[]>([]);
	const [bikes, setBikes] = useState<InvoiceBike[]>([]);
	const [services, setServices] = useState<Service[]>([]);
	const [parts, setParts] = useState<Part[]>([]);
	const [shopHourlyRate, setShopHourlyRate] = useState(0);
	const [shopSettings, setShopSettings] = useState<ShopSettings>(
		DEFAULT_SHOP_SETTINGS,
	);
	const [invoices, setInvoices] = useState<InvoiceWithRelations[]>([]);

	const refetch = useCallback(async () => {
		setIsLoading(true);
		try {
			const [
				userRows,
				bikeRows,
				partRows,
				servicesPayload,
				invoiceRows,
				settings,
			] = await Promise.all([
				authApiRequest<AdminUser[]>("/api/admin/users", { cache: "no-store" }),
				authApiRequest<InvoiceBike[]>("/api/admin/bikes", {
					cache: "no-store",
				}),
				authApiRequest<Part[]>("/api/admin/parts", { cache: "no-store" }),
				apiRequest<ServiceResponse>("/api/services", { cache: "no-store" }),
				authApiRequest<InvoiceWithRelations[]>("/api/admin/invoices", {
					cache: "no-store",
				}),
				authApiRequest<ShopSettings>("/api/admin/shop-settings", {
					cache: "no-store",
				}),
			]);

			setUsers(userRows);
			setBikes(bikeRows);
			setParts(partRows);
			setShopHourlyRate(Number(servicesPayload.hourly_rate ?? 0));
			setServices(servicesPayload.services ?? []);
			setInvoices(invoiceRows);
			setShopSettings({ ...DEFAULT_SHOP_SETTINGS, ...settings });
		} catch (error) {
			console.error(error);
			toast.error("Failed to load invoice dependencies.");
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		void refetch();
	}, [refetch]);

	const addPart = useCallback((part: Part) => {
		setParts((prev) => [...prev, part].sort(compareParts));
	}, []);

	return {
		isLoading,
		users,
		bikes,
		services,
		parts,
		shopHourlyRate,
		shopSettings,
		invoices,
		setInvoices,
		refetch,
		addPart,
	};
}
