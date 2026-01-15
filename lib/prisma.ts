import { PrismaClient } from "./generated/prisma";
import { withAccelerate } from "@prisma/extension-accelerate";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const baseClient = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? ["error", "warn"] // Reduced logging for performance
      : ["error"],
});

// Create prisma client with optional Accelerate extension
function createPrismaClient(): PrismaClient {
  if (process.env.DATABASE_URL?.startsWith("prisma://")) {
    // Use Accelerate for prisma:// URLs
    return baseClient.$extends(withAccelerate()) as unknown as PrismaClient;
  }
  return baseClient;
}

export const prisma = createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = baseClient;
  }
}
