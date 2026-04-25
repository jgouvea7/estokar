import type { NextConfig } from "next";

function getBackendApiUrl() {
	return process.env.BACKEND_API_URL ?? 'http://localhost:3000/api';
}

const nextConfig: NextConfig = {
	async rewrites() {
		const backendApiUrl = getBackendApiUrl().replace(/\/$/, '');

		return [
			{
				source: '/api/:path*',
				destination: `${backendApiUrl}/:path*`,
			},
		];
	},
};

export default nextConfig;
