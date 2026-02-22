import { NextResponse } from "next/server";
import { getGoals } from "@/lib/queries/goals";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const goals = getGoals();
    return NextResponse.json(goals);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
