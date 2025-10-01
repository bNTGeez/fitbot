export const runtime = "nodejs";

import { checkUser } from "@/lib/checkUser";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const authUser = await checkUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { auth0Id: authUser.sub },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create new chat
    const newChat = await prisma.chat.create({
      data: {
        userId: user.id,
      },
      include: {
        messages: true,
      },
    });

    return NextResponse.json({ chat: newChat });
  } catch (error) {
    console.error("Error creating new chat:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
