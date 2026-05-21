import "server-only";
import Anthropic from "@anthropic-ai/sdk";

const ANTHROPIC_MODEL =
  process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

let client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
    client = new Anthropic({ apiKey });
  }
  return client;
}

export interface LLMCallOptions {
  readonly maxTokens?: number;
  readonly temperature?: number;
  readonly system?: string;
}

/**
 * Convenience wrapper for one-shot text completions.
 * Prompt cache headers are NOT added here — add them in the prompt builders
 * (per claude-api skill guidance) for shared instructions like glossary context.
 */
export async function callSonnet(
  userMessage: string,
  options: LLMCallOptions = {},
): Promise<string> {
  const anthropic = getAnthropicClient();
  const response = await anthropic.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: options.maxTokens ?? 2048,
    temperature: options.temperature ?? 0.2,
    system: options.system,
    messages: [{ role: "user", content: userMessage }],
  });

  const block = response.content[0];
  if (block?.type !== "text") {
    throw new Error("Sonnet returned non-text content block");
  }
  return block.text;
}

export const ANTHROPIC_MODEL_NAME = ANTHROPIC_MODEL;
