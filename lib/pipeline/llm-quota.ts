import "server-only";
import { createClient } from "@/lib/supabase/server";

const DAILY_LIMIT = Number(process.env.LLM_DAILY_CALL_LIMIT ?? 200);

/**
 * Returns the count of LLM-attributed events today (KST).
 * We approximate by counting audit_log entries with action='llm_call'.
 * In production, swap to a dedicated counter table for performance.
 */
export async function getTodaysLLMCallCount(): Promise<number> {
  const supabase = await createClient();
  const startOfDayKST = new Date();
  startOfDayKST.setUTCHours(15, 0, 0, 0); // 00:00 KST == 15:00 UTC previous day
  if (startOfDayKST > new Date()) startOfDayKST.setUTCDate(startOfDayKST.getUTCDate() - 1);

  const { count } = await supabase
    .from("aik_audit_log")
    .select("id", { count: "exact", head: true })
    .eq("action", "llm_call")
    .gte("occurred_at", startOfDayKST.toISOString());
  return count ?? 0;
}

export async function isQuotaReached(): Promise<boolean> {
  const used = await getTodaysLLMCallCount();
  return used >= DAILY_LIMIT;
}

/**
 * Logs an LLM call to audit_log for quota tracking and cost monitoring.
 */
export async function recordLLMCall(payload: {
  readonly step: string;
  readonly model: string;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly documentId?: string;
}): Promise<void> {
  const supabase = await createClient();
  await supabase.from("aik_audit_log").insert({
    action: "llm_call",
    target_table: "aik_documents",
    target_id: payload.documentId ?? null,
    diff_json: {
      step: payload.step,
      model: payload.model,
      input_tokens: payload.inputTokens,
      output_tokens: payload.outputTokens,
    },
  });
}

export const LLM_DAILY_LIMIT = DAILY_LIMIT;
