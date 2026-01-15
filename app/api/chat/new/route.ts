export const runtime = "nodejs";

import { ensureUser } from "@/lib/checkUser";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Ensure user exists in database (auto-creates if needed)
    const user = await ensureUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
