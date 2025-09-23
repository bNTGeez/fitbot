import { newContext } from "@/lib/browser";

export type PageResult = {
  title: string;
  url: string;
  content: string;
  wordCount: number;
};

export async function fetchPageContent(url: string): Promise<PageResult> {
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

    return {
      title: title.trim(),
      url: page.url(),
      content,
      wordCount,
    };
  } catch (error) {
    console.error("Error fetching page:", error);
    throw error;
  } finally {
    await page.close();
    await context.close();
  }
}
