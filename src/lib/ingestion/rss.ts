import Parser from "rss-parser";

const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent": "PulseAI/1.0",
  },
});

export interface FetchedArticle {
  title: string;
  url: string;
  content: string;
  author: string | null;
  publishedAt: string;
}

export async function fetchRSS(feedUrl: string): Promise<FetchedArticle[]> {
  try {
    const feed = await parser.parseURL(feedUrl);
    return (feed.items || [])
      .filter((item) => item.title && item.link)
      .map((item) => ({
        title: item.title!.trim(),
        url: item.link!,
        content: stripHtml(item.contentSnippet || item.content || item.summary || ""),
        author: item.creator || item.author || null,
        publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
      }));
  } catch (error) {
    console.error(`Failed to fetch RSS: ${feedUrl}`, error);
    return [];
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}
