// Placeholder. Replace with the output of `npm run types:supabase` once linked.
// We declare Database with permissive table types so admin INSERT/UPDATE compiles
// without requiring the full codegen. Returns from queries are typed via the
// PublicDocumentRow / PublicInterpretationSummaryRow / GlossaryRow interfaces
// or explicit casts in lib/supabase/queries/*.

import type {
  AdoptionGrade,
  BusinessArea,
  DepthStage,
  DiscoveryMethod,
  DocumentStatus,
  LicenseType,
  PrimaryTopic,
  QuotationPolicy,
  Region,
  Track,
  AdoptionAxes,
} from "./domain";

export interface KoreaContextSource {
  readonly title: string;
  readonly url: string;
  readonly publisher?: string;
  readonly accessed_at?: string;
}

export interface PublicDocumentRow {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly title_ko: string | null;
  readonly original_lang: string;
  readonly published_at: string | null;
  readonly region: Region;
  readonly track: Track;
  readonly depth_stage: DepthStage;
  readonly primary_topic: PrimaryTopic;
  readonly business_areas: readonly BusinessArea[];
  readonly adoption_grade: AdoptionGrade | null;
  readonly adoption_axes: AdoptionAxes | null;
  readonly source_id: string;
  readonly license_type: LicenseType;
  readonly license_label: string | null;
  readonly license_url: string | null;
  readonly original_file_path: string | null;
  readonly original_file_mime: string | null;
  readonly original_file_size_bytes: number | null;
  readonly original_url: string;
  readonly source_name: string;
  readonly source_organization: string;
  readonly quotation_policy: QuotationPolicy;
}

export interface PublicInterpretationSummaryRow {
  readonly document_id: string;
  readonly summary_ko: string;
  readonly korea_applicability: string | null;
  readonly korea_context_md: string | null;
  readonly korea_context_sources: readonly KoreaContextSource[] | null;
  readonly target_departments: readonly BusinessArea[];
  readonly adoption_difficulty: string | null;
  readonly adoption_notes: string | null;
}

export interface GlossaryRow {
  readonly id: string;
  readonly term_en: string;
  readonly term_ko_standard: string;
  readonly term_ko_alternatives: readonly string[];
  readonly definition_ko: string;
  readonly usage_examples: readonly string[];
  readonly domain: string | null;
}

// We intentionally widen Insert/Update to `any` here so the placeholder Database
// does not block builds. The PostgrestQueryBuilder narrows the parameter union
// against these types; widening short-circuits the narrowing until codegen runs.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TableShape = { Row: Record<string, unknown>; Insert: any; Update: any };

// Minimal Database stub. Tables are permissive (Row/Insert/Update all `AnyRow`)
// so admin actions compile without exhaustive codegen. Views are explicit so the
// public read path stays type-safe.
export interface Database {
  public: {
    Tables: {
      aik_sources: TableShape;
      aik_documents: TableShape;
      aik_translations: TableShape;
      aik_translation_cache: TableShape;
      aik_interpretations: TableShape;
      aik_discovery_runs: TableShape;
      aik_glossary: TableShape;
      aik_tags: TableShape;
      aik_document_tags: TableShape;
      aik_korea_data_sources: TableShape;
      aik_document_korea_data: TableShape;
      aik_processing_queue: TableShape;
      aik_members: TableShape;
      aik_bookmarks: TableShape;
      aik_saved_filters: TableShape;
      aik_feedback: TableShape;
      aik_event_log: TableShape;
      aik_admin_users: TableShape;
      aik_audit_log: TableShape;
      aik_notifications: TableShape;
    };
    Views: {
      aik_public_documents: { Row: PublicDocumentRow };
      aik_public_interpretation_summary: { Row: PublicInterpretationSummaryRow };
    };
    Functions: Record<string, unknown>;
    Enums: Record<string, unknown>;
  };
}

export type DocumentStatusType = DocumentStatus;
export type DiscoveryMethodType = DiscoveryMethod;
