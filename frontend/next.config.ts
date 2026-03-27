import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["localhost", process.env.NEXT_PUBLIC_API_DOMAIN || ""],
    unoptimized: true,
  },
  async rewrites() {
    const backendHost = process.env.BACKEND_URL || "http://localhost:5000";

    return [
      {
        source: "/api/:path*",
        destination: `${backendHost}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${backendHost}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
