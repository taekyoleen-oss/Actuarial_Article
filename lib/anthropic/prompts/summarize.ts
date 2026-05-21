import "server-only";
import { getAnthropicClient, ANTHROPIC_MODEL_NAME } from "../client";
import { SUMMARIZATION_STYLE_GUIDE } from "./system";
import { SummarizationOutput } from "../schemas";

export interface SummarizeOptions {
  readonly sourceText: string;
  readonly title: string;
  readonly maxTokens?: number;
}

export async function summarizeForKorea(opts: SummarizeOptions) {
  const anthropic = getAnthropicClient();
  const response = await anthropic.messages.create({
    model: ANTHROPIC_MODEL_NAME,
    max_tokens: opts.maxTokens ?? 1500,
    temperature: 0.2,
    system: [{ type: "text", text: SUMMARIZATION_STYLE_GUIDE }],
    messages: [
      {
        role: "user",
        content: `자료 제목: ${opts.title}\n\n원문:\n${opts.sourceText}\n\nJSON 출력 (다른 설명 없이):`,
      },
    ],
  });

  const block = response.content[0];
  if (block?.type !== "text") throw new Error("Summary returned non-text");
  const json = extractJsonObject(block.text);
  const parsed = SummarizationOutput.parse(json);
  return {
    result: parsed,
    model: ANTHROPIC_MODEL_NAME,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}

function extractJsonObject(text: string): unknown {
  // Tolerate code fences like ```json … ```
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fence ? fence[1] : text;
  const trimmed = candidate.trim();
  return JSON.parse(trimmed);
}
