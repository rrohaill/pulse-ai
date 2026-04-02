export const DEFAULT_SOURCES = [
  // AI & Tech
  { name: "OpenAI Blog", type: "rss" as const, category: "ai" as const, url: "https://openai.com/blog/rss.xml" },
  { name: "Anthropic Blog", type: "rss" as const, category: "ai" as const, url: "https://www.anthropic.com/rss.xml" },
  { name: "Google AI Blog", type: "rss" as const, category: "ai" as const, url: "https://blog.google/technology/ai/rss/" },
  { name: "Hacker News (AI)", type: "rss" as const, category: "ai" as const, url: "https://hnrss.org/newest?q=AI+OR+LLM+OR+GPT" },
  { name: "TechCrunch AI", type: "rss" as const, category: "ai" as const, url: "https://techcrunch.com/category/artificial-intelligence/feed/" },
  { name: "The Verge AI", type: "rss" as const, category: "ai" as const, url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml" },
  { name: "MIT Tech Review AI", type: "rss" as const, category: "ai" as const, url: "https://www.technologyreview.com/topic/artificial-intelligence/feed" },
  { name: "Ars Technica AI", type: "rss" as const, category: "ai" as const, url: "https://feeds.arstechnica.com/arstechnica/technology-lab" },
  { name: "Hugging Face Blog", type: "rss" as const, category: "ai" as const, url: "https://huggingface.co/blog/feed.xml" },
  { name: "r/MachineLearning", type: "reddit" as const, category: "ai" as const, url: "https://www.reddit.com/r/MachineLearning" },
  { name: "r/LocalLLaMA", type: "reddit" as const, category: "ai" as const, url: "https://www.reddit.com/r/LocalLLaMA" },
  { name: "r/artificial", type: "reddit" as const, category: "ai" as const, url: "https://www.reddit.com/r/artificial" },

  // World Politics
  { name: "Reuters World", type: "rss" as const, category: "politics" as const, url: "https://feeds.reuters.com/Reuters/worldNews" },
  { name: "BBC World News", type: "rss" as const, category: "politics" as const, url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
  { name: "Al Jazeera", type: "rss" as const, category: "politics" as const, url: "https://www.aljazeera.com/xml/rss/all.xml" },
  { name: "AP News Politics", type: "rss" as const, category: "politics" as const, url: "https://rsshub.app/apnews/topics/politics" },
  { name: "The Guardian World", type: "rss" as const, category: "politics" as const, url: "https://www.theguardian.com/world/rss" },
  { name: "NPR Politics", type: "rss" as const, category: "politics" as const, url: "https://feeds.npr.org/1014/rss.xml" },
  { name: "r/worldnews", type: "reddit" as const, category: "politics" as const, url: "https://www.reddit.com/r/worldnews" },
  { name: "r/geopolitics", type: "reddit" as const, category: "politics" as const, url: "https://www.reddit.com/r/geopolitics" },

  // Twitter/X — AI & Tech
  { name: "@OpenAI", type: "twitter" as const, category: "ai" as const, url: "https://x.com/OpenAI" },
  { name: "@AnthropicAI", type: "twitter" as const, category: "ai" as const, url: "https://x.com/AnthropicAI" },
  { name: "@GoogleDeepMind", type: "twitter" as const, category: "ai" as const, url: "https://x.com/GoogleDeepMind" },
  { name: "@ylecun", type: "twitter" as const, category: "ai" as const, url: "https://x.com/ylecun" },
  { name: "@karpathy", type: "twitter" as const, category: "ai" as const, url: "https://x.com/karpathy" },

  // Twitter/X — Politics
  { name: "@Reuters", type: "twitter" as const, category: "politics" as const, url: "https://x.com/Reuters" },
  { name: "@BBCWorld", type: "twitter" as const, category: "politics" as const, url: "https://x.com/BBCWorld" },
  { name: "@AJEnglish", type: "twitter" as const, category: "politics" as const, url: "https://x.com/AJEnglish" },
];

export const SCORE_COLORS = {
  high: { min: 80, class: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  medium: { min: 60, class: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  low: { min: 0, class: "bg-slate-500/15 text-slate-400 border-slate-500/30" },
} as const;

export const ITEMS_PER_PAGE = 20;
