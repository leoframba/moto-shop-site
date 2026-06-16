import { useEffect, useState } from "react";
import type { Service, ServiceResponse } from "@/types";
import { apiRequest, authApiRequest } from "@/utils/api";

interface UseServicesOptions {
	/** Fetch the admin endpoint (includes hidden services). Requires auth. */
	admin?: boolean;
}

export function groupServicesByCategory(
	services: Service[],
	fallbackCategory = "Uncategorized",
): Record<string, Service[]> {
	return services.reduce(
		(acc, service) => {
			const cat = service.categories?.name || fallbackCategory;
			if (!acc[cat]) acc[cat] = [];
			acc[cat].push(service);
			return acc;
		},
		{} as Record<string, Service[]>,
	);
}

export function useServices(options: UseServicesOptions = {}) {
	const { admin = false } = options;
	const [data, setData] = useState<ServiceResponse | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [hasError, setHasError] = useState(false);

	useEffect(() => {
		let cancelled = false;

		async function fetchServices() {
			setIsLoading(true);
			setHasError(false);

			try {
				const result = admin
					? await authApiRequest<ServiceResponse>("/api/admin/services", {
							cache: "no-store",
						})
					: await apiRequest<ServiceResponse>("/api/services", {
							cache: "no-store",
						});
				if (!cancelled) setData(result);
			} catch (error) {
				console.error("Failed to fetch services:", error);
				if (!cancelled) setHasError(true);
			} finally {
				if (!cancelled) setIsLoading(false);
			}
		}

		void fetchServices();

		return () => {
			cancelled = true;
		};
	}, [admin]);

	return { data, isLoading, hasError };
}
