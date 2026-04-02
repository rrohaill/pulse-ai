import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userRatings } from "@/lib/db/schema";
import { generateId, now } from "@/lib/utils";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: articleId } = await params;
  const body = await req.json();
  const rating = body.rating;

  if (typeof rating !== "number" || rating < -1 || rating > 1) {
    return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
  }

  await db.insert(userRatings).values({
    id: generateId(),
    articleId,
    rating,
    createdAt: now(),
  });

  return NextResponse.json({ success: true });
}
