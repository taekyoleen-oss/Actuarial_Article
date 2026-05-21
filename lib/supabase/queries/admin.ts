import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  AdoptionGrade,
  BusinessArea,
  DepthStage,
  DiscoveryMethod,
  DocumentStatus,
  PrimaryTopic,
  QuotationPolicy,
  Region,
  Track,
} from "@/types/domain";

export interface AdminDocumentRow {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly title_ko: string | null;
  readonly original_url: string;
  readonly original_lang: string;
  readonly status: DocumentStatus;
  readonly depth_stage: DepthStage;
  readonly target_depth_stage: DepthStage;
  readonly region: Region;
  readonly track: Track;
  readonly discovery_method: DiscoveryMethod;
  readonly primary_topic: PrimaryTopic;
  readonly business_areas: readonly BusinessArea[];
  readonly adoption_grade: AdoptionGrade | null;
  readonly source_id: string;
  readonly published_at: string | null;
  readonly fetched_at: string | null;
  readonly is_members_only_source: boolean;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface AdminSourceRow {
  readonly id: string;
  readonly name: string;
  readonly base_url: string;
  readonly organization: string;
  readonly region: Region;
  readonly track: Track;
  readonly quotation_policy: QuotationPolicy;
  readonly is_reputable: boolean;
  readonly members_only_default: boolean;
  readonly auto_crawl_schedule: string | null;
  readonly last_discovery_at: string | null;
}

export interface DashboardStats {
  readonly byStatus: Record<DocumentStatus, number>;
  readonly byDepth: Record<DepthStage, number>;
  readonly publishedTotal: number;
  readonly reviewPending: number;
  readonly queueLength: number;
  readonly unreadNotifications: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();

  const [statusCounts, depthCounts, publishedCount, reviewCount, queueLen, notifCount] =
    await Promise.all([
      supabase.rpc("aik_count_documents_by_status").then((r) => r),
      supabase.rpc("aik_count_documents_by_depth").then((r) => r),
      supabase
        .from("aik_documents")
        .select("id", { count: "exact", head: true })
        .eq("status", "published"),
      supabase
        .from("aik_documents")
        .select("id", { count: "exact", head: true })
        .eq("status", "review_pending"),
      supabase
        .from("aik_processing_queue")
        .select("id", { count: "exact", head: true })
        .in("status", ["pending", "processing", "pending_quota_reset"]),
      supabase
        .from("aik_notifications")
        .select("id", { count: "exact", head: true })
        .is("read_at", null),
    ]);

  // RPC functions may not exist yet — fall back to inline grouping.
  const byStatus = (statusCounts.data ?? null) as
    | ReadonlyArray<{ status: DocumentStatus; n: number }>
    | null;
  const byDepth = (depthCounts.data ?? null) as
    | ReadonlyArray<{ depth_stage: DepthStage; n: number }>
    | null;

  const statusMap: DashboardStats["byStatus"] = {
    pending: 0,
    processing: 0,
    pending_quota_reset: 0,
    review_pending: 0,
    published: 0,
    archived: 0,
    rejected: 0,
  };
  const depthMap: DashboardStats["byDepth"] = {
    registered: 0,
    summarized: 0,
    translated: 0,
    interpreted: 0,
  };
  if (byStatus) for (const r of byStatus) statusMap[r.status] = r.n;
  if (byDepth) for (const r of byDepth) depthMap[r.depth_stage] = r.n;

  return {
    byStatus: statusMap,
    byDepth: depthMap,
    publishedTotal: publishedCount.count ?? 0,
    reviewPending: reviewCount.count ?? 0,
    queueLength: queueLen.count ?? 0,
    unreadNotifications: notifCount.count ?? 0,
  };
}

export async function listAdminDocuments(filters?: {
  readonly status?: DocumentStatus;
  readonly limit?: number;
}): Promise<AdminDocumentRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("aik_documents")
    .select(
      "id, slug, title, title_ko, original_url, original_lang, status, depth_stage, target_depth_stage, region, track, discovery_method, primary_topic, business_areas, adoption_grade, source_id, published_at, fetched_at, is_members_only_source, created_at, updated_at",
    )
    .order("updated_at", { ascending: false })
    .limit(filters?.limit ?? 50);
  if (filters?.status) query = query.eq("status", filters.status);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as AdminDocumentRow[];
}

export async function getAdminDocument(id: string): Promise<AdminDocumentRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("aik_documents")
    .select(
      "id, slug, title, title_ko, original_url, original_lang, status, depth_stage, target_depth_stage, region, track, discovery_method, primary_topic, business_areas, adoption_grade, source_id, published_at, fetched_at, is_members_only_source, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? (data as unknown as AdminDocumentRow) : null;
}

export async function listAdminSources(): Promise<AdminSourceRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("aik_sources")
    .select(
      "id, name, base_url, organization, region, track, quotation_policy, is_reputable, members_only_default, auto_crawl_schedule, last_discovery_at",
    )
    .order("name");
  if (error) throw error;
  return (data ?? []) as AdminSourceRow[];
}

export interface AdminTranslation {
  readonly id: string;
  readonly document_id: string;
  readonly version: number;
  readonly content_md: string;
  readonly glossary_match_rate: number | null;
  readonly created_by: string;
  readonly reviewed_at: string | null;
  readonly llm_model_used: string | null;
}

export async function getLatestTranslation(documentId: string): Promise<AdminTranslation | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("aik_translations")
    .select("id, document_id, version, content_md, glossary_match_rate, created_by, reviewed_at, llm_model_used")
    .eq("document_id", documentId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? (data as unknown as AdminTranslation) : null;
}

export interface AdminInterpretation {
  readonly id: string;
  readonly document_id: string;
  readonly summary_ko: string;
  readonly korea_applicability: string | null;
  readonly required_korea_data: string | null;
  readonly regulatory_impact: string | null;
  readonly target_departments: readonly BusinessArea[];
  readonly adoption_difficulty: string | null;
  readonly adoption_notes: string | null;
}

export async function getInterpretation(documentId: string): Promise<AdminInterpretation | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("aik_interpretations")
    .select(
      "id, document_id, summary_ko, korea_applicability, required_korea_data, regulatory_impact, target_departments, adoption_difficulty, adoption_notes",
    )
    .eq("document_id", documentId)
    .maybeSingle();
  if (error) throw error;
  return data ? (data as unknown as AdminInterpretation) : null;
}
