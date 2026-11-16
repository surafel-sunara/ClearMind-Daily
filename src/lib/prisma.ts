import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const database = globalThis as typeof globalThis & { clearmindDb?: PrismaClient };

export const prisma = database.clearmindDb ?? new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 5, connectionTimeoutMillis: 5000 }),
});

if (process.env.NODE_ENV !== "production") database.clearmindDb = prisma;
