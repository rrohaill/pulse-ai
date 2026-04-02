import type { FetchedArticle } from "./rss";

/**
 * Fetches tweets from a Twitter/X profile using multiple RSS bridge services.
 * Falls back through services in order if one fails.
 *
 * URL format stored in DB: https://x.com/elonmusk  (or https://twitter.com/handle)
 * We extract the handle and try RSS bridges.
 */

const RSS_BRIDGES = [
  // RSSHub — most popular open-source RSS bridge
  (handle: string) => `https://rsshub.app/twitter/user/${handle}`,
  // Nitter instances (community maintained)
  (handle: string) => `https://nitter.privacydev.net/${handle}/rss`,
  (handle: string) => `https://nitter.poast.org/${handle}/rss`,
];

/**
 * Extract handle from a Twitter/X URL or plain handle.
 * Accepts:
 *   - @elonmusk
 *   - elonmusk
 *   - https://twitter.com/elonmusk
 *   - https://x.com/elonmusk
 */
export function extractHandle(input: string): string | null {
  // Plain handle
  if (/^@?\w{1,15}$/i.test(input.trim())) {
    return input.trim().replace(/^@/, "");
  }

  // URL pattern
  const match = input.match(
    /(?:twitter\.com|x\.com)\/(@?\w{1,15})\/?/i
  );
  return match ? match[1].replace(/^@/, "") : null;
}

export async function fetchTwitter(
  urlOrHandle: string
): Promise<FetchedArticle[]> {
  const handle = extractHandle(urlOrHandle);
  if (!handle) {
    console.error(`Invalid Twitter handle/URL: ${urlOrHandle}`);
    return [];
  }

  // Try each RSS bridge service in order
  for (const buildUrl of RSS_BRIDGES) {
    const feedUrl = buildUrl(handle);
    try {
      const res = await fetch(feedUrl, {
        headers: { "User-Agent": "PulseAI/1.0" },
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) continue;

      const text = await res.text();

      // Parse the RSS/Atom XML
      const articles = parseRSSXml(text, handle);
      if (articles.length > 0) {
        console.log(
          `Fetched ${articles.length} tweets from @${handle} via ${new URL(feedUrl).hostname}`
        );
        return articles;
      }
    } catch {
      // Try next bridge
      continue;
    }
  }

  // All bridges failed — try scraping the syndication API (public, no auth needed)
  try {
    return await fetchViaSyndication(handle);
  } catch {
    console.warn(`All Twitter bridges failed for @${handle}`);
    return [];
  }
}

/**
 * Twitter's public syndication/timeline endpoint (no API key needed).
 * Works for public accounts. Returns recent tweets as JSON.
 */
async function fetchViaSyndication(
  handle: string
): Promise<FetchedArticle[]> {
  const url = `https://syndication.twitter.com/srv/timeline-profile/screen-name/${handle}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) return [];

  const html = await res.text();

  // Extract tweet text and links from the timeline HTML
  const articles: FetchedArticle[] = [];
  const tweetRegex =
    /<div[^>]*class="[^"]*timeline-Tweet-text[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
  const linkRegex =
    /href="(https:\/\/twitter\.com\/[^"]*\/status\/\d+)"/gi;

  const links: string[] = [];
  let linkMatch;
  while ((linkMatch = linkRegex.exec(html)) !== null) {
    if (!links.includes(linkMatch[1])) {
      links.push(linkMatch[1]);
    }
  }

  let tweetMatch;
  let i = 0;
  while ((tweetMatch = tweetRegex.exec(html)) !== null && i < 25) {
    const text = tweetMatch[1]
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, " ")
      .trim();

    if (text.length < 5) continue;

    articles.push({
      title: text.length > 120 ? text.slice(0, 117) + "..." : text,
      url: links[i] || `https://x.com/${handle}`,
      content: text,
      author: `@${handle}`,
      publishedAt: new Date().toISOString(),
    });
    i++;
  }

  return articles;
}

/**
 * Simple RSS/Atom XML parser for tweets.
 * Handles both RSS 2.0 (<item>) and Atom (<entry>) formats.
 */
function parseRSSXml(xml: string, handle: string): FetchedArticle[] {
  const articles: FetchedArticle[] = [];

  // Try RSS 2.0 <item> format
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];
    const title = extractTag(item, "title");
    const link = extractTag(item, "link") || extractTag(item, "guid");
    const description = extractTag(item, "description") || extractTag(item, "content:encoded");
    const pubDate = extractTag(item, "pubDate") || extractTag(item, "dc:date");

    if (!title && !description) continue;

    const text = stripHtml(description || title || "");
    articles.push({
      title: text.length > 120 ? text.slice(0, 117) + "..." : text,
      url: link || `https://x.com/${handle}`,
      content: text,
      author: `@${handle}`,
      publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
    });
  }

  // If no RSS items, try Atom <entry> format
  if (articles.length === 0) {
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
    while ((match = entryRegex.exec(xml)) !== null) {
      const entry = match[1];
      const title = extractTag(entry, "title");
      const linkMatch = entry.match(/<link[^>]*href="([^"]*)"[^>]*\/?>/);
      const link = linkMatch?.[1];
      const content = extractTag(entry, "content") || extractTag(entry, "summary");
      const published = extractTag(entry, "published") || extractTag(entry, "updated");

      const text = stripHtml(content || title || "");
      if (!text) continue;

      articles.push({
        title: text.length > 120 ? text.slice(0, 117) + "..." : text,
        url: link || `https://x.com/${handle}`,
        content: text,
        author: `@${handle}`,
        publishedAt: published
          ? new Date(published).toISOString()
          : new Date().toISOString(),
      });
    }
  }

  return articles;
}

function extractTag(xml: string, tag: string): string | null {
  // Handle CDATA
  const cdataRegex = new RegExp(
    `<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`,
    "i"
  );
  const cdataMatch = xml.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1].trim();

  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}
