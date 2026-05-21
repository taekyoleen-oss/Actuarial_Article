import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { getAdminUser } from "@/lib/supabase/admin-guard";
import { isQuotaReached, recordLLMCall } from "@/lib/pipeline/llm-quota";
import { TRANSLATION_STYLE_GUIDE } from "@/lib/anthropic/prompts/system";

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

const requestSchema = z.object({
  document_id: z.string().uuid(),
  selection: z.string().min(20).max(8000),
  instruction: z.string().max(500).optional(),
});

/**
 * SSE streaming endpoint for partial translation regeneration.
 *
 * Client posts { document_id, selection, instruction }. Server streams the
 * regenerated Korean text as text/event-stream chunks. The client UI
 * (ReviewWorkspace) consumes the stream and replaces the selected text inline.
 */
export async function POST(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  if (await isQuotaReached()) {
    return NextResponse.json(
      { ok: false, error: "LLM 일일 한도 도달" },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "missing_api_key" }, { status: 500 });
  }

  const anthropic = new Anthropic({ apiKey });
  const stream = await anthropic.messages.stream({
    model: ANTHROPIC_MODEL,
    max_tokens: 2048,
    temperature: 0.2,
    system: TRANSLATION_STYLE_GUIDE,
    messages: [
      {
        role: "user",
        content: `다음 한국어 번역 단편을 다시 작성하세요. 의역·자연스러움 우선, 용어 사전 표준어 유지.\n${
          parsed.data.instruction
            ? `\n## 추가 지시\n${parsed.data.instruction}\n`
            : ""
        }\n## 현재 번역 단편\n${parsed.data.selection}\n\n## 재작성된 한국어만 출력 (다른 설명 금지):`,
      },
    ],
  });

  let totalInput = 0;
  let totalOutput = 0;

  const sse = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ delta: event.delta.text })}\n\n`),
            );
          }
          if (event.type === "message_delta") {
            totalOutput = event.usage.output_tokens;
          }
          if (event.type === "message_start") {
            totalInput = event.message.usage.input_tokens;
          }
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
        await recordLLMCall({
          step: "translate_regenerate",
          model: ANTHROPIC_MODEL,
          inputTokens: totalInput,
          outputTokens: totalOutput,
          documentId: parsed.data.document_id,
        });
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: (err as Error).message })}\n\n`,
          ),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(sse, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
