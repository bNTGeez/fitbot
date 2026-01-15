import { PrismaClient } from "./generated/prisma";
import { withAccelerate } from "@prisma/extension-accelerate";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const baseClient = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? ["error", "warn"] // Reduced logging for performance
      : ["error"],
});

// Use Accelerate if DATABASE_URL starts with prisma://
export const prisma = process.env.DATABASE_URL?.startsWith("prisma://")
  ? baseClient.$extends(withAccelerate())
  : baseClient;

if (process.env.NODE_ENV !== "production") {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = baseClient;
  }
}
