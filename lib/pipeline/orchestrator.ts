import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { translateChunk } from "@/lib/anthropic/prompts/translation";
import { summarizeForKorea } from "@/lib/anthropic/prompts/summarize";
import { interpretForKorea } from "@/lib/anthropic/prompts/interpretation";
import { isQuotaReached, recordLLMCall } from "./llm-quota";
import { fetchExternal, htmlToText, extractMetaFromHtml } from "./fetch-source";
import type { DepthStage } from "@/types/domain";

type Supa = ReturnType<typeof createServiceClient>;

export interface PromoteOptions {
  readonly documentId: string;
  readonly to: DepthStage;
  /** Override raw source text (admin paste). When absent the orchestrator fetches via fetch-source. */
  readonly sourceTextOverride?: string;
}

export interface PromoteResult {
  readonly ok: boolean;
  readonly stage: DepthStage;
  readonly message?: string;
}

/**
 * Promote a document to the requested depth stage by running the matching step.
 * The pipeline never auto-promotes; an admin explicitly invokes each gate.
 */
export async function promoteDocument(opts: PromoteOptions): Promise<PromoteResult> {
  if (await isQuotaReached()) {
    const supabase = createServiceClient();
    await supabase.from("aik_processing_queue").insert({
      document_id: opts.documentId,
      step: `promote_to_${opts.to}`,
      status: "pending_quota_reset",
      scheduled_for: new Date().toISOString(),
    });
    await supabase.from("aik_notifications").insert({
      type: "llm_quota_reached",
      payload_json: { document_id: opts.documentId, target_stage: opts.to },
    });
    return { ok: false, stage: opts.to, message: "LLM 일일 한도 도달 — 큐 적재됨" };
  }

  const supabase = createServiceClient();
  const { data: doc } = await supabase
    .from("aik_documents")
    .select(
      "id, original_url, title, title_ko, depth_stage, is_members_only_source, primary_topic",
    )
    .eq("id", opts.documentId)
    .maybeSingle();

  if (!doc) return { ok: false, stage: opts.to, message: "문서를 찾을 수 없습니다" };
  if ((doc as { is_members_only_source: boolean }).is_members_only_source) {
    return { ok: false, stage: opts.to, message: "Members-only 자료는 처리할 수 없습니다" };
  }

  // Resolve raw source text once for all stages.
  const sourceText =
    opts.sourceTextOverride && opts.sourceTextOverride.length > 100
      ? opts.sourceTextOverride
      : await loadSourceText(doc as { original_url: string });

  switch (opts.to) {
    case "summarized":
      return await runSummarize(supabase, doc as DocRow, sourceText);
    case "translated":
      return await runTranslate(supabase, doc as DocRow, sourceText);
    case "interpreted":
      return await runInterpret(supabase, doc as DocRow, sourceText);
    default:
      return { ok: false, stage: opts.to, message: "registered 단계는 등록 시 자동 부여됨" };
  }
}

interface DocRow {
  readonly id: string;
  readonly original_url: string;
  readonly title: string;
  readonly title_ko: string | null;
  readonly depth_stage: DepthStage;
}

async function loadSourceText(doc: { readonly original_url: string }): Promise<string> {
  const fetched = await fetchExternal(doc.original_url);
  const text = htmlToText(fetched.html);
  if (text.length < 200) {
    throw new Error(
      "원문 텍스트 추출 실패 (200자 미만). 관리자가 본문을 수동 입력해주세요.",
    );
  }
  return text;
}

async function runSummarize(supabase: Supa, doc: DocRow, sourceText: string): Promise<PromoteResult> {
  const { result, model, inputTokens, outputTokens } = await summarizeForKorea({
    sourceText: sourceText.slice(0, 12000),
    title: doc.title_ko || doc.title,
  });
  await recordLLMCall({
    step: "summarize",
    model,
    inputTokens,
    outputTokens,
    documentId: doc.id,
  });

  // Persist summary into the interpretations row (lightweight; full interpretation comes later).
  const existing = await supabase
    .from("aik_interpretations")
    .select("id")
    .eq("document_id", doc.id)
    .maybeSingle();

  if (existing.data) {
    await supabase
      .from("aik_interpretations")
      .update({ summary_ko: result.summary_ko })
      .eq("document_id", doc.id);
  } else {
    await supabase.from("aik_interpretations").insert({
      document_id: doc.id,
      summary_ko: result.summary_ko,
    });
  }

  // Also bump primary_topic if undecided.
  await supabase
    .from("aik_documents")
    .update({
      depth_stage: "summarized",
      status: "review_pending",
      primary_topic: result.primary_topic,
    })
    .eq("id", doc.id);

  return { ok: true, stage: "summarized" };
}

async function runTranslate(supabase: Supa, doc: DocRow, sourceText: string): Promise<PromoteResult> {
  const { data: glossary } = await supabase
    .from("aik_glossary")
    .select("id, term_en, term_ko_standard, term_ko_alternatives, definition_ko, usage_examples, domain")
    .order("term_en")
    .limit(200);

  const { content_md, model, inputTokens, outputTokens, cacheHits } = await translateChunk({
    sourceText: sourceText.slice(0, 12000),
    glossary: (glossary ?? []) as Parameters<typeof translateChunk>[0]["glossary"],
  });

  await recordLLMCall({
    step: "translate",
    model,
    inputTokens,
    outputTokens,
    documentId: doc.id,
  });

  // Append new translation version
  const { data: latest } = await supabase
    .from("aik_translations")
    .select("version")
    .eq("document_id", doc.id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextVersion = ((latest as { version: number } | null)?.version ?? 0) + 1;

  await supabase.from("aik_translations").insert({
    document_id: doc.id,
    version: nextVersion,
    content_md,
    created_by: "llm",
    llm_model_used: model,
    cache_hit_rate: cacheHits > 0 ? 1 : 0,
  });

  await supabase
    .from("aik_documents")
    .update({ depth_stage: "translated", status: "review_pending" })
    .eq("id", doc.id);

  return { ok: true, stage: "translated" };
}

async function runInterpret(supabase: Supa, doc: DocRow, sourceText: string): Promise<PromoteResult> {
  const { data: latestTrans } = await supabase
    .from("aik_translations")
    .select("content_md")
    .eq("document_id", doc.id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latestTrans) {
    return {
      ok: false,
      stage: "interpreted",
      message: "번역본이 없습니다. 먼저 translated 단계를 완료하세요.",
    };
  }

  const { result, model, inputTokens, outputTokens } = await interpretForKorea({
    sourceText: sourceText.slice(0, 8000),
    translatedText: (latestTrans as { content_md: string }).content_md.slice(0, 8000),
    title: doc.title_ko || doc.title,
  });

  await recordLLMCall({
    step: "interpret",
    model,
    inputTokens,
    outputTokens,
    documentId: doc.id,
  });

  await supabase
    .from("aik_interpretations")
    .upsert(
      {
        document_id: doc.id,
        summary_ko: result.summary_ko,
        korea_applicability: result.korea_applicability,
        required_korea_data: result.required_korea_data,
        regulatory_impact: result.regulatory_impact,
        target_departments: result.target_departments,
        adoption_difficulty: result.adoption_difficulty,
        adoption_notes: result.adoption_notes ?? null,
      },
      { onConflict: "document_id" },
    );

  await supabase
    .from("aik_documents")
    .update({ depth_stage: "interpreted", status: "review_pending" })
    .eq("id", doc.id);

  return { ok: true, stage: "interpreted" };
}
