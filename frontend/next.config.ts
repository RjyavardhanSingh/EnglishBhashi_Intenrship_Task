import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
 experimental: {
    // Disable scroll restoration (which can cause animation issues)
    scrollRestoration: false,
  },
  // Add this to prevent unwanted redirects during hydration
  reactStrictMode: false
};

export default nextConfig;
