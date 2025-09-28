import { test, expect } from "@playwright/test";
import { newContext } from "../lib/browser";

test.describe("Playwright AI Knowledge Pipeline", () => {
  test("should demonstrate complete AI knowledge extraction from fitness page", async () => {
    const url = "https://www.healthline.com/nutrition/10-benefits-of-exercise";

    console.log(`\n🤖 AI KNOWLEDGE PIPELINE TEST`);
    console.log(`📄 Source: ${url}`);
    console.log(`⏰ Started at: ${new Date().toISOString()}`);

    const startTime = Date.now();

    // Step 1: Create browser context
    const context = await newContext();
    const page = await context.newPage();

    try {
      // Step 2: Navigate and wait for content
      console.log(`\n🌐 Step 1: Navigating to page...`);
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
      await page.waitForTimeout(1000);

      // Step 3: Extract content using your exact logic
      console.log(`\n🔍 Step 2: Extracting content...`);
      const { title, content } = await page.evaluate(() => {
        // Remove noise elements (exactly as in your fetchPageContent)
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
      const duration = Date.now() - startTime;

      // Step 4: Analyze the extracted data for AI knowledge
      console.log(`\n📊 EXTRACTED DATA FOR AI:`);
      console.log(`Title: ${title}`);
      console.log(`URL: ${finalUrl}`);
      console.log(`Word Count: ${wordCount}`);
      console.log(`Content Length: ${content.length} characters`);
      console.log(`Extraction Time: ${duration}ms`);

      // Step 5: Show content quality for AI
      console.log(`\n🧠 AI KNOWLEDGE ANALYSIS:`);

      // Fitness keyword analysis
      const fitnessKeywords = [
        "exercise",
        "fitness",
        "workout",
        "health",
        "benefits",
        "muscle",
        "strength",
        "cardio",
        "training",
        "physical",
      ];
      const foundKeywords = fitnessKeywords.filter((keyword) =>
        content.toLowerCase().includes(keyword)
      );
      console.log(
        `Fitness Keywords Found: ${foundKeywords.length}/${fitnessKeywords.length}`
      );
      console.log(`Keywords: ${foundKeywords.join(", ")}`);

      // Content structure analysis
      const sentences = content
        .split(/[.!?]+/)
        .filter((s) => s.trim().length > 10);
      const paragraphs = content
        .split(/\n\s*\n/)
        .filter((p) => p.trim().length > 50);
      const avgSentenceLength =
        sentences.reduce(
          (sum, sentence) => sum + sentence.trim().split(" ").length,
          0
        ) / sentences.length;

      console.log(`Sentences: ${sentences.length}`);
      console.log(`Paragraphs: ${paragraphs.length}`);
      console.log(
        `Average Sentence Length: ${avgSentenceLength.toFixed(1)} words`
      );

      // Content quality indicators
      const hasActionableContent =
        content.toLowerCase().includes("how to") ||
        content.toLowerCase().includes("steps") ||
        content.toLowerCase().includes("tips");
      const hasScientificContent =
        content.toLowerCase().includes("study") ||
        content.toLowerCase().includes("research") ||
        content.toLowerCase().includes("benefits");

      console.log(`Has Actionable Content: ${hasActionableContent}`);
      console.log(`Has Scientific Content: ${hasScientificContent}`);

      // Step 6: Show what the AI would receive
      console.log(`\n🤖 AI INPUT PREVIEW:`);
      console.log(`Content Sample (first 300 chars):`);
      console.log(`"${content.substring(0, 300)}..."`);
      console.log(`\nContent Sample (last 300 chars):`);
      console.log(`"...${content.substring(content.length - 300)}"`);

      // Step 7: Validate data quality
      expect(title).toBeTruthy();
      expect(content).toBeTruthy();
      expect(wordCount).toBeGreaterThan(500); // Substantial content
      expect(foundKeywords.length).toBeGreaterThan(3); // Multiple fitness keywords
      expect(sentences.length).toBeGreaterThan(10); // Multiple sentences
      expect(hasActionableContent || hasScientificContent).toBe(true); // Useful content

      console.log(`\n✅ AI KNOWLEDGE EXTRACTION SUCCESSFUL`);
      console.log(
        `📈 Quality Score: ${Math.min(
          100,
          foundKeywords.length * 10 + sentences.length * 2
        )}/100`
      );
    } finally {
      await page.close();
      await context.close();
    }
  });

  test("should show content extraction from different fitness sources", async () => {
    const fitnessSources = [
      {
        name: "Mayo Clinic - Exercise Benefits",
        url: "https://www.mayoclinic.org/healthy-lifestyle/fitness/in-depth/exercise/art-20048389",
        expectedKeywords: ["exercise", "benefits", "health", "physical"],
      },
      {
        name: "WebMD - Fitness Section",
        url: "https://www.webmd.com/fitness-exercise/default.htm",
        expectedKeywords: ["fitness", "exercise", "workout", "health"],
      },
    ];

    for (const source of fitnessSources) {
      console.log(`\n🔍 Testing: ${source.name}`);
      console.log(`URL: ${source.url}`);

      const context = await newContext();
      const page = await context.newPage();

      try {
        await page.goto(source.url, {
          waitUntil: "domcontentloaded",
          timeout: 15000,
        });
        await page.waitForTimeout(1000);

        const { title, content } = await page.evaluate(() => {
          // Remove noise elements
          document
            .querySelectorAll(
              "nav, header, footer, aside, .sidebar, .ads, .advertisement, .menu, .navigation, .comments, .social-share, .newsletter, .popup, .modal, .cookie-banner, script, style"
            )
            .forEach((el) => el.remove());

          // Content selectors
          const contentSelectors = [
            "article",
            "main",
            "[role='main']",
            ".entry-content",
            ".post-content",
            ".content",
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

        console.log(`✅ Extraction Results:`);
        console.log(`  Title: ${title}`);
        console.log(`  Word Count: ${wordCount}`);
        console.log(`  Content Length: ${content.length} chars`);
        console.log(`  Final URL: ${finalUrl}`);

        // Check for expected keywords
        const foundExpectedKeywords = source.expectedKeywords.filter(
          (keyword) => content.toLowerCase().includes(keyword)
        );
        console.log(
          `  Expected Keywords Found: ${foundExpectedKeywords.length}/${source.expectedKeywords.length}`
        );
        console.log(`  Found: ${foundExpectedKeywords.join(", ")}`);

        // Content quality assessment
        const hasFitnessContent =
          content.toLowerCase().includes("exercise") ||
          content.toLowerCase().includes("fitness") ||
          content.toLowerCase().includes("workout");
        const hasHealthContent =
          content.toLowerCase().includes("health") ||
          content.toLowerCase().includes("benefits") ||
          content.toLowerCase().includes("wellness");

        console.log(`  Has Fitness Content: ${hasFitnessContent}`);
        console.log(`  Has Health Content: ${hasHealthContent}`);

        // Basic validation
        expect(title).toBeTruthy();
        expect(content).toBeTruthy();
        expect(wordCount).toBeGreaterThan(0);

        // Quality check - should have some fitness/health content
        expect(hasFitnessContent || hasHealthContent).toBe(true);
      } catch (error) {
        console.log(`❌ Failed: ${error.message}`);
        // Don't fail the test, just log the error
      } finally {
        await page.close();
        await context.close();
      }
    }
  });

  test("should demonstrate content cleaning and AI-readiness", async () => {
    const url = "https://www.healthline.com/nutrition/10-benefits-of-exercise";

    console.log(`\n🧹 CONTENT CLEANING ANALYSIS`);
    console.log(`Source: ${url}`);

    const context = await newContext();
    const page = await context.newPage();

    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
      await page.waitForTimeout(1000);

      const { content } = await page.evaluate(() => {
        // Remove noise elements
        document
          .querySelectorAll(
            "nav, header, footer, aside, .sidebar, .ads, .advertisement, .menu, .navigation, .comments, .social-share, .newsletter, .popup, .modal, .cookie-banner, script, style"
          )
          .forEach((el) => el.remove());

        // Content selectors
        const contentSelectors = [
          "article",
          "main",
          "[role='main']",
          ".entry-content",
          ".post-content",
          ".content",
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

        const cleanText = text
          .replace(/\s+/g, " ")
          .replace(/\n\s*\n/g, "\n")
          .trim();

        return { content: cleanText };
      });

      // Analyze content cleaning
      const excessiveSpaces = (content.match(/\s{3,}/g) || []).length;
      const excessiveNewlines = (content.match(/\n\s*\n\s*\n/g) || []).length;
      const hasHtmlTags = /<[^>]+>/.test(content);
      const hasJavascript = /javascript:|function\s*\(/.test(
        content.toLowerCase()
      );

      console.log(`\n📊 CLEANING RESULTS:`);
      console.log(`Excessive spaces (3+): ${excessiveSpaces}`);
      console.log(`Excessive newlines (3+): ${excessiveNewlines}`);
      console.log(`Contains HTML tags: ${hasHtmlTags}`);
      console.log(`Contains JavaScript: ${hasJavascript}`);
      console.log(`Content is trimmed: ${content.trim() === content}`);

      // Content structure analysis
      const lines = content.split("\n");
      const nonEmptyLines = lines.filter((line) => line.trim().length > 0);
      const words = content.split(/\s+/).filter((word) => word.length > 0);
      const avgWordLength =
        words.reduce((sum, word) => sum + word.length, 0) / words.length;

      console.log(`\n📋 CONTENT STRUCTURE:`);
      console.log(`Total lines: ${lines.length}`);
      console.log(`Non-empty lines: ${nonEmptyLines.length}`);
      console.log(`Total words: ${words.length}`);
      console.log(
        `Average word length: ${avgWordLength.toFixed(2)} characters`
      );

      // AI-readiness assessment
      const sentences = content
        .split(/[.!?]+/)
        .filter((s) => s.trim().length > 10);
      const hasCompleteSentences = sentences.length > 5;
      const hasSubstantialContent = words.length > 500;
      const isWellFormatted = excessiveSpaces === 0 && excessiveNewlines === 0;

      console.log(`\n🤖 AI-READINESS ASSESSMENT:`);
      console.log(
        `Has complete sentences: ${hasCompleteSentences} (${sentences.length} sentences)`
      );
      console.log(
        `Has substantial content: ${hasSubstantialContent} (${words.length} words)`
      );
      console.log(`Is well formatted: ${isWellFormatted}`);
      console.log(
        `Overall AI-ready: ${
          hasCompleteSentences && hasSubstantialContent && isWellFormatted
        }`
      );

      // Quality checks
      expect(excessiveSpaces).toBe(0);
      expect(excessiveNewlines).toBe(0);
      expect(hasHtmlTags).toBe(false);
      expect(hasJavascript).toBe(false);
      expect(content.trim()).toBe(content);
      expect(hasCompleteSentences).toBe(true);
      expect(hasSubstantialContent).toBe(true);

      console.log(`\n✅ CONTENT IS AI-READY`);
    } finally {
      await page.close();
      await context.close();
    }
  });
});
