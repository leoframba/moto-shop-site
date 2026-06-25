import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { compareParts } from "@/components/admin/parts/partUtils";
import type {
	AdminUser,
	Employee,
	InvoiceBike,
	InvoiceWithRelations,
	Part,
	Service,
	ServiceResponse,
	ShopSettings,
} from "@/types";
import { authApiRequest } from "@/utils/api";
import { DEFAULT_SHOP_SETTINGS } from "./invoiceHelpers";

export interface InvoicesData {
	isLoading: boolean;
	users: AdminUser[];
	employees: Employee[];
	bikes: InvoiceBike[];
	services: Service[];
	parts: Part[];
	shopHourlyRate: number;
	shopSettings: ShopSettings;
	invoices: InvoiceWithRelations[];
	setInvoices: React.Dispatch<React.SetStateAction<InvoiceWithRelations[]>>;
	refetch: () => Promise<void>;
	refetchEmployees: () => Promise<void>;
	addPart: (part: Part) => void;
	addBike: (bike: InvoiceBike) => void;
	addEmployee: (employee: Employee) => void;
	updateEmployee: (employee: Employee) => void;
	addUser: (user: AdminUser) => void;
}

interface UseInvoicesDataOptions {
	enabled?: boolean;
}

export function useInvoicesData(
	options: UseInvoicesDataOptions = {},
): InvoicesData {
	const enabled = options.enabled ?? true;
	const [isLoading, setIsLoading] = useState(enabled);
	const [users, setUsers] = useState<AdminUser[]>([]);
	const [employees, setEmployees] = useState<Employee[]>([]);
	const [bikes, setBikes] = useState<InvoiceBike[]>([]);
	const [services, setServices] = useState<Service[]>([]);
	const [parts, setParts] = useState<Part[]>([]);
	const [shopHourlyRate, setShopHourlyRate] = useState(0);
	const [shopSettings, setShopSettings] = useState<ShopSettings>(
		DEFAULT_SHOP_SETTINGS,
	);
	const [invoices, setInvoices] = useState<InvoiceWithRelations[]>([]);

	const refetchEmployees = useCallback(async () => {
		try {
			const employeeRows = await authApiRequest<Employee[]>(
				"/api/admin/employees",
				{ cache: "no-store" },
			);
			setEmployees(employeeRows);
		} catch (error) {
			console.error(error);
			toast.error("Failed to load employees.");
		}
	}, []);

	const refetch = useCallback(async () => {
		setIsLoading(true);
		try {
			const [
				userRows,
				employeeRows,
				bikeRows,
				partRows,
				servicesPayload,
				invoiceRows,
				settings,
			] = await Promise.all([
				authApiRequest<AdminUser[]>("/api/admin/users", { cache: "no-store" }),
				authApiRequest<Employee[]>("/api/admin/employees", {
					cache: "no-store",
				}),
				authApiRequest<InvoiceBike[]>("/api/admin/bikes", {
					cache: "no-store",
				}),
				authApiRequest<Part[]>("/api/admin/parts", { cache: "no-store" }),
				authApiRequest<ServiceResponse>("/api/admin/services", {
					cache: "no-store",
				}),
				authApiRequest<InvoiceWithRelations[]>("/api/admin/invoices", {
					cache: "no-store",
				}),
				authApiRequest<ShopSettings>("/api/admin/shop-settings", {
					cache: "no-store",
				}),
			]);

			setUsers(userRows);
			setEmployees(employeeRows);
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
		if (!enabled) return;
		void refetch();
	}, [enabled, refetch]);

	const addPart = useCallback((part: Part) => {
		setParts((prev) => [...prev, part].sort(compareParts));
	}, []);

	const addBike = useCallback(
		(bike: InvoiceBike) => {
			setBikes((prev) => {
				const owner =
					users.find((user) => user.id === bike.owner_id) ?? bike.owner ?? null;
				const nextBike: InvoiceBike = owner ? { ...bike, owner } : bike;
				return [nextBike, ...prev];
			});
		},
		[users],
	);

	const addEmployee = useCallback((employee: Employee) => {
		setEmployees((prev) => [...prev, employee]);
	}, []);

	const updateEmployee = useCallback((employee: Employee) => {
		setEmployees((prev) =>
			prev.map((current) => (current.id === employee.id ? employee : current)),
		);
	}, []);

	const addUser = useCallback((user: AdminUser) => {
		setUsers((prev) => [user, ...prev]);
	}, []);

	return {
		isLoading,
		users,
		employees,
		bikes,
		services,
		parts,
		shopHourlyRate,
		shopSettings,
		invoices,
		setInvoices,
		refetch,
		refetchEmployees,
		addPart,
		addBike,
		addEmployee,
		updateEmployee,
		addUser,
	};
}
