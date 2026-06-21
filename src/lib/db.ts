import { PrismaClient } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// Prisma singleton.
//
// In development, Next.js hot-reloads modules on every save. Without this
// guard, each reload would spin up a brand-new PrismaClient and quickly
// exhaust the database connection pool. We cache the instance on the global
// object so it survives reloads. In production, a single instance is created
// per server process as usual.
// ─────────────────────────────────────────────────────────────

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
