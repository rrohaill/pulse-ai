import OpenAI from "openai";

export type AIProvider = "openai" | "ollama";

interface CompletionOptions {
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "json" | "text";
}

export async function getAISettings(): Promise<{
  provider: AIProvider;
  model: string;
  scoreThreshold: number;
}> {
  return {
    provider: (process.env.AI_PROVIDER as AIProvider) || "ollama",
    model: process.env.OLLAMA_MODEL || "llama3.1",
    scoreThreshold: parseInt(process.env.SCORE_THRESHOLD || "60", 10),
  };
}

export async function complete(
  prompt: string,
  systemPrompt: string,
  options: CompletionOptions = {}
): Promise<string> {
  const settings = await getAISettings();

  if (settings.provider === "ollama") {
    return completeOllama(prompt, systemPrompt, settings.model, options);
  }

  return completeOpenAI(prompt, systemPrompt, settings.model, options);
}

async function completeOpenAI(
  prompt: string,
  systemPrompt: string,
  model: string,
  options: CompletionOptions
): Promise<string> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
    temperature: options.temperature ?? 0.3,
    max_tokens: options.maxTokens ?? 2000,
    ...(options.responseFormat === "json" && {
      response_format: { type: "json_object" },
    }),
  });

  return response.choices[0]?.message?.content || "";
}

async function completeOllama(
  prompt: string,
  systemPrompt: string,
  model: string,
  options: CompletionOptions
): Promise<string> {
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
    stream: false,
    options: {
      temperature: options.temperature ?? 0.3,
      num_predict: options.maxTokens ?? 2000,
    },
  };

  if (options.responseFormat === "json") {
    body.format = "json";
  }

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return data.message?.content || "";
}
