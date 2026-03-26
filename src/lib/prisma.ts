import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  /** Set in dev so we can replace the client when Next reloads `.env` without a full server restart. */
  prismaEnvUrl?: string;
};

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
    globalForPrisma.prisma = new PrismaClient({
      log: ["error", "warn"],
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
