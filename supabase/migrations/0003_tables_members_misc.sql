-- ====================================================================
-- 0003_tables_members_misc.sql — Members, tags, glossary, KR data, ops
-- ====================================================================

-- Glossary (영-한 계리 용어 사전) ------------------------------------
create table aik_glossary (
  id uuid primary key default gen_random_uuid(),
  term_en text not null unique,
  term_ko_standard text not null,
  term_ko_alternatives text[] not null default '{}',
  definition_ko text not null,
  usage_examples text[] not null default '{}',
  domain text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_aik_glossary_term_en_trgm on aik_glossary using gin (term_en gin_trgm_ops);
create index idx_aik_glossary_term_ko_trgm on aik_glossary using gin (term_ko_standard gin_trgm_ops);

-- Tags master ---------------------------------------------------------
create table aik_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table aik_document_tags (
  document_id uuid not null references aik_documents(id) on delete cascade,
  tag_id uuid not null references aik_tags(id) on delete cascade,
  primary key (document_id, tag_id)
);

-- Korea data catalog (statistics only) -------------------------------
create table aik_korea_data_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  organization text not null,
  url text not null,
  description text,
  data_type text,
  update_frequency text,
  created_at timestamptz not null default now()
);

create table aik_document_korea_data (
  document_id uuid not null references aik_documents(id) on delete cascade,
  korea_data_id uuid not null references aik_korea_data_sources(id) on delete cascade,
  llm_confidence numeric(4,3),
  reviewed boolean not null default false,
  primary key (document_id, korea_data_id)
);

-- Processing queue ---------------------------------------------------
create table aik_processing_queue (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references aik_documents(id) on delete cascade,
  step text not null,
  status text not null default 'pending',
  attempts int not null default 0,
  last_error text,
  scheduled_for timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_aik_processing_queue_status on aik_processing_queue (status, scheduled_for);

-- Members -------------------------------------------------------------
create table aik_members (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null,
  domain_classification aik_domain_classification not null default 'other',
  status aik_member_status not null default 'pending',
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_aik_members_status on aik_members (status);
create index idx_aik_members_email on aik_members (email);

-- Bookmarks -----------------------------------------------------------
create table aik_bookmarks (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references aik_members(id) on delete cascade,
  document_id uuid not null references aik_documents(id) on delete cascade,
  note text,
  created_at timestamptz not null default now(),
  unique (member_id, document_id)
);

-- Saved filters -------------------------------------------------------
create table aik_saved_filters (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references aik_members(id) on delete cascade,
  name text not null,
  filter_json jsonb not null,
  created_at timestamptz not null default now()
);

-- Feedback ------------------------------------------------------------
create table aik_feedback (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references aik_documents(id) on delete set null,
  member_id uuid references aik_members(id) on delete set null,
  category aik_feedback_category not null,
  body text not null,
  status aik_feedback_status not null default 'open',
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_aik_feedback_status on aik_feedback (status, created_at desc);

-- Event log (anonymized analytics) ----------------------------------
create table aik_event_log (
  id bigserial primary key,
  event_type text not null,
  target_id text,
  anon_session_hash text,
  occurred_at timestamptz not null default now()
);

create index idx_aik_event_log_type_time on aik_event_log (event_type, occurred_at desc);

-- Admin users whitelist ---------------------------------------------
create table aik_admin_users (
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  added_at timestamptz not null default now()
);

-- Audit log ----------------------------------------------------------
create table aik_audit_log (
  id bigserial primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_table text not null,
  target_id text,
  diff_json jsonb,
  occurred_at timestamptz not null default now()
);

-- Notifications -----------------------------------------------------
create table aik_notifications (
  id uuid primary key default gen_random_uuid(),
  type aik_notification_type not null,
  payload_json jsonb not null default '{}',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_aik_notifications_unread on aik_notifications (created_at desc) where read_at is null;
