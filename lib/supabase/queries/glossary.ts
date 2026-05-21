import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { GlossaryRow } from "@/types/database";

export async function listGlossary(q?: string): Promise<GlossaryRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("aik_glossary")
    .select("id, term_en, term_ko_standard, term_ko_alternatives, definition_ko, usage_examples, domain")
    .order("term_en", { ascending: true })
    .limit(500);

  if (q) {
    query = query.or(`term_en.ilike.%${q}%,term_ko_standard.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as GlossaryRow[];
}

export async function getGlossaryTerm(termEn: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("aik_glossary")
    .select("*")
    .eq("term_en", termEn)
    .maybeSingle();
  if (error) throw error;
  return data as GlossaryRow | null;
}
