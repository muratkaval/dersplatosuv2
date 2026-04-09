import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    const raw = process.env.STRAPI_URL || "http://localhost:1340";
    const origin = raw.replace(/\/api\/?$/, "");

    return [
      {
        source: "/admin",
        destination: `${origin}/admin`,
        permanent: false,
      },
      {
        source: "/admin/:path*",
        destination: `${origin}/admin/:path*`,
        permanent: false,
      },
    ];
  },
  async rewrites() {
    const raw = process.env.STRAPI_URL || "http://localhost:1340";
    const origin = raw.replace(/\/api\/?$/, "");

    return [
      {
        source: "/uploads/:path*",
        destination: `${origin}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
