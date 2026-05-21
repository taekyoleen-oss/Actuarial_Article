"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/admin-guard";
import { runDiscoveryAll, runDiscoveryForSource } from "@/lib/pipeline/discovery";

export async function triggerDiscoveryNow(sourceId?: string): Promise<void> {
  await requireAdmin();
  if (sourceId && sourceId !== "all") {
    await runDiscoveryForSource(sourceId);
  } else {
    await runDiscoveryAll();
  }
  revalidatePath("/admin/discovery");
}

export async function approveCandidate(documentId: string, targetDepth: "summarized" | "translated" | "interpreted"): Promise<void> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("aik_documents")
    .update({ status: "review_pending", target_depth_stage: targetDepth })
    .eq("id", documentId)
    .eq("track", "auto_discovery"); // safety: only auto-discovered docs
  if (error) throw new Error(error.message);
  revalidatePath("/admin/discovery");
  revalidatePath("/admin/documents");
}

export async function rejectCandidate(documentId: string, reason?: string): Promise<void> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("aik_documents")
    .update({ status: "rejected", errata_note: reason ?? "auto-discovery rejected" })
    .eq("id", documentId)
    .eq("track", "auto_discovery");
  if (error) throw new Error(error.message);
  revalidatePath("/admin/discovery");
}
