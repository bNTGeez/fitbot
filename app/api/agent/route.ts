import { createOpenAI } from "@ai-sdk/openai";
import { streamText, tool, convertToModelMessages, UIMessage } from "ai";
import { z } from "zod";
import { searchWeb } from "@/lib/tools/search";
import { fetchPageContent } from "@/lib/tools/fetch-page";
import { saveNotesToFile } from "@/lib/tools/save-notes";
import { checkScope } from "@/lib/checks/check-scope";

export const maxDuration = 30; // Max 30 seconds for the request
export const runtime = "nodejs";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  // Check if the last message is fitness-related
  const lastMessage = messages[messages.length - 1];
  if (lastMessage?.role === "user") {
    const query =
      lastMessage?.parts?.[0]?.type === "text" ? lastMessage.parts[0].text : "";
    const scope = checkScope(query);

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
  }

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: `You are FitBot, a specialized fitness and gym assistant with access to web search tools.

SCOPE: You ONLY help with fitness, gym, bodybuilding, nutrition, workout routines, exercise form, supplements, and health topics.

QUERY FILTERING:
1. First, determine if the user's question relates to fitness/gym/health
2. If OFF-TOPIC (politics, tech, cooking, etc.), politely decline and redirect to fitness topics
3. If ON-TOPIC, proceed with research workflow

RESEARCH WORKFLOW (for fitness topics only):
1. Use search tool to find fitness-related URLs (gym websites, fitness blogs, research studies)
2. Use fetchPage on 2-5 most promising fitness links from search results
3. Analyze fetched content: prioritize fitness expertise, scientific studies, certified trainers
4. Focus on evidence-based information from reputable fitness sources
5. Cite sources with exact URLs from fetched pages

CONTENT PRIORITIES:
- Scientific studies and research papers
- Certified trainer and nutritionist advice
- Reputable fitness websites (bodybuilding.com, examine.com, etc.)
- Medical/health institution guidelines
- Skip low-quality fitness blogs or unverified claims

RESPONSE STYLE:
- Provide actionable fitness advice
- Include safety warnings when appropriate
- Recommend consulting professionals for medical concerns
- Always cite your fitness sources

If asked about non-fitness topics, respond: "I'm FitBot, specialized in fitness and gym topics. I can help with workouts, nutrition, exercise form, supplements, and health-related questions. What fitness topic would you like to know about?"`,
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
          const results = await searchWeb(query, max_results);
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
          const page = await fetchPageContent(url);
          return {
            title: page.title,
            url: page.url,
            content: page.content,
            wordCount: page.wordCount,
            publishedAt: page.publishedAt || null,
          };
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
