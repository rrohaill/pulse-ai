import { NextResponse } from "next/server";
import { runIngestionPipeline } from "@/lib/ingestion/orchestrator";

export async function POST() {
  try {
    const result = await runIngestionPipeline();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Ingestion error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ingestion failed" },
      { status: 500 }
    );
  }
}
