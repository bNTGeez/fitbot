import { prisma } from "./prisma";
import { createHash } from "crypto";
import type { SourceMetadata, CachedAnswerResult } from "./types";

/**
 * Normalize a question for consistent caching (domain-agnostic)
 * Keep minimal to avoid false positives across different domains
 */
export function normalizeQuestion(question: string): string {
  return (
    question
      .toLowerCase()
      .trim()
      // Remove extra whitespace
      .replace(/\s+/g, " ")
      // Remove punctuation
      .replace(/[?!.,;:]/g, "")
      // Remove common stop words (but keep domain-specific terms)
      .replace(/\b(the|a|an|and|or|but|in|on|at|to|for|of|with|by)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

/**
 * Cache key components for versioning
 */
export type CacheKeyParts = {
  q: string; // normalized question
  model: string; // e.g., 'gpt-4o-mini'
  promptVersion: string; // system prompt template version
  retrieverVersion: string; // embedding model + chunking + topK, etc.
};

/**
 * Build a versioned cache key
 */
export function buildCacheKey(parts: CacheKeyParts): string {
  const key = JSON.stringify(parts);
  return generateHash(key);
}

/**
 * Generate a hash for cache keys
 */
export function generateHash(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}

/**
 * Create TTL date
 */
export function createTTL(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

/**
 * Check if cache entry is expired
 */
export function isExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return false;
  return expiresAt < new Date();
}

// ===== ANSWER CACHE FUNCTIONS =====

/**
 * Get cached answer with soft expiration and stampede protection
 */
export async function getCachedAnswer(
  parts: CacheKeyParts,
  requireFresh: boolean = false
) {
  const questionHash = buildCacheKey(parts);

  const cached = await prisma.cachedAnswer.findUnique({
    where: { questionHash },
  });

  if (!cached) return null;

  const expired = isExpired(cached.expiresAt);

  // If expired and require fresh, return null
  if (expired && requireFresh) {
    return null;
  }

  // Atomic update of usage stats
  try {
    await prisma.cachedAnswer.update({
      where: { id: cached.id },
      data: {
        hitCount: { increment: 1 },
        lastUsed: new Date(),
      },
    });
  } catch (error) {
    // Tolerate race conditions on stats update
    console.warn("Failed to update cache stats:", error);
  }

  // If expired but not requiring fresh, return stale data
  // and trigger background refresh (implement separately)
  return {
    answer: cached.answer,
    sources: cached.sources as unknown as SourceMetadata[],
    hitCount: cached.hitCount + 1,
    originalQuestion: cached.originalQuestion,
    isStale: expired,
    model: cached.model,
    promptVersion: cached.promptVersion,
    retrieverVersion: cached.retrieverVersion,
  } as CachedAnswerResult;
}

/**
 * Cache an answer with versioning and stampede protection
 */
export async function cacheAnswer(
  parts: CacheKeyParts,
  originalQuestion: string,
  answer: string,
  sources?: SourceMetadata[],
  ttlDays: number = 7
) {
  const questionHash = buildCacheKey(parts);
  const expiresAt = createTTL(ttlDays);

  return prisma.$transaction(async (tx) => {
    // Check if already being refreshed to prevent stampedes
    const existing = await tx.cachedAnswer.findUnique({
      where: { questionHash },
      select: { isRefreshing: true },
    });

    if (existing?.isRefreshing) {
      // Another process is already updating, skip
      return null;
    }

    return tx.cachedAnswer.upsert({
      where: { questionHash },
      update: {
        answer,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sources: sources as any,
        model: parts.model,
        promptVersion: parts.promptVersion,
        retrieverVersion: parts.retrieverVersion,
        lastUsed: new Date(),
        expiresAt,
        isRefreshing: false,
      },
      create: {
        questionHash,
        originalQuestion,
        answer,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sources: sources as any,
        model: parts.model,
        promptVersion: parts.promptVersion,
        retrieverVersion: parts.retrieverVersion,
        expiresAt,
      },
    });
  });
}

// ===== SCRAPE CACHE FUNCTIONS =====

/**
 * Get cached scraped content for a URL
 */
export async function getCachedSource(url: string) {
  const urlHash = generateHash(url);

  const cached = await prisma.scrapedSource.findUnique({
    where: { urlHash },
  });

  if (!cached) return null;

  // Check if expired
  if (isExpired(cached.expiresAt)) {
    await prisma.scrapedSource.delete({ where: { id: cached.id } });
    return null;
  }

  // Update usage stats
  await prisma.scrapedSource.update({
    where: { id: cached.id },
    data: {
      hitCount: { increment: 1 },
      lastUsed: new Date(),
    },
  });

  return {
    title: cached.title,
    content: cached.content,
    rawHtml: cached.rawHtml,
    hitCount: cached.hitCount + 1,
    scrapedAt: cached.scrapedAt,
  };
}

/**
 * Cache scraped content
 */
export async function cacheScrapedSource(
  url: string,
  content: string,
  title?: string,
  rawHtml?: string,
  ttlDays: number = 3 // Shorter TTL for scraped content
) {
  const urlHash = generateHash(url);
  const expiresAt = createTTL(ttlDays);

  return prisma.scrapedSource.upsert({
    where: { urlHash },
    update: {
      content,
      title,
      rawHtml,
      lastUsed: new Date(),
      expiresAt,
      hitCount: { increment: 1 },
      contentLength: content.length,
    },
    create: {
      url,
      urlHash,
      content,
      title,
      rawHtml,
      expiresAt,
      contentLength: content.length,
    },
  });
}

// ===== CLEANUP FUNCTIONS =====

/**
 * Smart cache cleanup based on usage patterns
 */
export async function cleanupCache(
  options: {
    answerCacheDays?: number;
    scrapeCacheDays?: number;
    minHitCount?: number;
    maxAnswerEntries?: number;
    maxScrapeEntries?: number;
  } = {}
) {
  const {
    answerCacheDays = 30,
    scrapeCacheDays = 7,
    minHitCount = 2,
    maxAnswerEntries = 1000,
    maxScrapeEntries = 500,
  } = options;

  const answerCutoff = new Date();
  answerCutoff.setDate(answerCutoff.getDate() - answerCacheDays);

  const scrapeCutoff = new Date();
  scrapeCutoff.setDate(scrapeCutoff.getDate() - scrapeCacheDays);

  // Clean expired entries
  const [expiredAnswers, expiredScrapes] = await Promise.all([
    prisma.cachedAnswer.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    }),
    prisma.scrapedSource.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    }),
  ]);

  // Clean old unpopular entries
  const [unpopularAnswers, unpopularScrapes] = await Promise.all([
    prisma.cachedAnswer.deleteMany({
      where: {
        AND: [
          { lastUsed: { lt: answerCutoff } },
          { hitCount: { lt: minHitCount } },
        ],
      },
    }),
    prisma.scrapedSource.deleteMany({
      where: {
        AND: [
          { lastUsed: { lt: scrapeCutoff } },
          { hitCount: { lt: minHitCount } },
        ],
      },
    }),
  ]);

  // Size-based cleanup (keep most popular)
  const [answerCount, scrapeCount] = await Promise.all([
    prisma.cachedAnswer.count(),
    prisma.scrapedSource.count(),
  ]);

  let sizeLimitAnswers = { count: 0 };
  let sizeLimitScrapes = { count: 0 };

  if (answerCount > maxAnswerEntries) {
    const keepAnswers = await prisma.cachedAnswer.findMany({
      select: { id: true },
      orderBy: [{ hitCount: "desc" }, { lastUsed: "desc" }],
      take: maxAnswerEntries,
    });

    sizeLimitAnswers = await prisma.cachedAnswer.deleteMany({
      where: { id: { notIn: keepAnswers.map((a: { id: number }) => a.id) } },
    });
  }

  if (scrapeCount > maxScrapeEntries) {
    const keepScrapes = await prisma.scrapedSource.findMany({
      select: { id: true },
      orderBy: [{ hitCount: "desc" }, { lastUsed: "desc" }],
      take: maxScrapeEntries,
    });

    sizeLimitScrapes = await prisma.scrapedSource.deleteMany({
      where: { id: { notIn: keepScrapes.map((s: { id: number }) => s.id) } },
    });
  }

  return {
    answers: {
      expired: expiredAnswers.count,
      unpopular: unpopularAnswers.count,
      sizeLimit: sizeLimitAnswers.count,
      total:
        expiredAnswers.count + unpopularAnswers.count + sizeLimitAnswers.count,
    },
    scrapes: {
      expired: expiredScrapes.count,
      unpopular: unpopularScrapes.count,
      sizeLimit: sizeLimitScrapes.count,
      total:
        expiredScrapes.count + unpopularScrapes.count + sizeLimitScrapes.count,
    },
  };
}

