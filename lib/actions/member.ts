"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireActiveMember } from "@/lib/supabase/member-guard";

export async function toggleBookmark(formData: FormData): Promise<void> {
  const ctx = await requireActiveMember();
  const documentId = String(formData.get("document_id") ?? "");
  if (!documentId) throw new Error("missing document_id");

  // Toggle: delete if exists, insert otherwise.
  const { data: existing } = await ctx.supabase
    .from("aik_bookmarks")
    .select("id")
    .eq("member_id", ctx.member.id)
    .eq("document_id", documentId)
    .maybeSingle();

  if (existing) {
    const { error } = await ctx.supabase
      .from("aik_bookmarks")
      .delete()
      .eq("id", (existing as { id: string }).id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await ctx.supabase.from("aik_bookmarks").insert({
      member_id: ctx.member.id,
      document_id: documentId,
    });
    if (error) throw new Error(error.message);
  }
  revalidatePath("/account/bookmarks");
}

export async function removeBookmark(formData: FormData): Promise<void> {
  const ctx = await requireActiveMember();
  const bookmarkId = String(formData.get("bookmark_id") ?? "");
  if (!bookmarkId) throw new Error("missing bookmark_id");
  const { error } = await ctx.supabase
    .from("aik_bookmarks")
    .delete()
    .eq("id", bookmarkId)
    .eq("member_id", ctx.member.id);
  if (error) throw new Error(error.message);
  revalidatePath("/account/bookmarks");
}

const savedFilterInput = z.object({
  name: z.string().min(2).max(80),
  filter_json: z.record(z.string(), z.string()),
});

export async function saveFilter(formData: FormData): Promise<void> {
  const ctx = await requireActiveMember();
  const name = formData.get("name")?.toString().trim();
  const rawJson = formData.get("filter_json")?.toString() ?? "{}";
  let parsedJson: Record<string, string>;
  try {
    parsedJson = JSON.parse(rawJson);
  } catch {
    throw new Error("filter_json은 JSON 형식이어야 합니다.");
  }
  const parsed = savedFilterInput.safeParse({ name, filter_json: parsedJson });
  if (!parsed.success) throw new Error(JSON.stringify(parsed.error.flatten()));
  const { error } = await ctx.supabase.from("aik_saved_filters").insert({
    member_id: ctx.member.id,
    name: parsed.data.name,
    filter_json: parsed.data.filter_json,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/account/filters");
}

export async function deleteFilter(formData: FormData): Promise<void> {
  const ctx = await requireActiveMember();
  const id = String(formData.get("filter_id") ?? "");
  if (!id) throw new Error("missing filter_id");
  const { error } = await ctx.supabase
    .from("aik_saved_filters")
    .delete()
    .eq("id", id)
    .eq("member_id", ctx.member.id);
  if (error) throw new Error(error.message);
  revalidatePath("/account/filters");
}

const feedbackInput = z.object({
  document_id: z.string().uuid(),
  category: z.enum([
    "translation_error",
    "interpretation_error",
    "regulation_concern",
    "other",
  ]),
  body: z.string().min(10).max(2000),
});

export async function submitFeedback(formData: FormData): Promise<void> {
  const ctx = await requireActiveMember();
  const parsed = feedbackInput.safeParse({
    document_id: formData.get("document_id"),
    category: formData.get("category"),
    body: formData.get("body"),
  });
  if (!parsed.success) throw new Error(JSON.stringify(parsed.error.flatten()));
  const { error } = await ctx.supabase.from("aik_feedback").insert({
    document_id: parsed.data.document_id,
    member_id: ctx.member.id,
    category: parsed.data.category,
    body: parsed.data.body,
  });
  if (error) throw new Error(error.message);

  // Inform admin via in-app notification
  const adminClient = ctx.supabase; // member can insert via RLS for notifications? No — admin only.
  // Use service-role only for notification side effect:
  // (skipped here — admin will see new feedback via /admin/feedback listing)
  void adminClient;

  revalidatePath(`/library`);
}
