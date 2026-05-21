-- ====================================================================
-- 0001_enums.sql  — Domain enums (must match types/domain.ts exactly)
-- Actuarial Intel Korea v1.2
-- ====================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

create type aik_region as enum ('overseas', 'domestic');

create type aik_track as enum (
  'auto_discovery',
  'admin_curated',
  'email_submission',
  'korea_curated'
);

create type aik_discovery_method as enum (
  'auto',
  'admin_manual',
  'email_submission',
  'korea_seed'
);

create type aik_depth_stage as enum (
  'registered',
  'summarized',
  'translated',
  'interpreted'
);

create type aik_adoption_grade as enum (
  'immediate',
  'pilot',
  'internal_research',
  'monitoring'
);

create type aik_document_status as enum (
  'pending',
  'processing',
  'pending_quota_reset',
  'review_pending',
  'published',
  'archived',
  'rejected'
);

create type aik_quotation_policy as enum (
  'metadata_only',
  'summary_with_quote',
  'public_full'
);

create type aik_member_status as enum (
  'pending',
  'active',
  'rejected',
  'suspended'
);

create type aik_domain_classification as enum (
  'whitelist',
  'other',
  'blocked'
);

create type aik_primary_topic as enum (
  'mortality',
  'longevity',
  'mortality_improvement',
  'underwriting',
  'predictive_analytics',
  'ifrs17',
  'k_ics',
  'reinsurance',
  'persistency',
  'claims',
  'investment',
  'other'
);

create type aik_business_area as enum (
  'product_development',
  'risk_rate',
  'underwriting',
  'ifrs17',
  'k_ics',
  'reinsurance',
  'management_planning'
);

create type aik_feedback_category as enum (
  'translation_error',
  'interpretation_error',
  'regulation_concern',
  'other'
);

create type aik_feedback_status as enum (
  'open',
  'in_review',
  'resolved',
  'rejected'
);

create type aik_notification_type as enum (
  'pipeline_failed',
  'llm_quota_reached',
  'new_member',
  'new_feedback',
  'crawler_blocked',
  'new_discovery_candidates'
);

create type aik_discovery_run_status as enum (
  'success',
  'partial',
  'failed'
);
