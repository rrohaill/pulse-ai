import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { now } from "@/lib/utils";

export async function GET() {
  const allSettings = await db.select().from(settings);
  const settingsMap: Record<string, string> = {};
  for (const s of allSettings) {
    settingsMap[s.key] = s.value;
  }
  return NextResponse.json({ settings: settingsMap });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();

  for (const [key, value] of Object.entries(body)) {
    await db
      .insert(settings)
      .values({ key, value: String(value), updatedAt: now() })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: String(value), updatedAt: now() },
      });
  }

  return NextResponse.json({ success: true });
}
