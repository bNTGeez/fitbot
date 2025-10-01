export const runtime = "nodejs";

import { checkUser } from "@/lib/checkUser";
import { prisma } from "@/lib/prisma";
import {
  getCachedChatHistory,
  setCachedChatHistory,
  invalidateChatCache,
} from "@/lib/chat-cache";
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
          userId: user.id, // Uses Chat_id_userId_idx
        },
        include: {
          messages: {
            orderBy: { createdAt: "asc" }, // Uses Message_chatId_createdAt_idx
            select: {
              id: true,
              role: true,
              content: true,
              createdAt: true,
            },
          },
        },
      });

      if (!chat) {
        return NextResponse.json({ error: "Chat not found" }, { status: 404 });
      }

      return NextResponse.json({ chat });
    } else {
      // Check cache first
      const cached = getCachedChatHistory(user.id.toString());
      if (cached) {
        return NextResponse.json({ chats: cached });
      }

      // Return user's chat history
      const chats = await prisma.chat.findMany({
        where: { userId: user.id },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            take: 1, // Only first message for preview
            select: {
              id: true,
              content: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: "desc" }, // Uses Chat_userId_createdAt_idx
        take: 20, // Limit to recent chats
      });

      // Cache the result
      setCachedChatHistory(user.id.toString(), chats);

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
        userId: user.id, // Uses Chat_id_userId_idx
      },
      select: { id: true }, // Only select what we need
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
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
      },
    });

    // Invalidate cache when new message is added
    invalidateChatCache(user.id.toString());

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Error saving message:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authUser = await checkUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get("chatId");

    if (!chatId) {
      return NextResponse.json(
        { error: "chatId is required" },
        { status: 400 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { auth0Id: authUser.sub },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if chat exists and belongs to user
    const chat = await prisma.chat.findFirst({
      where: {
        id: parseInt(chatId),
        userId: user.id,
      },
    });

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Delete chat and messages
    await prisma.chat.delete({
      where: {
        id: parseInt(chatId),
      },
    });

    // Invalidate cache when chat is deleted
    invalidateChatCache(user.id.toString());

    return NextResponse.json({
      success: true,
      message: "Chat deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting chat:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
