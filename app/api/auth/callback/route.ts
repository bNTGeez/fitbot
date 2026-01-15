import { auth0 } from "@/lib/auth0";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    return await auth0.middleware(request);
  } catch (error) {
    // Log the full error for debugging in Vercel logs
    const errorMessage =
      error instanceof Error ? error.message : "Authentication failed";
    const errorName = error instanceof Error ? error.name : "UnknownError";
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error("Auth0 callback error:", {
      message: errorMessage,
      name: errorName,
      stack: errorStack,
      url: request.url,
      vercelUrl: process.env.VERCEL_URL,
      auth0BaseUrl: process.env.AUTH0_BASE_URL,
    });

    // Redirect to home with error message
    return NextResponse.redirect(
      new URL(
        `/home?error=auth_failed&message=${encodeURIComponent(errorMessage)}`,
        request.url
      )
    );
  }
}
