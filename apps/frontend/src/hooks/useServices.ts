import { useEffect, useState } from "react";
import type { Service, ServiceResponse } from "@/types";
import { apiRequest } from "@/utils/api";

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

export function useServices() {
	const [data, setData] = useState<ServiceResponse | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [hasError, setHasError] = useState(false);

	useEffect(() => {
		let cancelled = false;

		async function fetchServices() {
			setIsLoading(true);
			setHasError(false);

			try {
				const result = await apiRequest<ServiceResponse>("/api/services", {
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
	}, []);

	return { data, isLoading, hasError };
}
