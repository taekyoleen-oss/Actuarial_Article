import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  PublicDocumentRow,
  PublicInterpretationSummaryRow,
} from "@/types/database";
import type {
  AdoptionGrade,
  BusinessArea,
  DepthStage,
  PrimaryTopic,
  Region,
} from "@/types/domain";

export interface DocumentListFilters {
  readonly region?: Region;
  readonly depth?: DepthStage;
  readonly primaryTopic?: PrimaryTopic;
  readonly businessArea?: BusinessArea;
  readonly adoptionGrade?: AdoptionGrade;
  readonly sourceId?: string;
  readonly q?: string;
  readonly limit?: number;
  readonly offset?: number;
}

export async function listPublicDocuments(
  filters: DocumentListFilters = {},
): Promise<{ rows: PublicDocumentRow[]; total: number }> {
  const supabase = await createClient();
  let query = supabase
    .from("aik_public_documents")
    .select("*", { count: "exact" })
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(filters.limit ?? 24);

  if (filters.region) query = query.eq("region", filters.region);
  if (filters.depth) query = query.eq("depth_stage", filters.depth);
  if (filters.primaryTopic) query = query.eq("primary_topic", filters.primaryTopic);
  if (filters.businessArea)
    query = query.contains("business_areas", [filters.businessArea]);
  if (filters.adoptionGrade)
    query = query.eq("adoption_grade", filters.adoptionGrade);
  if (filters.sourceId) query = query.eq("source_id", filters.sourceId);
  if (filters.q) {
    // pg_trgm similarity on title / title_ko via ilike fallback for portability
    query = query.or(`title.ilike.%${filters.q}%,title_ko.ilike.%${filters.q}%`);
  }
  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit ?? 24) - 1);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { rows: (data ?? []) as PublicDocumentRow[], total: count ?? 0 };
}

export async function getPublicDocumentBySlug(slug: string) {
  const supabase = await createClient();
  const { data: doc, error: docError } = await supabase
    .from("aik_public_documents")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (docError) throw docError;
  if (!doc) return null;

  const { data: interp } = await supabase
    .from("aik_public_interpretation_summary")
    .select("*")
    .eq("document_id", (doc as PublicDocumentRow).id)
    .maybeSingle();

  return {
    document: doc as PublicDocumentRow,
    interpretation: (interp ?? null) as PublicInterpretationSummaryRow | null,
  };
}

export async function listLatestForLanding(limit = 6) {
  const { rows } = await listPublicDocuments({ limit });
  return rows;
}