/**
 * Get cache statistics
 */
export async function getCacheStats() {
  const [answerStats, scrapeStats] = await Promise.all([
    prisma.cachedAnswer.aggregate({
      _count: { id: true },
      _sum: { hitCount: true },
      _avg: { hitCount: true },
    }),
    prisma.scrapedSource.aggregate({
      _count: { id: true },
      _sum: { hitCount: true },
      _avg: { hitCount: true },
    }),
  ]);

  const [popularAnswers, recentScrapes] = await Promise.all([
    prisma.cachedAnswer.findMany({
      select: {
        originalQuestion: true,
        hitCount: true,
        lastUsed: true,
        createdAt: true,
      },
      orderBy: { hitCount: "desc" },
      take: 10,
    }),
    prisma.scrapedSource.findMany({
      select: {
        url: true,
        hitCount: true,
        lastUsed: true,
        contentLength: true,
      },
      orderBy: { lastUsed: "desc" },
      take: 10,
    }),
  ]);

  return {
    answers: {
      total: answerStats._count.id,
      totalHits: answerStats._sum.hitCount || 0,
      avgHits: Math.round((answerStats._avg.hitCount || 0) * 100) / 100,
      popular: popularAnswers,
    },
    scrapes: {
      total: scrapeStats._count.id,
      totalHits: scrapeStats._sum.hitCount || 0,
      avgHits: Math.round((scrapeStats._avg.hitCount || 0) * 100) / 100,
      recent: recentScrapes,
    },
  };
}
