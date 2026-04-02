import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sources } from "@/lib/db/schema";
import { generateId, now } from "@/lib/utils";

export async function GET() {
  const allSources = await db.select().from(sources);
  return NextResponse.json({ sources: allSources });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.name || !body.url || !body.type) {
    return NextResponse.json(
      { error: "name, url, and type are required" },
      { status: 400 }
    );
  }

  const newSource = {
    id: generateId(),
    name: body.name,
    type: body.type,
    category: body.category || "ai",
    url: body.url,
    enabled: 1,
    fetchIntervalMinutes: body.fetchIntervalMinutes || 60,
    lastFetchedAt: null,
    createdAt: now(),
  };

  await db.insert(sources).values(newSource);
  return NextResponse.json({ source: newSource }, { status: 201 });
}
