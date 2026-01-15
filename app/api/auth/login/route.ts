import { auth0 } from "@/lib/auth0";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  // Log the base URL being used for debugging
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.AUTH0_BASE_URL;
  const callbackUrl = `${baseUrl}/api/auth/callback`;

  console.log("Auth0 login - URLs:", {
    vercelUrl: process.env.VERCEL_URL,
    auth0BaseUrl: process.env.AUTH0_BASE_URL,
    computedBaseUrl: baseUrl,
    callbackUrl: callbackUrl,
    requestOrigin: request.nextUrl.origin,
  });

  return await auth0.startInteractiveLogin({
    returnTo: new URL("/home", request.url).toString(),
  });
}
