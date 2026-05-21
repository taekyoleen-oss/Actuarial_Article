import "server-only";
import { getAnthropicClient, ANTHROPIC_MODEL_NAME } from "../client";
import { INTERPRETATION_STYLE_GUIDE } from "./system";
import { InterpretationOutput } from "../schemas";

export interface InterpretOptions {
  readonly sourceText: string;
  readonly translatedText: string;
  readonly title: string;
  readonly koreaDataHints?: ReadonlyArray<string>;
  readonly maxTokens?: number;
}

export interface InterpretationResult {
  readonly result: InterpretationOutput;
  readonly model: string;
  readonly inputTokens: number;
  readonly outputTokens: number;
}

const DISCLAIMER = "※ 참고용이며 실제 적용은 소속 회사·감독원 해석을 따릅니다.";

export async function interpretForKorea(opts: InterpretOptions): Promise<InterpretationResult> {
  const anthropic = getAnthropicClient();
  const koreaDataBlock = opts.koreaDataHints?.length
    ? opts.koreaDataHints.map((d) => `- ${d}`).join("\n")
    : "(매핑 후보 없음 — 필요한 데이터를 명시적으로 식별)";

  const user = `자료 제목: ${opts.title}

## 영문 원문 (요약 발췌 가능)
${opts.sourceText.slice(0, 8000)}

## 한국어 번역
${opts.translatedText.slice(0, 8000)}

## 활용 가능한 한국 데이터 후보 (선택)
${koreaDataBlock}

위 자료를 한국 보험 실무 도입 관점에서 해석해 주세요. JSON 객체로만 출력 (다른 설명 금지).`;

  const response = await anthropic.messages.create({
    model: ANTHROPIC_MODEL_NAME,
    max_tokens: opts.maxTokens ?? 2500,
    temperature: 0.3,
    system: [{ type: "text", text: INTERPRETATION_STYLE_GUIDE }],
    messages: [{ role: "user", content: user }],
  });

  const block = response.content[0];
  if (block?.type !== "text") throw new Error("Interpretation returned non-text");

  const raw = extractJson(block.text);
  // Inject disclaimer if not already present.
  if (typeof raw === "object" && raw !== null && "regulatory_impact" in raw) {
    const r = raw as Record<string, unknown>;
    const ri = String(r.regulatory_impact ?? "");
    if (!ri.includes("참고용")) {
      r.regulatory_impact = `${ri.trim()}\n\n${DISCLAIMER}`;
    }
  }

  const parsed = InterpretationOutput.parse(raw);

  return {
    result: parsed,
    model: ANTHROPIC_MODEL_NAME,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}

function extractJson(text: string): unknown {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fence ? fence[1] : text;
  return JSON.parse(candidate.trim());
}
