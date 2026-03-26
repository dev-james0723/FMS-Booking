import type { NextConfig } from "next";

const basePath = "/zh-hk/FMS-booking";

const nextConfig: NextConfig = {
  basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  /** Vercel root URL (e.g. fms-booking.vercel.app/) has no page — app lives under basePath. */
  async redirects() {
    return [
      {
        source: "/",
        destination: basePath,
        basePath: false,
        permanent: false,
      },
    ];
  },
  serverExternalPackages: ["@prisma/client", "prisma", "argon2", "resend"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
