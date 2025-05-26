import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
 experimental: {
    // Disable scroll restoration (which can cause animation issues)
    scrollRestoration: false,
  },
  // Add this to prevent unwanted redirects during hydration
  reactStrictMode: false,
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
