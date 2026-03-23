import { withPayload } from "@payloadcms/next/withPayload";

/** @type {import('next').NextConfig} */
const nextConfig = {
	// Webpack configuration (used when not using --turbopack)
	// Note: Turbopack handles TypeScript/JavaScript extensions automatically,
	// so this config only applies when using Webpack
	webpack: (webpackConfig) => {
		webpackConfig.resolve.extensionAlias = {
			".cjs": [".cts", ".cjs"],
			".js": [".ts", ".tsx", ".js", ".jsx"],
			".mjs": [".mts", ".mjs"],
		};

		return webpackConfig;
	},
	// Turbopack configuration (used when using --turbopack)
	turbopack: {
		resolveExtensions: [
			".tsx",
			".ts",
			".jsx",
			".js",
			".mjs",
			".mts",
			".cjs",
			".cts",
			".json",
		],
	},
};

export default withPayload(nextConfig, { devBundleServerPackages: false });
