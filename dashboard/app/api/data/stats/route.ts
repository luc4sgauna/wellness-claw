import { NextResponse } from "next/server";
import { getOverviewStats } from "@/lib/queries/stats";
import { getLatestOura } from "@/lib/queries/oura";
import { getRecentEntries } from "@/lib/queries/log-entries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = getOverviewStats();
    const latestOura = getLatestOura();
    const recentEntries = getRecentEntries(10);
    return NextResponse.json({ ...stats, latestOura, recentEntries });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
