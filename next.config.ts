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
  // Ensure CSS is processed correctly
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  // Webpack configuration for CSS handling
  webpack: (config, { isServer }) => {
    // Ensure CSS is handled correctly
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

export default nextConfig;
