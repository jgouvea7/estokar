import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from "next";

const supabaseHost = 'grlnxjoydczvzjupcobe.supabase.co';

function getBackendApiUrl() {
	return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/';
}

function getBackendOrigin() {
	const url = getBackendApiUrl();
	try {
		const parsed = new URL(url);
		return `${parsed.protocol}//${parsed.hostname}`;
	} catch {
		return 'http://localhost:3000';
	}
}

const cspConnectSrc = [
	"'self'",
	'https://grlnxjoydczvzjupcobe.supabase.co',
	'https://*.sentry.io',
	getBackendOrigin(),
].join(' ');

const cspValue = [
	"default-src 'self'",
	"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com",
	"style-src 'self' 'unsafe-inline'",
	"img-src 'self' data: blob: https://grlnxjoydczvzjupcobe.supabase.co",
	"font-src 'self' data:",
  `connect-src ${cspConnectSrc}`,
  "frame-ancestors 'none'",
	"base-uri 'self'",
	"form-action 'self'",
].join('; ');

const nextConfig: NextConfig = {
	async headers() {
		return [
			{
				source: '/:path*',
				headers: [
					{ key: 'Content-Security-Policy', value: cspValue },
					{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
					{ key: 'X-Content-Type-Options', value: 'nosniff' },
					{ key: 'X-Frame-Options', value: 'DENY' },
					{ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
					{ key: 'X-XSS-Protection', value: '0' },
				],
			},
		];
	},
	async rewrites() {
		const backendApiUrl = getBackendApiUrl().replace(/\/$/, '');


		return [
			{
				source: '/api/:path*',
				destination: `${backendApiUrl}/:path*`,
			},
		];
	},
	reactStrictMode: true,
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: supabaseHost,
				port: '',
				pathname: '/storage/v1/object/public/**',
			},
		],
	},
	experimental: {
		optimizePackageImports: ['lucide-react', '@supabase/supabase-js', '@tanstack/react-query'],
	},
};

export default withSentryConfig(nextConfig, {
	// For all available options, see:
	// https://www.npmjs.com/package/@sentry/webpack-plugin#options

	org: "estokar",

	project: "web",

	// Only print logs for uploading source maps in CI
	silent: !process.env.CI,

	// For all available options, see:
	// https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

	// Upload a larger set of source maps for prettier stack traces (increases build time)
	widenClientFileUpload: true,

	// Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
	// This can increase your server load as well as your hosting bill.
	// Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
	// side errors will fail.
	tunnelRoute: "/monitoring",

	webpack: {
		// Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
		// See the following for more information:
		// https://docs.sentry.io/product/crons/
		// https://vercel.com/docs/cron-jobs
		automaticVercelMonitors: true,

		// Tree-shaking options for reducing bundle size
		treeshake: {
			// Automatically tree-shake Sentry logger statements to reduce bundle size
			removeDebugLogging: true,
		},
	}
});
