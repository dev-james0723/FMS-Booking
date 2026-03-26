import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "prisma", "argon2", "resend"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
