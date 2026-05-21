import "server-only";
import { getAnthropicClient, ANTHROPIC_MODEL_NAME } from "../client";
import { TRANSLATION_STYLE_GUIDE } from "./system";
import type { GlossaryRow } from "@/types/database";

/**
 * Build glossary excerpt block. Static within a pipeline run → cacheable.
 */
function buildGlossaryBlock(glossary: ReadonlyArray<GlossaryRow>): string {
  if (glossary.length === 0) return "(용어 사전 비어있음)";
  return glossary
    .slice(0, 200)
    .map((g) => `- ${g.term_en} → ${g.term_ko_standard}`)
    .join("\n");
}

export interface TranslateOptions {
  readonly sourceText: string;
  readonly sourceLang?: string;
  readonly glossary: ReadonlyArray<GlossaryRow>;
  readonly maxTokens?: number;
}

export interface TranslateResult {
  readonly content_md: string;
  readonly model: string;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly cacheHits: number;
}

/**
 * One-shot translation of a chunk. Returns markdown body + usage stats.
 * For very large documents, split upstream and stitch.
 */
export async function translateChunk(opts: TranslateOptions): Promise<TranslateResult> {
  const anthropic = getAnthropicClient();
  const glossaryBlock = buildGlossaryBlock(opts.glossary);
  const userInstructions = `다음 영문 자료를 한국어로 번역하세요. Markdown만 출력하고 다른 설명은 붙이지 마세요.\n\n## 원문\n${opts.sourceText}`;

  // TODO: enable prompt cache via beta header once SDK type defs expose cache_control.
  // System block kept multi-part so we can re-add cache_control with minimal diff.
  const response = await anthropic.messages.create({
    model: ANTHROPIC_MODEL_NAME,
    max_tokens: opts.maxTokens ?? 4096,
    temperature: 0.2,
    system: [
      { type: "text", text: TRANSLATION_STYLE_GUIDE },
      { type: "text", text: `## 표준 번역어 사전\n${glossaryBlock}` },
    ],
    messages: [{ role: "user", content: userInstructions }],
  });

  const block = response.content[0];
  if (block?.type !== "text") throw new Error("Translation returned non-text content");

  // cache_creation_input_tokens / cache_read_input_tokens become available once we
  // re-enable cache_control (see TODO above). Stub as 0 for now.
  return {
    content_md: block.text,
    model: ANTHROPIC_MODEL_NAME,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    cacheHits: 0,
  };
}
