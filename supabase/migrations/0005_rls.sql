-- ====================================================================
-- 0005_rls.sql — Row-Level Security per §3.4
-- 3-tier model: anon < member < admin
-- ====================================================================

-- Enable RLS on every table -----------------------------------------
alter table aik_sources enable row level security;
alter table aik_documents enable row level security;
alter table aik_translations enable row level security;
alter table aik_translation_cache enable row level security;
alter table aik_interpretations enable row level security;
alter table aik_discovery_runs enable row level security;
alter table aik_glossary enable row level security;
alter table aik_tags enable row level security;
alter table aik_document_tags enable row level security;
alter table aik_korea_data_sources enable row level security;
alter table aik_document_korea_data enable row level security;
alter table aik_processing_queue enable row level security;
alter table aik_members enable row level security;
alter table aik_bookmarks enable row level security;
alter table aik_saved_filters enable row level security;
alter table aik_feedback enable row level security;
alter table aik_event_log enable row level security;
alter table aik_admin_users enable row level security;
alter table aik_audit_log enable row level security;
alter table aik_notifications enable row level security;

-- =====================================================================
-- aik_sources — anyone reads, admins write
-- =====================================================================
create policy aik_sources_read on aik_sources
  for select using (true);
create policy aik_sources_write on aik_sources
  for all using (aik_is_admin()) with check (aik_is_admin());

-- =====================================================================
-- aik_documents
--   anon:    published, not members-only
--   member:  same as anon
--   admin:   everything
--
-- Column-level filtering (full body, full regulatory_impact) is enforced
-- on aik_translations / aik_interpretations.
-- =====================================================================
create policy aik_documents_anon_read on aik_documents
  for select using (
    status = 'published' and not is_members_only_source
  );
create policy aik_documents_admin_all on aik_documents
  for all using (aik_is_admin()) with check (aik_is_admin());

-- =====================================================================
-- aik_translations — full body to active members on translated+ docs
-- =====================================================================
create policy aik_translations_member_read on aik_translations
  for select using (
    aik_is_active_member()
    and exists (
      select 1 from aik_documents d
      where d.id = aik_translations.document_id
        and d.status = 'published'
        and d.depth_stage in ('translated', 'interpreted')
        and not d.is_members_only_source
    )
  );
create policy aik_translations_admin_all on aik_translations
  for all using (aik_is_admin()) with check (aik_is_admin());

-- =====================================================================
-- aik_interpretations
--   anon:    summary_ko, korea_applicability, target_departments columns only
--            (column-level — done by view; full RLS allows row read)
--   member:  full row when depth_stage = 'interpreted'
--
-- Pragmatic enforcement: serve anon a published-view that strips heavy fields.
-- For now, RLS allows select on published & interpreted rows; the application
-- layer is responsible for hiding regulatory_impact from anon (see public views).
-- =====================================================================
create policy aik_interpretations_published_read on aik_interpretations
  for select using (
    exists (
      select 1 from aik_documents d
      where d.id = aik_interpretations.document_id
        and d.status = 'published'
        and d.depth_stage = 'interpreted'
        and not d.is_members_only_source
    )
  );
create policy aik_interpretations_admin_all on aik_interpretations
  for all using (aik_is_admin()) with check (aik_is_admin());

-- =====================================================================
-- aik_translation_cache — admin only
-- =====================================================================
create policy aik_translation_cache_admin on aik_translation_cache
  for all using (aik_is_admin()) with check (aik_is_admin());

-- =====================================================================
-- aik_discovery_runs — admin only
-- =====================================================================
create policy aik_discovery_runs_admin on aik_discovery_runs
  for all using (aik_is_admin()) with check (aik_is_admin());

-- =====================================================================
-- aik_glossary — anyone reads, admin writes
-- =====================================================================
create policy aik_glossary_read on aik_glossary for select using (true);
create policy aik_glossary_admin_write on aik_glossary
  for all using (aik_is_admin()) with check (aik_is_admin());

-- =====================================================================
-- aik_tags & aik_document_tags
-- =====================================================================
create policy aik_tags_read on aik_tags for select using (approved or aik_is_admin());
create policy aik_tags_admin_write on aik_tags for all using (aik_is_admin()) with check (aik_is_admin());

create policy aik_document_tags_read on aik_document_tags for select using (true);
create policy aik_document_tags_admin on aik_document_tags
  for all using (aik_is_admin()) with check (aik_is_admin());

