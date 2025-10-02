import { auth0 } from "@/lib/auth0";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await auth0.getSession(request);
    return NextResponse.json({ session });
  } catch {
    return NextResponse.json(
      { error: "Failed to get session" },
      { status: 500 }
    );
  }
}
