-- ====================================================================
-- 0002_tables_core.sql  — Sources, documents, translations, interpretations
-- ====================================================================

-- Sources master ------------------------------------------------------
create table aik_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  base_url text not null,
  organization text not null,
  region aik_region not null default 'overseas',
  track aik_track not null default 'admin_curated',
  quotation_policy aik_quotation_policy not null default 'metadata_only',
  members_only_default boolean not null default false,
  robots_check_passed boolean not null default false,
  auto_crawl_schedule text,
  discovery_selector_json jsonb,
  last_discovery_at timestamptz,
  is_reputable boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_aik_sources_region_track on aik_sources (region, track);
create index idx_aik_sources_is_reputable on aik_sources (is_reputable) where is_reputable = true;

-- Documents -----------------------------------------------------------
create table aik_documents (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references aik_sources(id) on delete restrict,
  original_url text not null,
  title text not null,
  title_ko text,
  original_lang text not null default 'en',
  published_at date,
  fetched_at timestamptz,
  status aik_document_status not null default 'pending',
  depth_stage aik_depth_stage not null default 'registered',
  target_depth_stage aik_depth_stage not null default 'interpreted',
  region aik_region not null default 'overseas',
  track aik_track not null default 'admin_curated',
  discovery_method aik_discovery_method not null default 'admin_manual',
  submitted_via_note text,
  slug text not null unique,
  primary_topic aik_primary_topic not null default 'other',
  business_areas aik_business_area[] not null default '{}',
  adoption_grade aik_adoption_grade,
  adoption_axes jsonb,
  parent_document_id uuid references aik_documents(id) on delete set null,
  is_members_only_source boolean not null default false,
  errata_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Documents that are confirmed Members-only must never be published
  constraint aik_documents_no_members_only_publish check (
    not (is_members_only_source and status = 'published')
  )
);

create index idx_aik_documents_status on aik_documents (status);
create index idx_aik_documents_region_depth on aik_documents (region, depth_stage);
create index idx_aik_documents_published_at on aik_documents (published_at desc nulls last);
create index idx_aik_documents_primary_topic on aik_documents (primary_topic);
create index idx_aik_documents_business_areas on aik_documents using gin (business_areas);
create index idx_aik_documents_source on aik_documents (source_id);
create index idx_aik_documents_track on aik_documents (track);
create index idx_aik_documents_title_trgm on aik_documents using gin (title gin_trgm_ops);
create index idx_aik_documents_title_ko_trgm on aik_documents using gin (title_ko gin_trgm_ops);

-- Translations (versioned) -------------------------------------------
create table aik_translations (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references aik_documents(id) on delete cascade,
  version int not null default 1,
  content_md text not null,
  glossary_match_rate numeric(4,3),
  created_by text not null default 'llm', -- 'llm' or 'admin'
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  llm_model_used text,
  cache_hit_rate numeric(4,3),
  created_at timestamptz not null default now(),
  unique (document_id, version)
);

create index idx_aik_translations_document on aik_translations (document_id, version desc);

-- Translation cache (sentence-level TM Lite) -------------------------
create table aik_translation_cache (
  id uuid primary key default gen_random_uuid(),
  sentence_hash text not null unique,
  source_text text not null,
  translated_text text not null,
  glossary_terms_used text[] not null default '{}',
  first_seen_document_id uuid references aik_documents(id) on delete set null,
  hit_count int not null default 0,
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now()
);

create index idx_aik_translation_cache_hash on aik_translation_cache (sentence_hash);

-- Interpretations (한국형 해석) ---------------------------------------
create table aik_interpretations (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null unique references aik_documents(id) on delete cascade,
  summary_ko text not null,
  korea_applicability text,
  required_korea_data text,
  regulatory_impact text,
  regulatory_disclaimer_version text not null default 'v1.0',
  target_departments aik_business_area[] not null default '{}',
  adoption_difficulty text,
  adoption_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Discovery runs (자동 정기 수집 실행 기록) --------------------------
create table aik_discovery_runs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references aik_sources(id) on delete cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  candidates_found int not null default 0,
  candidates_new int not null default 0,
  candidates_rejected_reason_json jsonb,
  status aik_discovery_run_status not null default 'success',
  error_message text
);

create index idx_aik_discovery_runs_source_started on aik_discovery_runs (source_id, started_at desc);
