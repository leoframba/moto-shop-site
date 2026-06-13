import path from "node:path";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "vitest/config";

const rootDir = process.cwd();

// Load test env first, then .env.local
loadEnv({ path: path.join(rootDir, ".env.local") });

export default defineConfig({
	test: {
		environment: "node",
		include: ["tests/integration/**/*.test.ts"],
		testTimeout: 30_000,
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
			"@tests": path.resolve(__dirname, "./tests"),
		},
	},
});
