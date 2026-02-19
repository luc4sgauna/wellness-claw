import { NextResponse } from "next/server";
import { getStreaks } from "@/lib/queries/streaks";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const streaks = getStreaks();
    return NextResponse.json(streaks);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
