import { createOpenAI } from "@ai-sdk/openai";
import { streamText, tool, convertToModelMessages, UIMessage } from "ai";
import { z } from "zod";
import { searchWeb } from "@/lib/tools/search";
import { fetchPageContent } from "@/lib/tools/fetch-page";
import { saveNotesToFile } from "@/lib/tools/save-notes";

export const maxDuration = 30; // Max 30 seconds for the request
export const runtime = "edge"; // Run on Vercel's edge runtime for faster responses

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  // Log incoming request
  const lastMessage = messages[messages.length - 1];
  if (lastMessage?.role === "user") {
    console.log(
      `🤖 AI AGENT: Processing request: "${
        lastMessage.content || "No content"
      }"`
    );
    console.log(
      `📝 AI AGENT: Message object:`,
      JSON.stringify(lastMessage, null, 2)
    );
  }

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system:
      "You are a research copilot. When asked to search or find information, ALWAYS use the search tool to get real, current data. Plan briefly. Cite sources with actual links. Don't invent links or information.",
    messages: convertToModelMessages(messages),

    tools: {
      search: tool({
        description: "Search the web for information and return links.",
        inputSchema: z.object({
          query: z.string().min(2),
          max_results: z.number().int().min(1).max(5).default(3),
        }),
        async execute({ query, max_results }) {
          const results = await searchWeb(query, max_results);
          return {
            query,
            total: results.total ?? results.items?.length ?? 0,
            items: results.items ?? [],
          };
        },
      }),

      fetchPage: tool({
        description: "Fetch and extract main content from a web page.",
        inputSchema: z.object({ url: z.string() }),
        async execute({ url }) {
          const page = await fetchPageContent(url);
          return { title: page.title, url: page.url, content: page.content };
        },
      }),

      saveNotes: tool({
        description: "Persist research notes for later.",
        inputSchema: z.object({ notes: z.string().min(1) }),
        async execute({ notes }) {
          const result = await saveNotesToFile(notes);
          return { success: !!result?.success };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
