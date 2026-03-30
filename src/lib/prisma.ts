import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  /** Set in dev so we can replace the client when Next reloads `.env` without a full server restart. */
  prismaEnvUrl?: string;
};

/**
 * Supabase-style URLs often use `connection_limit=1`, which is correct per serverless instance but
 * starves `next dev` when many RSC + API handlers run in parallel. Bump pool only in development.
 */
function relaxDatabaseUrlForDev(databaseUrl: string): string {
  if (!databaseUrl || process.env.NODE_ENV === "production") return databaseUrl;
  try {
    const u = new URL(databaseUrl);
    if (u.searchParams.get("connection_limit") !== "1") return databaseUrl;
    u.searchParams.set("connection_limit", "10");
    const pt = u.searchParams.get("pool_timeout");
    if (pt == null || Number(pt) < 20) {
      u.searchParams.set("pool_timeout", "30");
    }
    return u.toString();
  } catch {
    return databaseUrl;
  }
}

function getPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? "";

  if (process.env.NODE_ENV === "production") {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = new PrismaClient({ log: ["error"] });
    }
    return globalForPrisma.prisma;
  }

  if (globalForPrisma.prisma && globalForPrisma.prismaEnvUrl !== url) {
    void globalForPrisma.prisma.$disconnect();
    globalForPrisma.prisma = undefined;
    globalForPrisma.prismaEnvUrl = undefined;
  }

  if (!globalForPrisma.prisma) {
    const devUrl = relaxDatabaseUrlForDev(url);
    globalForPrisma.prisma = new PrismaClient({
      log: ["error", "warn"],
      ...(devUrl !== url
        ? { datasources: { db: { url: devUrl } } }
        : {}),
    });
    globalForPrisma.prismaEnvUrl = url;
  }
  return globalForPrisma.prisma;
}

/** Use a Proxy in dev so each access sees the current `DATABASE_URL` after Next env reload. */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, receiver);
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});
