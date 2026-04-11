import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [];
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
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "dersplatosu.com",
      },
      {
        protocol: "https",
        hostname: "*.youtube.com",
      },
      {
        protocol: "https",
        hostname: "youtube.com",
      },
      {
        protocol: "https",
        hostname: "i.hizliresim.com",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
      },
      {
        protocol: "https",
        hostname: "**.dersplatosu.com",
      },
      // If the STRAPI_URL is on a domain like strapi.dersplatosu.com, it should be added too.
      // Usually it's covered by the rewrites, but next/image needs the origin.
      {
        protocol: "https",
        hostname: "strapi.dersplatosu.com",
      }
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY", // Prevents clickjacking
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff", // Prevents MIME type sniffing
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()", // Enhances privacy
          },
        ],
      },
    ];
  },
};

export default nextConfig;
