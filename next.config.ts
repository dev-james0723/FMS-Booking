import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["date-fns", "date-fns-tz"],
  },
  serverExternalPackages: [
    "@prisma/client",
    "prisma",
    "argon2",
    "resend",
    "@google/genai",
    "sharp",
  ],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
