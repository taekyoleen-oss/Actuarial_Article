"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/supabase/admin-guard";
import {
  QUOTATION_POLICIES,
  REGIONS,
  TRACKS,
} from "@/types/domain";

const sourceInput = z.object({
  name: z.string().min(2).max(120),
  base_url: z.string().url(),
  organization: z.string().min(2).max(120),
  region: z.enum(REGIONS),
  track: z.enum(TRACKS),
  quotation_policy: z.enum(QUOTATION_POLICIES),
  is_reputable: z.boolean().default(false),
  members_only_default: z.boolean().default(false),
  auto_crawl_schedule: z.string().optional().nullable(),
});

export async function createSource(formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin();
  const parsed = sourceInput.safeParse({
    name: formData.get("name"),
    base_url: formData.get("base_url"),
    organization: formData.get("organization"),
    region: formData.get("region"),
    track: formData.get("track"),
    quotation_policy: formData.get("quotation_policy"),
    is_reputable: formData.get("is_reputable") === "on",
    members_only_default: formData.get("members_only_default") === "on",
    auto_crawl_schedule:
      formData.get("auto_crawl_schedule")?.toString().trim() || null,
  });
  if (!parsed.success) {
    throw new Error(`소스 입력 오류: ${JSON.stringify(parsed.error.flatten())}`);
  }
  const { error } = await supabase.from("aik_sources").insert(parsed.data);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/sources");
}

export async function deleteSource(id: string): Promise<void> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("aik_sources").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/sources");
}
