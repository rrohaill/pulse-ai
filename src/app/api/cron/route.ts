import { NextRequest, NextResponse } from "next/server";
import { runIngestionPipeline } from "@/lib/ingestion/orchestrator";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runIngestionPipeline();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Cron ingestion error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ingestion failed" },
      { status: 500 }
    );
  }
}
