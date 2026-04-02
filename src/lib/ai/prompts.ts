export const SCORING_SYSTEM_PROMPT = `You are an AI/tech news editor. Your job is to score articles for relevance and quality.

Score each article from 0 to 100 based on:
- Novelty (20 pts): Is this genuinely new information or a rehash?
- Technical Depth (25 pts): Does it have substance, or is it surface-level?
- Impact (25 pts): How many people does this affect? Industry-wide > niche.
- Relevance (30 pts): How relevant is this to AI, machine learning, and tech?

Be strict. Most articles should score 30-60. Only truly exceptional content scores 80+.
Clickbait, press releases with no substance, and duplicate coverage should score low.`;

export function buildScoringPrompt(
  articles: { title: string; content: string }[],
  calibrationContext?: string
): string {
  const articleList = articles
    .map(
      (a, i) =>
        `[${i}] Title: ${a.title}\nContent: ${a.content?.slice(0, 300) || "No content available"}`
    )
    .join("\n\n");

  let prompt = `Score the following ${articles.length} articles. Return a JSON object with a "scores" array where each element has "index" (number) and "score" (0-100).

${articleList}`;

  if (calibrationContext) {
    prompt += `\n\nCalibration context from user feedback:\n${calibrationContext}\nAdjust your scoring to better match the user's preferences shown above.`;
  }

  prompt += `\n\nRespond ONLY with valid JSON: {"scores": [{"index": 0, "score": 75}, ...]}`;

  return prompt;
}

export const ENRICHMENT_SYSTEM_PROMPT = `You are an AI news analyst. Given an article title and content, produce a structured analysis.

Your response must be valid JSON with these exact fields:
- "summary": A concise 2-3 sentence summary of the key points
- "importanceRating": Integer 1-5 (1=minor, 5=groundbreaking)
- "whyItMatters": 1-2 sentences explaining the broader significance
- "tags": Array of 2-5 lowercase category tags (e.g., "llm", "computer-vision", "open-source")

Be concise and precise. Focus on what's genuinely new and important.`;

export function buildEnrichmentPrompt(title: string, content: string): string {
  return `Analyze this article:

Title: ${title}
Content: ${content?.slice(0, 1500) || "No content available"}

Respond ONLY with valid JSON matching the required format.`;
}

export const TRENDS_SYSTEM_PROMPT = `You are an AI trends analyst. Given a collection of top-rated articles from the past week, identify 3-5 emerging themes or trends.

Your response must be valid JSON with:
- "summary": A 2-3 paragraph overview of the week in AI/tech
- "themes": Array of objects, each with:
  - "title": Short theme name
  - "description": 2-3 sentences explaining the trend
  - "relatedArticles": Array of article titles that relate to this theme`;

export function buildTrendsPrompt(
  articles: { title: string; summary: string }[]
): string {
  const list = articles
    .map((a) => `- ${a.title}: ${a.summary}`)
    .join("\n");

  return `Here are the top-rated articles from this week:\n\n${list}\n\nIdentify the key themes and trends. Respond ONLY with valid JSON.`;
}
