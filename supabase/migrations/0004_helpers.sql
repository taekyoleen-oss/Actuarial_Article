-- ====================================================================
-- 0004_helpers.sql — Helper functions and triggers
-- ====================================================================

-- updated_at auto-touch trigger ---------------------------------------
create or replace function aik_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger aik_sources_touch_updated_at
  before update on aik_sources
  for each row execute function aik_touch_updated_at();

create trigger aik_documents_touch_updated_at
  before update on aik_documents
  for each row execute function aik_touch_updated_at();

create trigger aik_interpretations_touch_updated_at
  before update on aik_interpretations
  for each row execute function aik_touch_updated_at();

create trigger aik_glossary_touch_updated_at
  before update on aik_glossary
  for each row execute function aik_touch_updated_at();

create trigger aik_processing_queue_touch_updated_at
  before update on aik_processing_queue
  for each row execute function aik_touch_updated_at();

create trigger aik_feedback_touch_updated_at
  before update on aik_feedback
  for each row execute function aik_touch_updated_at();

-- is_admin() helper ---------------------------------------------------
create or replace function aik_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from aik_admin_users where auth_user_id = auth.uid()
  );
$$;

-- is_active_member() helper ------------------------------------------
create or replace function aik_is_active_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from aik_members
    where auth_user_id = auth.uid()
      and status = 'active'
  );
$$;

-- Audit trigger -----------------------------------------------------
create or replace function aik_record_audit()
returns trigger
language plpgsql
as $$
begin
  insert into aik_audit_log (actor_id, action, target_table, target_id, diff_json)
  values (
    auth.uid(),
    tg_op,
    tg_table_name,
    coalesce((new).id::text, (old).id::text),
    case
      when tg_op = 'DELETE' then to_jsonb(old)
      else to_jsonb(new)
    end
  );
  return coalesce(new, old);
end;
$$;

create trigger aik_documents_audit
  after insert or update or delete on aik_documents
  for each row execute function aik_record_audit();

create trigger aik_translations_audit
  after insert or update or delete on aik_translations
  for each row execute function aik_record_audit();

create trigger aik_interpretations_audit
  after insert or update or delete on aik_interpretations
  for each row execute function aik_record_audit();

create trigger aik_members_audit
  after update on aik_members
  for each row execute function aik_record_audit();
