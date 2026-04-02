import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sources } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.url !== undefined) updates.url = body.url;
  if (body.type !== undefined) updates.type = body.type;
  if (body.enabled !== undefined) updates.enabled = body.enabled;
  if (body.fetchIntervalMinutes !== undefined)
    updates.fetchIntervalMinutes = body.fetchIntervalMinutes;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  await db.update(sources).set(updates).where(eq(sources.id, id));
  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(sources).where(eq(sources.id, id));
  return NextResponse.json({ success: true });
}
