import { NextRequest, NextResponse } from "next/server";
import { getEntriesGroupedByDay } from "@/lib/queries/log-entries";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const days = parseInt(request.nextUrl.searchParams.get("days") || "7");
    const grouped = getEntriesGroupedByDay(days);
    return NextResponse.json(grouped);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
