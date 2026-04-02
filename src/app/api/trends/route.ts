import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { trendReports } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { generateWeeklyTrends } from "@/lib/ai/trends";

export async function GET() {
  const trends = await db
    .select()
    .from(trendReports)
    .orderBy(desc(trendReports.createdAt))
    .limit(10);

  return NextResponse.json({ trends });
}

export async function POST() {
  try {
    const summary = await generateWeeklyTrends();
    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Trend generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate trends" },
      { status: 500 }
    );
  }
}
