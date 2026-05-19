import { createClient } from "./supabase/client";

const CLOUD_RUN_URL = process.env.BACKEND_API_URL || "http://127.0.0.1:8000";

export async function apiRequest<T>(
	endpoint: string,
	options: RequestInit = {},
): Promise<T> {
	const isServer = typeof window === "undefined";

	let url: string;

	if (isServer) {
		url = `${CLOUD_RUN_URL}${endpoint}`;
	} else {
		url = endpoint;
	}

	const config: RequestInit = {
		...options,
		headers: {
			"Content-Type": "application/json",
			...options.headers,
		},
	};

	const res = await fetch(url, config);

	if (!res.ok) {
		const errorData = await res.json().catch(() => ({}));
		const errorMessage =
			errorData.detail ||
			errorData.message ||
			`HTTP error! status: ${res.status}`;
		throw new Error(errorMessage);
	}

	if (res.status === 204) {
		return {} as T;
	}

	return res.json();
}

export async function authApiRequest<T>(
	endpoint: string,
	options: RequestInit = {},
): Promise<T> {
	const supabase = createClient();

	const {
		data: { session },
	} = await supabase.auth.getSession();
	const token = session?.access_token;

	if (!token) {
		throw new Error("Unauthorized: No active session found");
	}

	const config: RequestInit = {
		...options,
		headers: {
			...options.headers,
			Authorization: `Bearer ${token}`,
		},
	};

	return apiRequest<T>(endpoint, config);
}
