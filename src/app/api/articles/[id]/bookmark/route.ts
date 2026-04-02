import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { articles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Toggle bookmark
  const article = await db
    .select({ bookmarked: articles.bookmarked })
    .from(articles)
    .where(eq(articles.id, id))
    .limit(1);

  if (!article[0]) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  const newValue = article[0].bookmarked ? 0 : 1;
  await db
    .update(articles)
    .set({ bookmarked: newValue })
    .where(eq(articles.id, id));

  return NextResponse.json({ bookmarked: newValue });
}
