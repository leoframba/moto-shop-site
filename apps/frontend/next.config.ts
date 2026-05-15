import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	reactCompiler: true,

	async rewrites() {
		return [
			{
				source: "/api/:path*",
				destination:
					"https://moto-shop-api-276197149194.us-west1.run.app/api/:path*",
			},
		];
	},
};

export default nextConfig;
