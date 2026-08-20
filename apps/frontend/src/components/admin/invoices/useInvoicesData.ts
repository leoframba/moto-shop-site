import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { compareParts } from "@/components/admin/parts/partUtils";
import type {
	AdminUser,
	Employee,
	InvoiceBike,
	InvoiceRecord,
	InvoiceWithRelations,
	Part,
	Service,
	ServiceResponse,
	ShopSettings,
} from "@/types";
import { authApiRequest } from "@/utils/api";
import {
	buildInvoicesListUrl,
	DEFAULT_SHOP_SETTINGS,
	INITIAL_INVOICE_LOAD_STATUSES,
	INVOICE_STATUSES,
	mergeInvoicesById,
} from "./invoiceHelpers";

export interface RefetchOptions {
	silent?: boolean;
	includeLineItems?: boolean;
}

export interface InvoiceRefetchOptions {
	silent?: boolean;
}

export interface LoadInvoicesOptions {
	silent?: boolean;
	includeLineItems?: boolean;
	statuses?: InvoiceRecord["status"][] | null;
	merge?: boolean;
}

export interface InvoicesData {
	isLoading: boolean;
	isInvoicesLoading: boolean;
	isBuilderDepsLoading: boolean;
	isInvoiceLinesLoading: boolean;
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
	refetchInvoice: (
		invoiceId: string,
		options?: InvoiceRefetchOptions,
	) => Promise<InvoiceWithRelations | null>;
	ensureInvoiceLinesLoaded: () => Promise<boolean>;
	ensureBuilderDependenciesLoaded: () => Promise<void>;
	ensureInvoicesForStatuses: (
		statuses: InvoiceRecord["status"][],
	) => Promise<void>;
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
	const [isBuilderDepsLoading, setIsBuilderDepsLoading] = useState(false);
	const [isInvoiceLinesLoading, setIsInvoiceLinesLoading] = useState(false);
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
	const loadedInvoiceStatusesRef = useRef(new Set<InvoiceRecord["status"]>());
	const builderDepsLoadedRef = useRef(false);
	const builderDepsLoadPromiseRef = useRef<Promise<void> | null>(null);

	const markLoadedInvoiceStatuses = useCallback(
		(statuses: InvoiceRecord["status"][]) => {
			for (const status of statuses) {
				loadedInvoiceStatusesRef.current.add(status);
			}
		},
		[],
	);

	const markAllInvoiceStatusesLoaded = useCallback(() => {
		loadedInvoiceStatusesRef.current = new Set(INVOICE_STATUSES);
	}, []);

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

