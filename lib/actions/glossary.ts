"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/supabase/admin-guard";

const glossaryInput = z.object({
  term_en: z.string().min(2).max(120),
  term_ko_standard: z.string().min(1).max(120),
  term_ko_alternatives: z.array(z.string()).default([]),
  definition_ko: z.string().min(5).max(1500),
  domain: z.string().max(60).optional().nullable(),
});

export async function createTerm(formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin();
  const alts = formData
    .get("term_ko_alternatives")
    ?.toString()
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean) ?? [];

  const parsed = glossaryInput.safeParse({
    term_en: formData.get("term_en"),
    term_ko_standard: formData.get("term_ko_standard"),
    term_ko_alternatives: alts,
    definition_ko: formData.get("definition_ko"),
    domain: formData.get("domain")?.toString() || null,
  });
  if (!parsed.success) throw new Error(JSON.stringify(parsed.error.flatten()));
  const { error } = await supabase.from("aik_glossary").insert(parsed.data);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/glossary");
  revalidatePath("/glossary");
}

export async function deleteTerm(id: string): Promise<void> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("aik_glossary").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/glossary");
  revalidatePath("/glossary");
}
