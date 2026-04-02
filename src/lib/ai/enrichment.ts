import { complete } from "./provider";
import { ENRICHMENT_SYSTEM_PROMPT, buildEnrichmentPrompt } from "./prompts";
import type { EnrichmentResult } from "@/lib/types";

export async function enrichArticle(
  title: string,
  content: string
): Promise<EnrichmentResult> {
  const prompt = buildEnrichmentPrompt(title, content);

  try {
    const response = await complete(prompt, ENRICHMENT_SYSTEM_PROMPT, {
      responseFormat: "json",
      temperature: 0.3,
    });

    const parsed = JSON.parse(response);

    return {
      summary: parsed.summary || "Summary unavailable",
      importanceRating: Math.min(5, Math.max(1, parsed.importanceRating || 3)),
      whyItMatters: parsed.whyItMatters || "",
      tags: Array.isArray(parsed.tags)
        ? parsed.tags.slice(0, 5).map((t: string) => t.toLowerCase())
        : [],
    };
  } catch (error) {
    console.error("Enrichment failed:", error);
    return {
      summary: "Enrichment failed - original content available",
      importanceRating: 3,
      whyItMatters: "",
      tags: [],
    };
  }
}
