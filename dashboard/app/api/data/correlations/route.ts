import { NextRequest, NextResponse } from "next/server";
import {
  getStressVsSleep,
  getAlcoholVsHrv,
  getExerciseVsReadiness,
  getSleepLevers,
} from "@/lib/queries/correlations";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const type = request.nextUrl.searchParams.get("type") || "stress_vs_sleep";
    const days = parseInt(request.nextUrl.searchParams.get("days") || "30");

    let data;
    switch (type) {
      case "stress_vs_sleep":
        data = getStressVsSleep(days);
        break;
      case "alcohol_vs_hrv":
        data = getAlcoholVsHrv(days);
        break;
      case "exercise_vs_readiness":
        data = getExerciseVsReadiness(days);
        break;
      case "sleep_levers":
        data = getSleepLevers(days);
        break;
      default:
        return NextResponse.json({ error: "Unknown type" }, { status: 400 });
    }

    return NextResponse.json({ type, days, ...data });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
