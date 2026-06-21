"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from "react";
import { useInvoicesData, type InvoicesData } from "./useInvoicesData";

interface InvoicesDataContextValue extends InvoicesData {
	ensureLoaded: () => void;
	hasLoaded: boolean;
}

const InvoicesDataContext = createContext<InvoicesDataContextValue | null>(
	null,
);

export function InvoicesDataProvider({ children }: { children: ReactNode }) {
	const [loadRequested, setLoadRequested] = useState(false);
	const ensureLoaded = useCallback(() => {
		setLoadRequested(true);
	}, []);
	const data = useInvoicesData({ enabled: loadRequested });

	const value = useMemo<InvoicesDataContextValue>(
		() => ({
			...data,
			isLoading: !loadRequested || data.isLoading,
			ensureLoaded,
			hasLoaded: loadRequested,
		}),
		[data, ensureLoaded, loadRequested],
	);

	return (
		<InvoicesDataContext.Provider value={value}>
			{children}
		</InvoicesDataContext.Provider>
	);
}

export function useInvoicesDataContext(): InvoicesDataContextValue {
	const context = useContext(InvoicesDataContext);
	if (!context) {
		throw new Error(
			"useInvoicesDataContext must be used within InvoicesDataProvider",
		);
	}

	useEffect(() => {
		context.ensureLoaded();
	}, [context.ensureLoaded]);

	return context;
}
