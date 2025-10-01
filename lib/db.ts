import { prisma } from "@/lib/prisma";
import { auth0 } from "./auth0";

export async function getCurrentUser() {
  const session = await auth0.getSession();
  if (!session?.user) {
    return null;
  }
  return session.user;
}

export async function upsertUser(user: any) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { auth0Id: user.sub },
    });

    if (existingUser) {
      return existingUser;
    }

    // Create new user if doesn't exist
    const newUser = await prisma.user.create({
      data: {
        email: user.email,
        name: user.name,
        auth0Id: user.sub,
      },
    });

    return newUser;
  } catch (error) {
    console.error("Error upserting user:", error);
    throw error;
  }
}
