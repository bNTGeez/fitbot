import { newContext } from "@/lib/browser";

export type PageResult = {
  title: string;
  url: string;
  content: string;
  wordCount: number;
  publishedAt?: string;
};

export async function fetchPageContent(url: string): Promise<PageResult> {
  const context = await newContext();
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
  } catch (error) {
    console.error("Error fetching page:", error);
    throw error;
  }

  const text = await page.evaluate(() => document.body.innerText || "");
  const title = await page.title();
  const content = await page.content();
  const publishedAt = await page.evaluate(() => {
    const dateElement =
      document.querySelector("time[datetime]") ||
      document.querySelector("[data-published]");
    return dateElement?.textContent || "";
  });
  await context.close();
  return {
    title: title.trim(),
    url: url,
    content: content.trim(),
    wordCount: text.split(/\s+/).filter(Boolean).length,
    publishedAt: publishedAt || "",
  };
}
