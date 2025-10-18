import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (config.resolve.alias as any).canvas = false;
    return config;
  },
};

export default nextConfig;
