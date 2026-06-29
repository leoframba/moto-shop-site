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

export interface RefetchOptions {
	silent?: boolean;
	includeLineItems?: boolean;
}

export interface InvoicesData {
	isLoading: boolean;
	isInvoicesLoading: boolean;
	users: AdminUser[];
	employees: Employee[];
	bikes: InvoiceBike[];
	services: Service[];
	parts: Part[];
	shopHourlyRate: number;
	shopSettings: ShopSettings;
	invoices: InvoiceWithRelations[];
	setInvoices: React.Dispatch<React.SetStateAction<InvoiceWithRelations[]>>;
	updateShopSettings: (settings: ShopSettings) => void;
	refetch: (options?: RefetchOptions) => Promise<void>;
	refetchUsers: () => Promise<void>;
	refetchBikes: () => Promise<void>;
	refetchEmployees: () => Promise<void>;
	refetchInvoice: (invoiceId: string) => Promise<InvoiceWithRelations | null>;
	ensureInvoiceLinesLoaded: () => Promise<void>;
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
	const [isInvoicesLoading, setIsInvoicesLoading] = useState(enabled);
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

	const refetchUsers = useCallback(async () => {
		try {
			const userRows = await authApiRequest<AdminUser[]>("/api/admin/users", {
				cache: "no-store",
			});
			setUsers(userRows);
		} catch (error) {
			console.error(error);
			toast.error("Failed to load users.");
		}
	}, []);

	const refetchBikes = useCallback(async () => {
		try {
			const bikeRows = await authApiRequest<InvoiceBike[]>("/api/admin/bikes", {
				cache: "no-store",
			});
			setBikes(bikeRows);
		} catch (error) {
			console.error(error);
			toast.error("Failed to load bikes.");
		}
	}, []);

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

	const refetchInvoice = useCallback(async (invoiceId: string) => {
		try {
			const invoice = await authApiRequest<InvoiceWithRelations>(
				`/api/admin/invoices/${invoiceId}`,
				{ cache: "no-store" },
			);
			setInvoices((prev) => {
				const existingIndex = prev.findIndex((row) => row.id === invoiceId);
				if (existingIndex === -1) {
					return [invoice, ...prev];
				}
				const next = [...prev];
				next[existingIndex] = invoice;
				return next;
			});
			return invoice;
		} catch (error) {
			console.error(error);
			toast.error("Failed to refresh invoice.");
			return null;
		}
	}, []);

	const ensureInvoiceLinesLoaded = useCallback(async () => {
		try {
			const invoiceRows = await authApiRequest<InvoiceWithRelations[]>(
				"/api/admin/invoices?include_line_items=true",
				{ cache: "no-store" },
			);
			setInvoices(invoiceRows);
		} catch (error) {
			console.error(error);
			toast.error("Failed to load invoice line items.");
		}
	}, []);

	const loadBuilderDependencies = useCallback(async (silent = false) => {
		if (!silent) {
			setIsLoading(true);
		}
		try {
			const [
				userRows,
				employeeRows,
				bikeRows,
				partRows,
				servicesPayload,
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
			setShopSettings({ ...DEFAULT_SHOP_SETTINGS, ...settings });
		} catch (error) {
			console.error(error);
			toast.error("Failed to load invoice dependencies.");
		} finally {
			if (!silent) {
				setIsLoading(false);
			}
		}
	}, []);

	const loadInvoices = useCallback(async (silent = false, includeLineItems = false) => {
		if (!silent) {
			setIsInvoicesLoading(true);
		}
		try {
			const invoiceRows = await authApiRequest<InvoiceWithRelations[]>(
				`/api/admin/invoices?include_line_items=${includeLineItems ? "true" : "false"}`,
				{ cache: "no-store" },
			);
			setInvoices(invoiceRows);
		} catch (error) {
			console.error(error);
			toast.error("Failed to load invoices.");
		} finally {
			if (!silent) {
				setIsInvoicesLoading(false);
			}
		}
	}, []);

	const refetch = useCallback(async (options: RefetchOptions = {}) => {
		const { silent = false, includeLineItems = false } = options;
		if (!silent) {
			setIsLoading(true);
			setIsInvoicesLoading(true);
		}
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
				authApiRequest<InvoiceWithRelations[]>(
					`/api/admin/invoices?include_line_items=${includeLineItems ? "true" : "false"}`,
					{ cache: "no-store" },
				),
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
			if (!silent) {
				setIsLoading(false);
				setIsInvoicesLoading(false);
			}
		}
	}, []);

	useEffect(() => {
		if (!enabled) return;
		void (async () => {
			await loadBuilderDependencies();
			await loadInvoices();
		})();
	}, [enabled, loadBuilderDependencies, loadInvoices]);

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

	const updateShopSettings = useCallback((settings: ShopSettings) => {
		setShopSettings({ ...DEFAULT_SHOP_SETTINGS, ...settings });
	}, []);

	return {
		isLoading,
		isInvoicesLoading,
		users,
		employees,
		bikes,
		services,
		parts,
		shopHourlyRate,
		shopSettings,
		invoices,
		setInvoices,
		updateShopSettings,
		refetch,
		refetchUsers,
		refetchBikes,
		refetchEmployees,
		refetchInvoice,
		ensureInvoiceLinesLoaded,
		addPart,
		addBike,
		addEmployee,
		updateEmployee,
		addUser,
	};
}
