"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState, use } from "react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";

interface Message {
  id: number;
  role: string;
  content: string;
  createdAt: string;
}

interface Chat {
  id: number;
  messages: Message[];
}

export default function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: chatId } = use(params);
  const [chat, setChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatHistory, setChatHistory] = useState<Chat[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/agent",
    }),
    onFinish: async (result) => {
      console.log("onFinish called with result:", result);
      // Save assistant message to database
      if (chat?.id) {
        // Get the full text content from the message
        const content =
          result.message.parts
            ?.map((p) => (p.type === "text" ? p.text : ""))
            .join("") || "";

        if (content.trim()) {
          try {
            console.log("Saving assistant message:", content);
            await fetch(`/api/chat?chatId=${chat.id}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                role: "assistant",
                content: content,
              }),
            });
            console.log("Assistant message saved successfully");

            // Refresh chat history
            fetch("/api/chat")
              .then((res) => res.json())
              .then((data) => {
                if (data.chats) {
                  setChatHistory(data.chats);
                }
              });
          } catch (error) {
            console.error("Error saving assistant message:", error);
          }
        } else {
          console.log("No content to save for assistant message");
        }
      } else {
        console.log("No chat ID available for saving assistant message");
      }
    },
  });
  const [input, setInput] = useState("");
  const isGenerating = status !== "ready";
  const lastMessage = messages[messages.length - 1];

  // Load chat history if chatId is provided
  useEffect(() => {
    if (chatId) {
      fetch(`/api/chat?chatId=${chatId}`)
        .then((res) => res.json())
        .then((data) => {
          console.log("Chat loaded:", data);
          if (data.chat) {
            setChat(data.chat);
          }
        })
        .catch((err) => console.error("Error loading chat:", err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [chatId]);

  // Load chat history
  useEffect(() => {
    fetch("/api/chat")
      .then((res) => res.json())
      .then((data) => {
        if (data.chats) {
          setChatHistory(data.chats);
        }
      })
      .catch((err) => console.error("Error loading chat history:", err));
  }, []);

  // Auto-scroll to bottom when messages change or generation status updates.
  const scrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Smoothly scroll to bottom when new content arrives
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isGenerating]);

  // Backup method: Save assistant messages when they appear in the messages array
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "assistant" && chat?.id && !isGenerating) {
      const content =
        lastMessage.parts
          ?.map((p) => (p.type === "text" ? p.text : ""))
          .join("") || "";

      if (content.trim()) {
        console.log(
          "Backup save: Saving assistant message from messages array"
        );
        fetch(`/api/chat?chatId=${chat.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: "assistant",
            content: content,
          }),
        }).catch((error) => console.error("Backup save failed:", error));
      }
    }
  }, [messages, chat?.id, isGenerating]);

  return (
    <div className="h-screen flex">
      {/* Chat History Sidebar */}
      <div
        className={`${
          showHistory ? "w-80" : "w-0"
        } transition-all duration-300 bg-gray-100 border-r border-gray-200 overflow-hidden`}
      >
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Chat History
            </h2>
            <button
              onClick={() => setShowHistory(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <div className="space-y-2">
            <Link
              href="/chat"
              className="block w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-center"
            >
              New Chat
            </Link>
            {chatHistory.map((historyChat) => (
              <div
                key={historyChat.id}
                className={`flex items-center justify-between p-3 rounded-md hover:bg-gray-200 transition-colors ${
                  chat?.id === historyChat.id
                    ? "bg-blue-100 border border-blue-300"
                    : ""
                }`}
              >
                <Link
                  href={`/chat/${historyChat.id}`}
                  className="flex-1 min-w-0"
                >
                  <div className="text-sm font-medium text-gray-900">
                    Chat #{historyChat.id}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(
                      historyChat.messages[0]?.createdAt || Date.now()
                    ).toLocaleString()}
                  </div>
                  {historyChat.messages.length > 0 && (
                    <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {historyChat.messages[0].content.substring(0, 50)}...
                    </div>
                  )}
                </Link>
                <button
                  onClick={async (e) => {
                    e.preventDefault();
                    if (
                      confirm(
                        "Are you sure you want to delete this chat? This action cannot be undone."
                      )
                    ) {
                      try {
                        const response = await fetch(
                          `/api/chat?chatId=${historyChat.id}`,
                          {
                            method: "DELETE",
                          }
                        );

                        if (response.ok) {
                          // Refresh chat history
                          const res = await fetch("/api/chat");
                          const data = await res.json();
                          if (data.chats) {
                            setChatHistory(data.chats);
                          }

                          // If we deleted the current chat, redirect to chat page
                          if (chat?.id === historyChat.id) {
                            window.location.href = "/chat";
                          }
                        } else {
                          alert("Failed to delete chat");
                        }
                      } catch (error) {
                        console.error("Error deleting chat:", error);
                        alert("Error deleting chat");
                      }
                    }
                  }}
                  className="ml-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                  title="Delete chat"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 max-w-4xl mx-auto w-full p-4 flex flex-col">
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="border-b border-gray-200 p-4 bg-gray-50 rounded-t-lg">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="text-gray-600 hover:text-gray-800 p-2 rounded-md hover:bg-gray-200"
                  >
                    ☰
                  </button>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">
                      FitBot Coach
                    </h1>
                    <p className="text-sm text-gray-600">
                      Your personal fitness and nutrition expert
                    </p>
                    {chat && (
                      <p className="text-xs text-gray-500 mt-1">
                        Chat #{chat.id} •{" "}
                        {new Date(
                          chat.messages[0]?.createdAt || Date.now()
                        ).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Messages Area */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50"
            >
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="text-gray-500">Loading chat history...</div>
                </div>
              ) : (
                <>
                  {/* Show existing chat messages */}
                  {chat?.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                          message.role === "user"
                            ? "bg-blue-500 text-white rounded-br-md"
                            : "bg-white border border-gray-200 text-gray-900 rounded-bl-md"
                        }`}
                      >
                        <div className="font-semibold text-xs mb-1 opacity-75">
                          {message.role === "user" ? "You" : "FitBot Coach"}
                        </div>
                        <span>
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Show current session messages */}
                  {messages.map((message, idx) => {
                    const isLast = idx === messages.length - 1;
                    const assistantHasText =
                      message.role === "assistant" &&
                      message.parts?.some(
                        (p) => p.type === "text" && p.text.trim().length > 0
                      );
                    const showInlineSpinner =
                      isGenerating &&
                      isLast &&
                      message.role === "assistant" &&
                      !assistantHasText;

                    const text = message.parts
                      ?.map((p) => (p.type === "text" ? p.text : ""))
                      .join("")
                      .trim();
                    const displayText = text;

                    return (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.role === "user"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                            message.role === "user"
                              ? "bg-blue-500 text-white rounded-br-md"
                              : "bg-white border border-gray-200 text-gray-900 rounded-bl-md"
                          }`}
                        >
                          <div className="font-semibold text-xs mb-1 opacity-75">
                            {message.role === "user" ? "You" : "FitBot Coach"}
                          </div>
                          {showInlineSpinner && (
                            <div className="flex items-center gap-2 text-gray-600 text-xs mb-2">
                              <span className="inline-block h-3 w-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                              Generating response...
                            </div>
                          )}
                          {displayText && (
                            <span>
                              <ReactMarkdown>{displayText}</ReactMarkdown>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {isGenerating &&
                    (!lastMessage || lastMessage.role === "user") && (
                      <div className="p-3 rounded-lg bg-gray-100 mr-8">
                        <div className="font-semibold text-sm mb-1">
                          FitBot Coach
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 text-xs">
                          <span className="inline-block h-3 w-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                          Generating response...
                        </div>
                      </div>
                    )}
                </>
              )}
            </div>

            {/* Chat Input Area */}
            <div className="border-t border-gray-200 p-4 bg-white rounded-b-lg">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (input.trim()) {
                    console.log("Sending message:", input);
                    console.log("Current status:", status);

                    // Save user message to database
                    if (chat?.id) {
                      try {
                        await fetch(`/api/chat?chatId=${chat.id}`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            role: "user",
                            content: input,
                          }),
                        });
                      } catch (error) {
                        console.error("Error saving user message:", error);
                      }
                    }

                    sendMessage({
                      role: "user",
                      parts: [{ type: "text", text: input }],
                    });
                    setInput("");
                  }
                }}
                className="flex gap-3"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={status !== "ready"}
                  placeholder={
                    status !== "ready"
                      ? "Generating response..."
                      : "Type your message here..."
                  }
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={status !== "ready" || !input.trim()}
                  className="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
