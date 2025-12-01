import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Don't fail build on ESLint errors during production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Don't fail build on TypeScript errors (warnings only)
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
