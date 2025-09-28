import { auth0 } from "@/lib/auth0";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return await auth0.startInteractiveLogin({
    returnTo: new URL("/home", request.url).toString(),
  });
}
