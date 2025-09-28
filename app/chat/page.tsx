"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

export default function Chat() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/agent",
    }),
  });
  const [input, setInput] = useState("");
  const isGenerating = status !== "ready";
  const lastMessage = messages[messages.length - 1];
  const hasAssistantStarted =
    lastMessage?.role === "assistant" &&
    lastMessage.parts?.some(
      (p) => p.type === "text" && p.text.trim().length > 0
    );

  // Auto-scroll to bottom when messages change or generation status updates.
  const scrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Smoothly scroll to bottom when new content arrives
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isGenerating]);

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 max-w-4xl mx-auto w-full p-4 flex flex-col">
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="border-b border-gray-200 p-4 bg-gray-50 rounded-t-lg">
            <h1 className="text-xl font-bold text-gray-900">
              AI Chat Assistant
            </h1>
            <p className="text-sm text-gray-600">
              Ask me anything about fitness, nutrition, or health!
            </p>
          </div>

          {/* Chat Messages Area */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50"
          >
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
                    message.role === "user" ? "justify-end" : "justify-start"
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
                      {message.role === "user" ? "You" : "AI Assistant"}
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

            {isGenerating && (!lastMessage || lastMessage.role === "user") && (
              <div className="p-3 rounded-lg bg-gray-100 mr-8">
                <div className="font-semibold text-sm mb-1">AI</div>
                <div className="flex items-center gap-2 text-gray-600 text-xs">
                  <span className="inline-block h-3 w-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  Generating response...
                </div>
              </div>
            )}
          </div>

          {/* Chat Input Area */}
          <div className="border-t border-gray-200 p-4 bg-white rounded-b-lg">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (input.trim()) {
                  console.log("Sending message:", input);
                  console.log("Current status:", status);
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
  );
}
