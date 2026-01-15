import { auth0 } from "@/lib/auth0";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    return await auth0.middleware(request);
  } catch (error: any) {
    // Log the full error for debugging in Vercel logs
    console.error("Auth0 callback error:", {
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
      url: request.url,
      vercelUrl: process.env.VERCEL_URL,
      auth0BaseUrl: process.env.AUTH0_BASE_URL,
    });

    // Redirect to home with error message
    return NextResponse.redirect(
      new URL(
        `/home?error=auth_failed&message=${encodeURIComponent(
          error?.message || "Authentication failed"
        )}`,
        request.url
      )
    );
  }
}
