import { newContext } from "@/lib/browser";
import { getCachedSource, cacheScrapedSource } from "@/lib/cache-utils";

export type PageResult = {
  title: string;
  url: string;
  content: string;
  wordCount: number;
  cached?: boolean;
};

export async function fetchPageContent(url: string): Promise<PageResult> {
  // First, check cache
  const cached = await getCachedSource(url);
  if (cached) {
    return {
      title: cached.title || "Cached Content",
      url,
      content: cached.content,
      wordCount: cached.content.split(/\s+/).length,
      cached: true,
    };
  }
  const context = await newContext();
  const page = await context.newPage();


  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(1000);

    const { title, content } = await page.evaluate(() => {
      // Remove noise elements
      document
        .querySelectorAll(
          "nav, header, footer, aside, .sidebar, .ads, .advertisement, .menu, .navigation, .comments, .social-share, .newsletter, .popup, .modal, .cookie-banner, script, style"
        )
        .forEach((el) => el.remove());

      // Content selectors (fitness-optimized)
      const contentSelectors = [
        "article",
        "main",
        "[role='main']",
        ".entry-content",
        ".post-content",
        ".content",
        ".exercise-info",
        ".workout-details",
        ".nutrition-info",
        ".article-content",
        ".article-body",
        ".story-body",
        ".single-content",
        ".post-body",
        ".text-content",
        "#content",
        ".main-content",
        "section",
        "body",
      ];

      let text = "";
      for (const selector of contentSelectors) {
        const el = document.querySelector(selector);
        if (el && el.textContent && el.textContent.trim().length > 200) {
          text = el.textContent;
          break;
        }
      }

      // Clean the text
      const cleanText = text
        .replace(/\s+/g, " ")
        .replace(/\n\s*\n/g, "\n")
        .trim();

      return {
        title: document.title || "Untitled",
        content: cleanText,
      };
    });

    const wordCount = content.split(/\s+/).filter(Boolean).length;
    const finalUrl = page.url();
    const finalTitle = title.trim();

    const result = {
      title: finalTitle,
      url: finalUrl,
      content,
      wordCount,
      cached: false,
    };

    // Cache the scraped content for future use (3 day TTL)
    try {
      await cacheScrapedSource(finalUrl, content, finalTitle, undefined, 3);
    } catch (error) {
      console.warn("Failed to cache scraped content:", error);
    }

    return result;
  } catch (error) {
    console.error("Error fetching page:", error);
    throw error;
  } finally {
    await page.close();
    await context.close();
  }
  } finally {
    await page.close();
    await context.close();
  }
}
