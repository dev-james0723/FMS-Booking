import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
