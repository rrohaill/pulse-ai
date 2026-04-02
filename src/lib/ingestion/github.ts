import type { FetchedArticle } from "./rss";

export async function fetchGitHub(repoUrl: string): Promise<FetchedArticle[]> {
  try {
    // Extract owner/repo from URL
    const match = repoUrl.match(/github\.com\/([^/]+\/[^/]+)/);
    if (!match) return [];

    const repo = match[1];
    const response = await fetch(
      `https://api.github.com/repos/${repo}/releases?per_page=10`,
      {
        headers: {
          "User-Agent": "PulseAI/1.0",
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const releases = await response.json();

    return releases
      .filter((r: { name?: string; html_url?: string }) => r.name && r.html_url)
      .map(
        (r: {
          name: string;
          html_url: string;
          body?: string;
          author?: { login?: string };
          published_at?: string;
          tag_name?: string;
        }) => ({
          title: `${repo}: ${r.name || r.tag_name}`,
          url: r.html_url,
          content: (r.body || "").slice(0, 500),
          author: r.author?.login || null,
          publishedAt: r.published_at || new Date().toISOString(),
        })
      );
  } catch (error) {
    console.error(`Failed to fetch GitHub: ${repoUrl}`, error);
    return [];
  }
}
