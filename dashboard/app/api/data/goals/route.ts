import { NextResponse } from "next/server";
import { getActiveGoals, getGoalProgress } from "@/lib/queries/goals";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const goals = getActiveGoals();
    const goalsWithProgress = goals.map((goal) => ({
      ...goal,
      progress: getGoalProgress(goal),
    }));
    return NextResponse.json(goalsWithProgress);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