-- =====================================================================
-- aik_korea_data_sources & mapping
-- =====================================================================
create policy aik_korea_data_sources_read on aik_korea_data_sources for select using (true);
create policy aik_korea_data_sources_admin on aik_korea_data_sources
  for all using (aik_is_admin()) with check (aik_is_admin());

create policy aik_document_korea_data_read on aik_document_korea_data for select using (true);
create policy aik_document_korea_data_admin on aik_document_korea_data
  for all using (aik_is_admin()) with check (aik_is_admin());

-- =====================================================================
-- aik_processing_queue — admin only
-- =====================================================================
create policy aik_processing_queue_admin on aik_processing_queue
  for all using (aik_is_admin()) with check (aik_is_admin());

-- =====================================================================
-- aik_members
--   self-read for own row, admin reads all
--   self insert at signup (auth_user_id = auth.uid())
--   admin updates status/approvals
-- =====================================================================
create policy aik_members_self_read on aik_members
  for select using (auth_user_id = auth.uid() or aik_is_admin());
create policy aik_members_self_insert on aik_members
  for insert with check (auth_user_id = auth.uid());
create policy aik_members_admin_update on aik_members
  for update using (aik_is_admin()) with check (aik_is_admin());

-- =====================================================================
-- aik_bookmarks / aik_saved_filters — owner only
-- =====================================================================
create policy aik_bookmarks_owner on aik_bookmarks
  for all using (
    member_id in (select id from aik_members where auth_user_id = auth.uid())
  ) with check (
    member_id in (select id from aik_members where auth_user_id = auth.uid())
  );

create policy aik_saved_filters_owner on aik_saved_filters
  for all using (
    member_id in (select id from aik_members where auth_user_id = auth.uid())
  ) with check (
    member_id in (select id from aik_members where auth_user_id = auth.uid())
  );

-- =====================================================================
-- aik_feedback — owner reads own, admin reads all, owner inserts
-- =====================================================================
create policy aik_feedback_owner_read on aik_feedback
  for select using (
    member_id in (select id from aik_members where auth_user_id = auth.uid())
    or aik_is_admin()
  );
create policy aik_feedback_owner_insert on aik_feedback
  for insert with check (
    member_id in (select id from aik_members where auth_user_id = auth.uid())
  );
create policy aik_feedback_admin_update on aik_feedback
  for update using (aik_is_admin()) with check (aik_is_admin());

-- =====================================================================
-- aik_event_log — anyone inserts via service-role (or admin); admin reads
-- =====================================================================
create policy aik_event_log_admin_read on aik_event_log
  for select using (aik_is_admin());
-- Inserts handled by service-role in /api/public/event (bypasses RLS).

-- =====================================================================
-- aik_admin_users — admin only
-- =====================================================================
create policy aik_admin_users_admin on aik_admin_users
  for all using (aik_is_admin()) with check (aik_is_admin());

-- =====================================================================
-- aik_audit_log — admin read only
-- =====================================================================
create policy aik_audit_log_admin_read on aik_audit_log
  for select using (aik_is_admin());

-- =====================================================================
-- aik_notifications — admin only
-- =====================================================================
create policy aik_notifications_admin on aik_notifications
  for all using (aik_is_admin()) with check (aik_is_admin());

-- =====================================================================
-- Public views — anon-safe projections that strip member-only columns
-- =====================================================================
create view aik_public_documents as
select
  d.id,
  d.slug,
  d.title,
  d.title_ko,
  d.original_lang,
  d.published_at,
  d.region,
  d.track,
  d.depth_stage,
  d.primary_topic,
  d.business_areas,
  d.adoption_grade,
  d.adoption_axes,
  d.source_id,
  s.name as source_name,
  s.organization as source_organization,
  s.quotation_policy
from aik_documents d
join aik_sources s on s.id = d.source_id
where d.status = 'published' and not d.is_members_only_source;

create view aik_public_interpretation_summary as
select
  i.document_id,
  i.summary_ko,
  i.korea_applicability,
  i.target_departments,
  i.adoption_difficulty,
  i.adoption_notes
from aik_interpretations i
join aik_documents d on d.id = i.document_id
where d.status = 'published'
  and d.depth_stage = 'interpreted'
  and not d.is_members_only_source;

grant select on aik_public_documents to anon, authenticated;
grant select on aik_public_interpretation_summary to anon, authenticated;
