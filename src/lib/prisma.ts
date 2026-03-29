import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  /** Set in dev so we can replace the client when Next reloads `.env` without a full server restart. */
  prismaEnvUrl?: string;
  supabasePoolerWarned?: boolean;
};

/** Session-mode Supabase pooler (:5432) exhausts quickly on Vercel; transaction pool uses :6543. */
function warnIfSupabaseSessionPooler(databaseUrl: string) {
  if (process.env.NODE_ENV !== "production") return;
  if (!databaseUrl.includes("pooler.supabase.com")) return;
  if (databaseUrl.includes(":6543")) return;
  if (globalForPrisma.supabasePoolerWarned) return;
  globalForPrisma.supabasePoolerWarned = true;
  console.warn(
    "[prisma] DATABASE_URL looks like Supabase Session pooler (port 5432). On Vercel this often hits MaxClientsInSessionMode. Use the Transaction pool URI on port 6543 with ?pgbouncer=true&connection_limit=1 — see .env.example.",
  );
}

function getPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? "";
  warnIfSupabaseSessionPooler(url);

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