	const refetchInvoice = useCallback(
		async (invoiceId: string, options: InvoiceRefetchOptions = {}) => {
			const silent = options.silent ?? false;
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
				markLoadedInvoiceStatuses([invoice.status]);
				return invoice;
			} catch (error) {
				console.error(error);
				if (!silent) {
					toast.error("Failed to refresh invoice.");
				}
				return null;
			}
		},
		[markLoadedInvoiceStatuses],
	);

	const loadInvoices = useCallback(
		async (options: LoadInvoicesOptions = {}) => {
			const {
				silent = false,
				includeLineItems = false,
				statuses = null,
				merge = false,
			} = options;

			if (!silent) {
				setIsInvoicesLoading(true);
			}
			try {
				const invoiceRows = await authApiRequest<InvoiceWithRelations[]>(
					buildInvoicesListUrl({ includeLineItems, statuses }),
					{ cache: "no-store" },
				);
				setInvoices((prev) =>
					merge ? mergeInvoicesById(prev, invoiceRows) : invoiceRows,
				);
				if (statuses?.length) {
					markLoadedInvoiceStatuses(statuses);
				} else {
					markAllInvoiceStatusesLoaded();
				}
			} catch (error) {
				console.error(error);
				toast.error("Failed to load invoices.");
			} finally {
				if (!silent) {
					setIsInvoicesLoading(false);
				}
			}
		},
		[markAllInvoiceStatusesLoaded, markLoadedInvoiceStatuses],
	);

	const ensureInvoicesForStatuses = useCallback(
		async (statuses: InvoiceRecord["status"][]) => {
			const missingStatuses = statuses.filter(
				(status) => !loadedInvoiceStatusesRef.current.has(status),
			);
			if (missingStatuses.length === 0) return;

			await loadInvoices({
				silent: true,
				includeLineItems: false,
				statuses: missingStatuses,
				merge: true,
			});
		},
		[loadInvoices],
	);

	const ensureInvoiceLinesLoaded = useCallback(async () => {
		setIsInvoiceLinesLoading(true);
		try {
			const invoiceRows = await authApiRequest<InvoiceWithRelations[]>(
				buildInvoicesListUrl({ includeLineItems: true }),
				{ cache: "no-store" },
			);
			setInvoices(invoiceRows);
			markAllInvoiceStatusesLoaded();
			return true;
		} catch (error) {
			console.error(error);
			toast.error("Failed to load invoice line items.");
			return false;
		} finally {
			setIsInvoiceLinesLoading(false);
		}
	}, [markAllInvoiceStatusesLoaded]);

	const loadBuilderDependencies = useCallback(async (silent = false) => {
		if (!silent) {
			setIsBuilderDepsLoading(true);
		}
		try {
			const [employeeRows, partRows, servicesPayload] = await Promise.all([
				authApiRequest<Employee[]>("/api/admin/employees", {
					cache: "no-store",
				}),
				authApiRequest<Part[]>("/api/admin/parts", { cache: "no-store" }),
				authApiRequest<ServiceResponse>("/api/admin/services", {
					cache: "no-store",
				}),
			]);

			setEmployees(employeeRows);
			setParts(partRows);
			setShopHourlyRate(Number(servicesPayload.hourly_rate ?? 0));
			setServices(servicesPayload.services ?? []);
			builderDepsLoadedRef.current = true;
		} catch (error) {
			console.error(error);
			toast.error("Failed to load invoice builder data.");
			throw error;
		} finally {
			if (!silent) {
				setIsBuilderDepsLoading(false);
			}
		}
	}, []);

	const ensureBuilderDependenciesLoaded = useCallback(async () => {
		if (builderDepsLoadedRef.current) return;
		if (builderDepsLoadPromiseRef.current) {
			await builderDepsLoadPromiseRef.current;
			return;
		}

		const loadPromise = loadBuilderDependencies();
		builderDepsLoadPromiseRef.current = loadPromise;
		try {
			await loadPromise;
		} finally {
			builderDepsLoadPromiseRef.current = null;
		}
	}, [loadBuilderDependencies]);

	const loadInitialData = useCallback(async () => {
		setIsLoading(true);
		setIsInvoicesLoading(true);
		try {
			const [userRows, bikeRows, settings, invoiceRows] = await Promise.all([
				authApiRequest<AdminUser[]>("/api/admin/users", { cache: "no-store" }),
				authApiRequest<InvoiceBike[]>("/api/admin/bikes", {
					cache: "no-store",
				}),
				authApiRequest<ShopSettings>("/api/admin/shop-settings", {
					cache: "no-store",
				}),
				authApiRequest<InvoiceWithRelations[]>(
					buildInvoicesListUrl({
						includeLineItems: false,
						statuses: INITIAL_INVOICE_LOAD_STATUSES,
					}),
					{ cache: "no-store" },
				),
			]);

			setUsers(userRows);
			setBikes(bikeRows);
			setShopSettings({ ...DEFAULT_SHOP_SETTINGS, ...settings });
			setInvoices(invoiceRows);
			markLoadedInvoiceStatuses(INITIAL_INVOICE_LOAD_STATUSES);
		} catch (error) {
			console.error(error);
			toast.error("Failed to load invoices.");
		} finally {
			setIsLoading(false);
			setIsInvoicesLoading(false);
		}
	}, [markLoadedInvoiceStatuses]);

	const refetch = useCallback(
		async (options: RefetchOptions = {}) => {
			const { silent = false, includeLineItems = false } = options;
			if (!silent) {
				setIsLoading(true);
				setIsInvoicesLoading(true);
				setIsBuilderDepsLoading(true);
			}
			try {
				const [
					userRows,
					bikeRows,
					settings,
					employeeRows,
					partRows,
					servicesPayload,
					invoiceRows,
				] = await Promise.all([
					authApiRequest<AdminUser[]>("/api/admin/users", { cache: "no-store" }),
					authApiRequest<InvoiceBike[]>("/api/admin/bikes", {
						cache: "no-store",
					}),
					authApiRequest<ShopSettings>("/api/admin/shop-settings", {
						cache: "no-store",
					}),
					authApiRequest<Employee[]>("/api/admin/employees", {
						cache: "no-store",
					}),
					authApiRequest<Part[]>("/api/admin/parts", { cache: "no-store" }),
					authApiRequest<ServiceResponse>("/api/admin/services", {
						cache: "no-store",
					}),
					authApiRequest<InvoiceWithRelations[]>(
						buildInvoicesListUrl({ includeLineItems }),
						{ cache: "no-store" },
					),
				]);

				setUsers(userRows);
				setBikes(bikeRows);
				setShopSettings({ ...DEFAULT_SHOP_SETTINGS, ...settings });
				setEmployees(employeeRows);
				setParts(partRows);
				setShopHourlyRate(Number(servicesPayload.hourly_rate ?? 0));
				setServices(servicesPayload.services ?? []);
				setInvoices(invoiceRows);
				markAllInvoiceStatusesLoaded();
				builderDepsLoadedRef.current = true;
			} catch (error) {
				console.error(error);
				toast.error("Failed to load invoice dependencies.");
			} finally {
				if (!silent) {
					setIsLoading(false);
					setIsInvoicesLoading(false);
					setIsBuilderDepsLoading(false);
				}
			}
		},
		[markAllInvoiceStatusesLoaded],
	);

	useEffect(() => {
		if (!enabled) return;
		void loadInitialData();
	}, [enabled, loadInitialData]);

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
		isBuilderDepsLoading,
		isInvoiceLinesLoading,
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
		ensureBuilderDependenciesLoaded,
		ensureInvoicesForStatuses,
		addPart,
		addBike,
		addEmployee,
		updateEmployee,
		addUser,
	};
}
