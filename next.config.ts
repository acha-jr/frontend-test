import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.fallback = {
      canvas: false, // Disable Node.js `canvas` module
    };
    return config;
  },
};

export default nextConfig;
