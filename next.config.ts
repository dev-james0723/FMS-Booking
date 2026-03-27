import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@prisma/client",
    "prisma",
    "argon2",
    "resend",
    "@google/genai",
  ],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
