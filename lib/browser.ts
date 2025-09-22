import { chromium, type Browser, type BrowserContext } from "playwright";

let browser: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
  if (browser) {
    return browser;
  }

  browser = await chromium.launch({
    headless: true,
  });
  return browser;
}

export async function newContext(): Promise<BrowserContext> {
  const b = await getBrowser();
  return b.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: {
      width: 1920,
      height: 1080,
    },
    javaScriptEnabled: true,
    locale: "en-US",
  });
}

export async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
  }
}
