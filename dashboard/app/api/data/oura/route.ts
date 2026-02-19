import { NextRequest, NextResponse } from "next/server";
import { getOuraDays } from "@/lib/queries/oura";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const days = parseInt(request.nextUrl.searchParams.get("days") || "30");
    const data = getOuraDays(days);
    return NextResponse.json(data);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
