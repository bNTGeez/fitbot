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
    <div className="max-w-2xl mx-auto p-4 h-screen flex flex-col">
      <h1 className="text-xl font-bold mb-4">AI Chat</h1>

      <div ref={scrollRef} className="flex-1 overflow-y-auto mb-4 space-y-2">
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
              className={`p-3 rounded-lg ${
                message.role === "user"
                  ? "bg-blue-100 ml-8"
                  : "bg-gray-100 mr-8"
              }`}
            >
              <div className="font-semibold text-sm mb-1">
                {message.role === "user" ? "You" : "AI"}
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

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) {
            sendMessage({ text: input });
            setInput("");
          }
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={status !== "ready"}
          placeholder={
            status !== "ready"
              ? "Generating response..."
              : "Type your message..."
          }
          className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={status !== "ready"}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
