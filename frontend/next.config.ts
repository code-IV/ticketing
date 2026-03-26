import type { NextConfig } from "next";

const nextConfig = {
  async rewrites() {
    const backendHost = process.env.BACKEND_URL;
    return [
      {
        source: "/api/:path*",
        destination: `${backendHost}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
