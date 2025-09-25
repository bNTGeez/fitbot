import { NextRequest, NextResponse } from "next/server";
import { cleanupCache, getCacheStats } from "@/lib/cache-utils";

export async function GET() {
  try {
    const stats = await getCacheStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Failed to get cache stats:", error);
    return NextResponse.json(
      { error: "Failed to get cache statistics" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const answerCacheDays = parseInt(
      searchParams.get("answerCacheDays") || "30"
    );
    const scrapeCacheDays = parseInt(
      searchParams.get("scrapeCacheDays") || "7"
    );
    const minHitCount = parseInt(searchParams.get("minHitCount") || "2");
    const maxAnswerEntries = parseInt(
      searchParams.get("maxAnswerEntries") || "1000"
    );
    const maxScrapeEntries = parseInt(
      searchParams.get("maxScrapeEntries") || "500"
    );

    const result = await cleanupCache({
      answerCacheDays,
      scrapeCacheDays,
      minHitCount,
      maxAnswerEntries,
      maxScrapeEntries,
    });

    return NextResponse.json({
      message: "Cache cleanup completed",
      ...result,
    });
  } catch (error) {
    console.error("Failed to cleanup cache:", error);
    return NextResponse.json(
      { error: "Failed to cleanup cache" },
      { status: 500 }
    );
  }
}
