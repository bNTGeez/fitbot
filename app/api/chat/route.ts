export const runtime = "nodejs";

import { checkUser } from "@/lib/checkUser";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const authUser = await checkUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get("chatId");

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { auth0Id: authUser.sub },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (chatId) {
      // Load specific chat with messages
      const chat = await prisma.chat.findFirst({
        where: {
          id: parseInt(chatId),
          userId: user.id,
        },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!chat) {
        return NextResponse.json({ error: "Chat not found" }, { status: 404 });
      }

      return NextResponse.json({ chat });
    } else {
      // Return user's chat history 
      const chats = await prisma.chat.findMany({
        where: { userId: user.id },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            take: 1, // Only first message for preview
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ chats });
    }
  } catch (error) {
    console.error("Error fetching chat:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await checkUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get("chatId");
    const { role, content } = await req.json();

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { auth0Id: authUser.sub },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!chatId) {
      return NextResponse.json(
        { error: "chatId is required" },
        { status: 400 }
      );
    }

    // Load existing chat
    const chat = await prisma.chat.findFirst({
      where: {
        id: parseInt(chatId),
        userId: user.id,
      },
    });

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Save message
    const message = await prisma.message.create({
      data: {
        chatId: chat.id,
        role,
        content,
      },
    });
    return NextResponse.json({ chat, message });
  } catch (error) {
    console.error("Error saving message:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
