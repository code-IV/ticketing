import type { NextConfig } from "next";

const nextConfig = {
  async rewrites() {
    const backendHost = process.env.BACKEND_URL || "http://127.0.0.1:5000";
    return [
      {
        source: "/api/:path*",
        destination: `${backendHost}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
