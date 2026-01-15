import { prisma } from "@/lib/prisma";
import { auth0 } from "@/lib/auth0";

// Server-side user check (for API routes and server components)
export async function checkUser() {
  const session = await auth0.getSession();
  if (!session?.user) {
    return null;
  }
  return session.user;
}

// Server-side user check with database lookup
export async function checkUserWithDb() {
  const session = await auth0.getSession();
  if (!session?.user) {
    return null;
  }

  try {
    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { auth0Id: session.user.sub },
    });

    return {
      authUser: session.user,
      dbUser,
    };
  } catch (error) {
    console.error("Error checking user with database:", error);
    return {
      authUser: session.user,
      dbUser: null,
    };
  }
}

// Ensure user exists in database (auto-creates if missing)
// This is critical for production - new users need to be created on first use
export async function ensureUser() {
  const authUser = await checkUser();
  if (!authUser) {
    return null;
  }

  try {
    // Try to find existing user
    let user = await prisma.user.findUnique({
      where: { auth0Id: authUser.sub },
    });

    // Create user if doesn't exist
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: authUser.email || "",
          name: authUser.name || null,
          auth0Id: authUser.sub,
        },
      });
    }

    return user;
  } catch (error) {
    console.error("Error ensuring user exists:", error);
    return null;
  }
}
