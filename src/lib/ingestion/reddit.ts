import type { FetchedArticle } from "./rss";

export async function fetchReddit(subredditUrl: string): Promise<FetchedArticle[]> {
  try {
    // Extract subreddit name from URL
    const match = subredditUrl.match(/reddit\.com\/r\/([^/]+)/);
    if (!match) return [];

    const subreddit = match[1];
    const response = await fetch(
      `https://www.reddit.com/r/${subreddit}/hot.json?limit=25`,
      {
        headers: {
          "User-Agent": "PulseAI/1.0",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status}`);
    }

    const data = await response.json();
    const posts = data?.data?.children || [];

    return posts
      .filter(
        (post: { data: { title?: string; url?: string; is_self?: boolean; stickied?: boolean } }) =>
          post.data.title && post.data.url && !post.data.stickied
      )
      .map(
        (post: {
          data: {
            title: string;
            url: string;
            selftext?: string;
            author?: string;
            created_utc?: number;
            score?: number;
          };
        }) => ({
          title: post.data.title,
          url: post.data.url.startsWith("https://www.reddit.com")
            ? post.data.url
            : post.data.url,
          content: post.data.selftext?.slice(0, 500) || "",
          author: post.data.author || null,
          publishedAt: post.data.created_utc
            ? new Date(post.data.created_utc * 1000).toISOString()
            : new Date().toISOString(),
        })
      );
  } catch (error) {
    console.error(`Failed to fetch Reddit: ${subredditUrl}`, error);
    return [];
  }
}
