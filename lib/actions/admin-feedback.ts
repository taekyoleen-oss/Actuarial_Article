"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/admin-guard";

async function setStatus(id: string, status: "in_review" | "resolved" | "rejected", note?: string) {
  const { supabase } = await requireAdmin();
  const patch: Record<string, unknown> = { status };
  if (note) patch.admin_note = note;
  const { error } = await supabase.from("aik_feedback").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/feedback");
}

export async function markFeedbackInReview(formData: FormData): Promise<void> {
  const id = String(formData.get("feedback_id") ?? "");
  if (!id) throw new Error("missing feedback_id");
  await setStatus(id, "in_review");
}

export async function resolveFeedback(formData: FormData): Promise<void> {
  const id = String(formData.get("feedback_id") ?? "");
  const note = formData.get("admin_note")?.toString().trim();
  if (!id) throw new Error("missing feedback_id");
  await setStatus(id, "resolved", note);
}

export async function rejectFeedback(formData: FormData): Promise<void> {
  const id = String(formData.get("feedback_id") ?? "");
  const note = formData.get("admin_note")?.toString().trim();
  if (!id) throw new Error("missing feedback_id");
  await setStatus(id, "rejected", note);
}
