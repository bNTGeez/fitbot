"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewChat() {
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load chat history
  useEffect(() => {
    fetch("/api/chat")
      .then((res) => res.json())
      .then((data) => {
        if (data.chats) {
          setChatHistory(data.chats);
        }
      })
      .catch((err) => console.error("Error loading chat history:", err))
      .finally(() => setLoading(false));
  }, []);

  const createNewChat = async () => {
    try {
      const res = await fetch("/api/chat/new", {
        method: "POST",
      });
      const data = await res.json();
      if (data.chat) {
        router.push(`/chat/${data.chat.id}`);
      } else if (data.error) {
        console.error("Cannot create new chat:", data.error);
      }
    } catch (err) {
      console.error("Error creating chat:", err);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-2xl mx-auto p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Chat
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Start a new conversation or continue an existing one.
        </p>

        <div className="space-y-4">
          <button
            onClick={createNewChat}
            className="w-full bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
          >
            {chatHistory.length === 0
              ? "Start Your First Chat"
              : "Start New Chat"}
          </button>

          {chatHistory.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Recent Chats
              </h2>
              <div className="space-y-2">
                {chatHistory.slice(0, 5).map((chat) => (
                  <Link
                    key={chat.id}
                    href={`/chat/${chat.id}`}
                    className="block p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-sm font-medium text-gray-900">
                      Chat #{chat.id}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(
                        chat.messages[0]?.createdAt || chat.createdAt
                      ).toLocaleString()}
                    </div>
                    {chat.messages.length > 0 && (
                      <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {chat.messages[0].content.substring(0, 100)}...
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
