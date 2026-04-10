import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["localhost", process.env.NEXT_PUBLIC_API_URL || ""],
    unoptimized: true,
  },
  async rewrites() {
    const backendHost = process.env.NEXT_PUBLIC_API_URL;

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
