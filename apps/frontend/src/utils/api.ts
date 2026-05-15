const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function apiRequest<T>(
	endpoint: string,
	options: RequestInit = {},
): Promise<T> {
	const url = `${API_BASE_URL}${endpoint}`;

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
		throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
	}

	if (res.status === 204) {
		return {} as T;
	}

	return res.json();
}
