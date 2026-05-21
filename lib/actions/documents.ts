"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/supabase/admin-guard";
import { promoteDocument } from "@/lib/pipeline/orchestrator";
import {
  BUSINESS_AREAS,
  DEPTH_STAGES,
  PRIMARY_TOPICS,
  REGIONS,
  TRACKS,
} from "@/types/domain";
import type { BusinessArea, DepthStage } from "@/types/domain";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^\w가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

const registerInput = z.object({
  source_id: z.string().uuid(),
  original_url: z.string().url(),
  title: z.string().min(3).max(300),
  title_ko: z.string().max(300).optional(),
  primary_topic: z.enum(PRIMARY_TOPICS),
  business_areas: z.array(z.enum(BUSINESS_AREAS)).max(4),
  region: z.enum(REGIONS),
  track: z.enum(TRACKS),
  target_depth_stage: z.enum(DEPTH_STAGES),
  published_at: z.string().optional().nullable(),
  is_members_only_source: z.boolean(),
});

export async function registerDocument(formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin();
  const business_areas = formData.getAll("business_areas").map(String) as BusinessArea[];

  const parsed = registerInput.safeParse({
    source_id: formData.get("source_id"),
    original_url: formData.get("original_url"),
    title: formData.get("title"),
    title_ko: formData.get("title_ko")?.toString() || undefined,
    primary_topic: formData.get("primary_topic"),
    business_areas,
    region: formData.get("region"),
    track: formData.get("track"),
    target_depth_stage: formData.get("target_depth_stage"),
    published_at: formData.get("published_at")?.toString() || null,
    is_members_only_source: formData.get("is_members_only_source") === "on",
  });
  if (!parsed.success) {
    throw new Error(`문서 입력 오류: ${JSON.stringify(parsed.error.flatten())}`);
  }
  if (parsed.data.is_members_only_source) {
    throw new Error("Members-only 자료는 게재 대상이 아닙니다. 등록 차단.");
  }

  const slug = `${slugify(parsed.data.title_ko ?? parsed.data.title)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;

  const { data: inserted, error } = await supabase
    .from("aik_documents")
    .insert({
      ...parsed.data,
      slug,
      depth_stage: "registered",
      status: "pending",
      discovery_method: "admin_manual",
      fetched_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/admin/documents");
  redirect(`/admin/documents/${(inserted as { id: string }).id}/review`);
}

export async function promoteDocumentAction(formData: FormData) {
  await requireAdmin();
  const documentId = String(formData.get("document_id"));
  const to = String(formData.get("to_stage")) as DepthStage;
  const sourceTextOverride = formData.get("source_text_override")?.toString() || undefined;
  const result = await promoteDocument({ documentId, to, sourceTextOverride });
  revalidatePath(`/admin/documents/${documentId}/review`);
  return result;
}

export async function publishDocument(documentId: string) {
  const { supabase } = await requireAdmin();
  const { data: doc } = await supabase
    .from("aik_documents")
    .select("slug, depth_stage, status, is_members_only_source")
    .eq("id", documentId)
    .maybeSingle();
  if (!doc) return { ok: false, error: "문서 없음" };
  if ((doc as { is_members_only_source: boolean }).is_members_only_source) {
    return { ok: false, error: "Members-only 자료는 게시할 수 없습니다" };
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("aik_documents")
    .update({ status: "published", published_at: now })
    .eq("id", documentId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/library/${(doc as { slug: string }).slug}`);
  revalidatePath("/library");
  revalidatePath("/");
  revalidateTag("documents");
  return { ok: true };
}

export async function archiveDocument(documentId: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("aik_documents")
    .update({ status: "archived" })
    .eq("id", documentId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/documents");
  revalidatePath("/library");
  return { ok: true };
}

export async function updateTranslation(translationId: string, contentMd: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("aik_translations")
    .update({ content_md: contentMd, created_by: "admin", reviewed_at: new Date().toISOString() })
    .eq("id", translationId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function updateInterpretation(
  interpretationId: string,
  patch: Record<string, unknown>,
) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("aik_interpretations")
    .update(patch)
    .eq("id", interpretationId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
