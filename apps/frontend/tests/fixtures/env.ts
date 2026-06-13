export type TestCredentials = {
	email: string;
	password: string;
};

function parseCredentials(
	emailVar: string,
	passwordVar: string,
): TestCredentials | undefined {
	const email = process.env[emailVar];
	const password = process.env[passwordVar];
	if (!email || !password) return undefined;
	return { email, password };
}

export function getE2eAdminCredentials(): TestCredentials | undefined {
	return parseCredentials("E2E_ADMIN_EMAIL", "E2E_ADMIN_PASSWORD");
}

export function getE2eCustomerCredentials(): TestCredentials | undefined {
	return parseCredentials("E2E_CUSTOMER_EMAIL", "E2E_CUSTOMER_PASSWORD");
}

export type RlsTestEnv = {
	url: string;
	anonKey: string;
	admin: TestCredentials;
	customer: TestCredentials;
};

export function getRlsTestEnv(): RlsTestEnv | undefined {
	const url = process.env.SUPABASE_TEST_URL;
	const anonKey = process.env.SUPABASE_TEST_ANON_KEY;
	const adminEmail = process.env.SUPABASE_TEST_ADMIN_EMAIL;
	const adminPassword = process.env.SUPABASE_TEST_ADMIN_PASSWORD;
	const customerEmail = process.env.SUPABASE_TEST_CUSTOMER_EMAIL;
	const customerPassword = process.env.SUPABASE_TEST_CUSTOMER_PASSWORD;

	if (
		!url ||
		!anonKey ||
		!adminEmail ||
		!adminPassword ||
		!customerEmail ||
		!customerPassword
	) {
		return undefined;
	}

	return {
		url,
		anonKey,
		admin: { email: adminEmail, password: adminPassword },
		customer: { email: customerEmail, password: customerPassword },
	};
}
