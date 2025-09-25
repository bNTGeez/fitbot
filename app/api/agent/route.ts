import { createOpenAI } from "@ai-sdk/openai";
import {
  streamText,
  tool,
  convertToModelMessages,
  UIMessage,
  stepCountIs,
} from "ai";
import {
  streamText,
  tool,
  convertToModelMessages,
  UIMessage,
  stepCountIs,
} from "ai";
import { z } from "zod";
import { searchWeb } from "@/lib/tools/search";
import { fetchPageContent } from "@/lib/tools/fetch-page";
import { saveNotesToFile } from "@/lib/tools/save-notes";
import { checkScope } from "@/lib/checks/check-scope";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";

export const maxDuration = 30; // Max 30 seconds for the request
export const runtime = "nodejs";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Simple timeout wrapper so tool calls can't hang the stream
async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string
): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`${label} timed out after ${ms}ms`)),
        ms
      )
    ),
  ]);
}

// Simple hash function for cache keys
function hash(text: string): string {
  return createHash("sha256")
    .update(text.toLowerCase().trim())
    .digest("hex")
    .slice(0, 16);
}

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  // Get the user's question
  const lastMessage = messages[messages.length - 1];
  if (lastMessage?.role !== "user") {
    return new Response("No user message found", { status: 400 });
  }

  const userQuestion =
    lastMessage.parts?.[0]?.type === "text" ? lastMessage.parts[0].text : "";
  const scope = checkScope(userQuestion);

  if (!scope.isInScope) {
    // Return a proper streaming response for out-of-scope queries
    const result = streamText({
      model: openai("gpt-4o-mini"),
      messages: convertToModelMessages(messages),
      system: `You are FitBot. The user asked about something outside of fitness/gym topics. 
      
      Respond with: "${scope.reply}"
      
      Do not use any tools. Just give this exact response.`,
      tools: {}, // No tools for out-of-scope queries
    });

    return result.toUIMessageStreamResponse();
  }

  // 1. Check cache first
  const questionHash = hash(userQuestion);
  const cached = await prisma.cachedAnswer.findUnique({
    where: { questionHash },
    select: { answer: true, expiresAt: true },
  });

  if (cached && (!cached.expiresAt || cached.expiresAt > new Date())) {
    // Cache hit - use AI SDK format but with minimal processing
    console.log("Cache HIT - returning cached response via AI SDK");

    const result = streamText({
      model: openai("gpt-4o-mini"),
      messages: convertToModelMessages(messages),
      system: `You are FitBot. The user asked: "${userQuestion}"
      
      Here is the cached answer: "${cached.answer}"
      
      Respond with the cached answer exactly as provided. Do not use any tools.`,
      tools: {}, // No tools for cached responses
    });

    return result.toUIMessageStreamResponse();
  }

  const result = streamText({
    model: openai("gpt-4o-mini"),
    // Allow up to 6 sequential steps so the model can: search -> fetch 2-3 pages -> answer
    stopWhen: stepCountIs(6),
    system: `You are FitBot, a comprehensive fitness and health expert. When users ask about fitness, nutrition, diet, supplements, or health:

**WORKFLOW:**
1. Use search tool to find relevant information
2. Use fetchPage to get detailed content from 2-3 most promising sources  
3. Base your response on the actual page content you fetch
4. Always cite your sources with specific URLs

Format your response in markdown based on the topic:

### Based on my research:

**Key Information:**
- [Main points from fetched content]
- [Important details from sources]

**Recommendations:**
- [Specific advice from research]
- [Tips and guidelines found]

**Important Notes:**
- [Safety considerations if applicable]
- [When to consult professionals]

### Sources:
- [URL 1] - [what you found there]
- [URL 2] - [what you found there]

Adapt the structure based on whether it's about exercises, nutrition, supplements, or general health advice.`,
    messages: convertToModelMessages(messages),

    tools: {
      search: tool({
        description:
          "Search the web for FITNESS and GYM related information only. Use this for workout routines, exercise form, nutrition, supplements, and health topics.",
        inputSchema: z.object({
          query: z.string().min(2),
          max_results: z.number().int().min(1).max(5).default(3),
        }),
        async execute({ query, max_results }) {
          // Guard with timeout and fallback to empty results
          const results = await withTimeout(
            searchWeb(query, max_results),
            8000,
            "searchWeb"
          ).catch(() => ({ total: 0, query, items: [] }));
          // Guard with timeout and fallback to empty results
          const results = await withTimeout(
            searchWeb(query, max_results),
            8000,
            "searchWeb"
          ).catch(() => ({ total: 0, query, items: [] }));
          return {
            query,
            total: results.total ?? results.items?.length ?? 0,
            items: results.items ?? [],
          };
        },
      }),

      fetchPage: tool({
        description:
          "Fetch and extract fitness/gym content from web pages. Use for fitness articles, workout guides, nutrition info, and exercise research.",
        inputSchema: z.object({ url: z.string() }),
        async execute({ url }) {
          try {
            const page = await withTimeout(
              fetchPageContent(url),
              12000,
              "fetchPageContent"
            );
            return {
              title: page.title,
              url: page.url,
              content: page.content,
              wordCount: page.wordCount,
            };
          } catch (err) {
            // Return a safe fallback so the model can proceed without hanging
            return {
              title: "Fetch failed",
              url,
              content: "",
              wordCount: 0,
            };
          }
          try {
            const page = await withTimeout(
              fetchPageContent(url),
              12000,
              "fetchPageContent"
            );
            return {
              title: page.title,
              url: page.url,
              content: page.content,
              wordCount: page.wordCount,
            };
          } catch (err) {
            // Return a safe fallback so the model can proceed without hanging
            return {
              title: "Fetch failed",
              url,
              content: "",
              wordCount: 0,
            };
          }
        },
      }),

      saveNotes: tool({
        description: "Persist research notes for later.",
        inputSchema: z.object({ notes: z.string().min(1) }),
        async execute({ notes }) {
          const result = await withTimeout(
            saveNotesToFile(notes),
            3000,
            "saveNotesToFile"
          ).catch(() => ({ success: false }));
          const result = await withTimeout(
            saveNotesToFile(notes),
            3000,
            "saveNotesToFile"
          ).catch(() => ({ success: false }));
          return { success: !!result?.success };
        },
      }),
    },
  });

  const response = result.toUIMessageStreamResponse();

  // 3. Save when done
  result.text
    .then(async (full) => {
      if (!full || full.length < 120) return; // ignore trivial replies

      try {
        await prisma.cachedAnswer.upsert({
          where: { questionHash },
          update: {
            answer: full,
            lastUsed: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          },
          create: {
            questionHash,
            originalQuestion: userQuestion,
            answer: full,
            model: "gpt-4o-mini",
            promptVersion: "v1.0.0",
            retrieverVersion: "v1.0.0",
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          },
        });
        console.log("✅ Cached response for:", userQuestion);
      } catch (error) {
        console.warn("Failed to cache response:", error);
      }
    })
    .catch(() => {}); // ignore errors

  return response;
}
