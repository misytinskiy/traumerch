import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure proper CSS handling
  experimental: {
    optimizeCss: true,
  },
};

export default nextConfig;
