-- Care handoff schema v1, 2026-11-05. Idempotent setup for a dedicated Supabase demo project.
-- Preserves the scans table from upstream 8d891788 / issue #32; removes anonymous broadcast/write.
-- Apply as database owner in SQL Editor. Existing legacy scans are retained but not readable without scope.
-- Normal runtime uses authenticated sessions/RLS; service credentials are only for the explicit seed script.
begin;

create table if not exists public.care_people (
  id text primary key, name text not null, birth text not null, contact_name text not null
);
create table if not exists public.care_clinics (
  id text primary key, name text not null
);
create table if not exists public.care_memberships (
  user_id uuid primary key references auth.users(id),
  display_name text not null,
  role text not null check (role in ('owner','clinic')),
  person_id text not null references public.care_people(id),
  clinic_id text not null references public.care_clinics(id)
);
create table if not exists public.care_documents (
  id text primary key,
  source_id text not null, person_id text not null references public.care_people(id),
  title text not null, kind text not null, version integer not null check (version > 0),
  document_date text not null, storage_path text not null unique,
  page_count integer not null check (page_count > 0), is_current boolean not null default true,
  evidence jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence) = 'array'),
  provenance jsonb,
  unique (person_id, source_id, version)
);
create table if not exists public.care_cards (
  id text primary key, person_id text not null references public.care_people(id),
  clinic_id text not null references public.care_clinics(id),
  label text not null, active boolean not null default true,
  document_ids text[] not null check (cardinality(document_ids) between 1 and 10),
  updated_at timestamptz not null default now(),
  unique (person_id, clinic_id)
);
create table if not exists public.care_handoffs (
  id uuid primary key default gen_random_uuid(),
  person_id text not null references public.care_people(id),
  clinic_id text not null references public.care_clinics(id),
  document_ids text[] not null check (cardinality(document_ids) between 1 and 10),
  status text not null default 'received' check (status in ('received','clarification','accepted','withdrawn')),
  revision integer not null default 1 check (revision > 0),
  source text not null check (source in ('app','card')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  accepted_at timestamptz, note text,
  events jsonb not null default '[]'::jsonb check (jsonb_typeof(events) = 'array')
);
-- document_ids are canonical sorted arrays, written only by the RPC.
create unique index if not exists care_handoffs_active_package on public.care_handoffs(person_id,clinic_id,document_ids) where status <> 'withdrawn';
create table if not exists public.care_requests (
  user_id uuid not null references auth.users(id), request_id uuid not null,
  fingerprint text not null, handoff_id uuid not null references public.care_handoffs(id),
  primary key(user_id,request_id)
);
create table if not exists public.care_records (
  person_id text not null references public.care_people(id), clinic_id text not null references public.care_clinics(id),
  document_id text not null references public.care_documents(id), accepted_at timestamptz not null default now(),
  handoff_id uuid references public.care_handoffs(id),
  primary key (person_id,clinic_id,document_id)
);
create table if not exists public.scans (
  id bigint generated always as identity primary key,
  card_id text not null default 'demo', created_at timestamptz not null default now()
);
alter table public.scans add column if not exists person_id text references public.care_people(id);
alter table public.scans add column if not exists clinic_id text references public.care_clinics(id);
alter table public.scans add column if not exists actor_id uuid references auth.users(id);
alter table public.scans add column if not exists request_id uuid;
alter table public.scans add column if not exists handoff_id uuid references public.care_handoffs(id);
create unique index if not exists scans_actor_request on public.scans(actor_id,request_id) where request_id is not null;

alter table public.care_people enable row level security;
alter table public.care_clinics enable row level security;
alter table public.care_memberships enable row level security;
alter table public.care_documents enable row level security;
alter table public.care_cards enable row level security;
alter table public.care_handoffs enable row level security;
alter table public.care_requests enable row level security;
alter table public.care_records enable row level security;
alter table public.scans enable row level security;

create or replace function public.care_document_visible(p_document_id text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.care_documents d
    join public.care_memberships m on m.user_id = auth.uid() and m.person_id = d.person_id
    where d.id = p_document_id and (
      m.role = 'owner' or (
        m.role = 'clinic' and (
          exists (select 1 from public.care_records r where r.document_id = d.id and r.person_id = m.person_id and r.clinic_id = m.clinic_id)
          or exists (select 1 from public.care_handoffs h where h.person_id = m.person_id and h.clinic_id = m.clinic_id and d.id = any(h.document_ids) and h.status <> 'withdrawn')
        )
      )
    )
  )
$$;
revoke all on function public.care_document_visible(text) from public, anon;
grant execute on function public.care_document_visible(text) to authenticated;

drop policy if exists care_membership_read on public.care_memberships;
create policy care_membership_read on public.care_memberships for select to authenticated using (user_id = auth.uid());
drop policy if exists care_person_read on public.care_people;
create policy care_person_read on public.care_people for select to authenticated using (exists (select 1 from public.care_memberships m where m.user_id = auth.uid() and m.person_id = care_people.id));
drop policy if exists care_clinic_read on public.care_clinics;
create policy care_clinic_read on public.care_clinics for select to authenticated using (exists (select 1 from public.care_memberships m where m.user_id = auth.uid() and m.clinic_id = care_clinics.id));
drop policy if exists care_document_read on public.care_documents;
create policy care_document_read on public.care_documents for select to authenticated using (public.care_document_visible(id));
drop policy if exists care_card_read on public.care_cards;
create policy care_card_read on public.care_cards for select to authenticated using (exists (select 1 from public.care_memberships m where m.user_id = auth.uid() and m.person_id = care_cards.person_id and m.clinic_id = care_cards.clinic_id));
drop policy if exists care_handoff_read on public.care_handoffs;
create policy care_handoff_read on public.care_handoffs for select to authenticated using (exists (select 1 from public.care_memberships m where m.user_id = auth.uid() and m.person_id = care_handoffs.person_id and m.clinic_id = care_handoffs.clinic_id));
drop policy if exists care_request_read on public.care_requests;
create policy care_request_read on public.care_requests for select to authenticated using (user_id = auth.uid());
drop policy if exists care_record_read on public.care_records;
create policy care_record_read on public.care_records for select to authenticated using (exists (select 1 from public.care_memberships m where m.user_id = auth.uid() and m.person_id = care_records.person_id and m.clinic_id = care_records.clinic_id));
drop policy if exists "anon insert" on public.scans;
drop policy if exists "anon select" on public.scans;
drop policy if exists care_scan_read on public.scans;
create policy care_scan_read on public.scans for select to authenticated using (exists (select 1 from public.care_memberships m where m.user_id = auth.uid() and m.person_id = scans.person_id and m.clinic_id = scans.clinic_id));

-- Read only through RLS. State mutations go through the validated transaction RPCs below.
revoke all on public.care_people, public.care_clinics, public.care_memberships, public.care_documents, public.care_cards, public.care_handoffs, public.care_requests, public.care_records, public.scans from anon;
revoke insert, update, delete, truncate, references, trigger on public.care_people, public.care_clinics, public.care_memberships, public.care_documents, public.care_cards, public.care_handoffs, public.care_requests, public.care_records, public.scans from authenticated;
grant select on public.care_people, public.care_clinics, public.care_memberships, public.care_documents, public.care_cards, public.care_handoffs, public.care_requests, public.care_records, public.scans to authenticated;

create or replace function public.care_submit_handoff(p_document_ids text[], p_recipient_id text, p_request_id uuid, p_card_id text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_member public.care_memberships%rowtype;
  v_card public.care_cards%rowtype;
  v_previous public.care_requests%rowtype;
  v_handoff public.care_handoffs%rowtype;
  v_docs text[]; v_recipient text; v_source text; v_fingerprint text;
  v_duplicate boolean := false; v_now timestamptz := clock_timestamp();
begin
  select * into v_member from public.care_memberships where user_id = auth.uid();
  if not found then raise exception 'CARE_FORBIDDEN'; end if;
  if p_request_id is null then raise exception 'CARE_INVALID'; end if;
  if p_card_id is not null then
    select * into v_card from public.care_cards where id = p_card_id and person_id = v_member.person_id and clinic_id = v_member.clinic_id for share;
    if not found then raise exception 'CARE_CARD_UNKNOWN'; end if;
    if not v_card.active then raise exception 'CARE_CARD_REVOKED'; end if;
    v_docs := v_card.document_ids; v_recipient := v_card.clinic_id; v_source := 'card';
  else
    if v_member.role <> 'owner' then raise exception 'CARE_FORBIDDEN'; end if;
    v_docs := p_document_ids; v_recipient := p_recipient_id; v_source := 'app';
  end if;
  if v_recipient is distinct from v_member.clinic_id then raise exception 'CARE_RECIPIENT'; end if;
  if coalesce(cardinality(v_docs),0) not between 1 and 10 then raise exception 'CARE_DOCUMENTS'; end if;
  select array_agg(distinct item order by item) into v_docs from unnest(v_docs) as t(item);
  if exists(select 1 from unnest(v_docs) as t(item) where item is null)
     or (select count(*) from public.care_documents where person_id = v_member.person_id and id = any(v_docs)) <> cardinality(v_docs)
  then raise exception 'CARE_DOCUMENTS'; end if;
  v_fingerprint := jsonb_build_object('documents',v_docs,'recipient',v_recipient,'source',v_source,'card',p_card_id)::text;
  -- Serializes all handoff changes for this person/recipient and request replays for the actor.
  perform pg_advisory_xact_lock(hashtextextended('care-request:' || auth.uid()::text || ':' || p_request_id::text,0));
  select * into v_previous from public.care_requests where user_id = auth.uid() and request_id = p_request_id;
  if found then
    if v_previous.fingerprint <> v_fingerprint then raise exception 'CARE_REQUEST_CONFLICT'; end if;
    return jsonb_build_object('handoffId',v_previous.handoff_id,'duplicate',true);
  end if;
  perform pg_advisory_xact_lock(hashtextextended('care-package:' || v_member.person_id || ':' || v_recipient,0));
  select * into v_handoff from public.care_handoffs where person_id = v_member.person_id and clinic_id = v_recipient and document_ids = v_docs and status <> 'withdrawn' limit 1;
  if found then v_duplicate := true;
  else
    insert into public.care_handoffs(person_id,clinic_id,document_ids,source,created_at,updated_at,events)
    values(v_member.person_id,v_recipient,v_docs,v_source,v_now,v_now,
      jsonb_build_array(jsonb_build_object('id',gen_random_uuid(),'at',v_now,'actor',v_member.display_name,
        'label',case when v_source = 'card' then 'Kartenscan: freigegebenes Paket eingegangen' else 'Dokumentpaket freigegeben und eingegangen' end)))
    returning * into v_handoff;
  end if;
  insert into public.care_requests(user_id,request_id,fingerprint,handoff_id) values(auth.uid(),p_request_id,v_fingerprint,v_handoff.id);
  if v_source = 'card' then
    insert into public.scans(card_id,person_id,clinic_id,actor_id,request_id,handoff_id)
    values(p_card_id,v_member.person_id,v_recipient,auth.uid(),p_request_id,v_handoff.id);
  end if;
  return jsonb_build_object('handoffId',v_handoff.id,'duplicate',v_duplicate);
end
$$;

create or replace function public.care_transition_handoff(p_handoff_id uuid, p_expected_revision integer, p_action text, p_note text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_member public.care_memberships%rowtype; v_handoff public.care_handoffs%rowtype;
  v_now timestamptz := clock_timestamp(); v_status text; v_label text;
begin
  select * into v_member from public.care_memberships where user_id = auth.uid();
  if not found then raise exception 'CARE_FORBIDDEN'; end if;
  if p_action not in ('accept','clarify','withdraw','reply') or p_action is null or p_expected_revision is null or p_expected_revision < 1 or length(coalesce(p_note,'')) > 1000 then raise exception 'CARE_INVALID'; end if;
  if (p_action in ('withdraw','reply') and v_member.role <> 'owner') or (p_action in ('accept','clarify') and v_member.role <> 'clinic') then raise exception 'CARE_FORBIDDEN'; end if;
  perform pg_advisory_xact_lock(hashtextextended('care-package:' || v_member.person_id || ':' || v_member.clinic_id,0));
  select * into v_handoff from public.care_handoffs where id = p_handoff_id and person_id = v_member.person_id and clinic_id = v_member.clinic_id for update;
  if not found then raise exception 'CARE_HANDOFF_UNKNOWN'; end if;
  if v_handoff.revision <> p_expected_revision then raise exception 'CARE_STALE_REVISION'; end if;
  if v_handoff.status in ('accepted','withdrawn') then raise exception 'CARE_TERMINAL'; end if;
  if p_action = 'reply' and v_handoff.status <> 'clarification' then raise exception 'CARE_INVALID'; end if;
  if jsonb_array_length(v_handoff.events) >= 100 then raise exception 'CARE_EVENT_LIMIT'; end if;
  if (p_action = 'clarify' and length(btrim(coalesce(p_note,''))) < 5) or (p_action = 'reply' and length(btrim(coalesce(p_note,''))) < 1) then raise exception 'CARE_NOTE'; end if;
  v_status := case p_action when 'accept' then 'accepted' when 'clarify' then 'clarification' when 'reply' then 'received' else 'withdrawn' end;
  v_label := case p_action when 'accept' then 'Dem Fall zugeordnet und in der Akte bestätigt' when 'clarify' then 'Klärung erforderlich: ' || btrim(p_note) when 'reply' then 'Rückfrage beantwortet: ' || btrim(p_note) else 'Vor Aktenübernahme zurückgezogen' end;
  if p_action = 'accept' then
    insert into public.care_records(person_id,clinic_id,document_id,accepted_at,handoff_id)
      select v_handoff.person_id,v_handoff.clinic_id,doc,v_now,v_handoff.id from unnest(v_handoff.document_ids) as t(doc)
      on conflict(person_id,clinic_id,document_id) do nothing;
  end if;
  update public.care_handoffs set status=v_status,revision=revision+1,updated_at=v_now,
    accepted_at=case when p_action='accept' then v_now else accepted_at end,note=nullif(btrim(p_note),''),
    events=events || jsonb_build_array(jsonb_build_object('id',gen_random_uuid(),'at',v_now,'actor',v_member.display_name,'label',v_label))
    where id=v_handoff.id returning * into v_handoff;
  return jsonb_build_object('handoffId',v_handoff.id,'revision',v_handoff.revision,'status',v_handoff.status);
end
$$;

create or replace function public.care_set_card_status(p_active boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_member public.care_memberships%rowtype; v_id text;
begin
  select * into v_member from public.care_memberships where user_id=auth.uid() and role='owner';
  if not found then raise exception 'CARE_FORBIDDEN'; end if;
  if p_active is null then raise exception 'CARE_INVALID'; end if;
  update public.care_cards set active=p_active,updated_at=clock_timestamp() where person_id=v_member.person_id and clinic_id=v_member.clinic_id returning id into v_id;
  if not found then raise exception 'CARE_CARD_UNKNOWN'; end if;
  return jsonb_build_object('card',v_id,'active',p_active);
end
$$;
revoke all on function public.care_submit_handoff(text[],text,uuid,text), public.care_transition_handoff(uuid,integer,text,text), public.care_set_card_status(boolean) from public, anon;
grant execute on function public.care_submit_handoff(text[],text,uuid,text), public.care_transition_handoff(uuid,integer,text,text), public.care_set_card_status(boolean) to authenticated;

-- All workspace reads use one MVCC snapshot; a receipt cannot be newer than the returned record.
-- STABLE uses the calling statement's snapshot: postgresql.org/docs/current/xfunc-volatility.html
create or replace function public.care_read_workspace()
returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'membership',to_jsonb(m),
    'person',(select to_jsonb(p) from public.care_people p where p.id=m.person_id),
    'clinic',(select to_jsonb(c) from public.care_clinics c where c.id=m.clinic_id),
    'documents',(select coalesce(jsonb_agg(to_jsonb(d) order by d.version,d.id),'[]'::jsonb) from public.care_documents d where d.person_id=m.person_id),
    'handoffs',(select coalesce(jsonb_agg(to_jsonb(h) order by h.created_at desc),'[]'::jsonb) from public.care_handoffs h where h.person_id=m.person_id and h.clinic_id=m.clinic_id),
    'records',(select coalesce(jsonb_agg(to_jsonb(r)),'[]'::jsonb) from public.care_records r where r.person_id=m.person_id and r.clinic_id=m.clinic_id),
    'card',(select to_jsonb(ca) from public.care_cards ca where ca.person_id=m.person_id and ca.clinic_id=m.clinic_id)
  ) from public.care_memberships m where m.user_id=auth.uid()
$$;
revoke all on function public.care_read_workspace() from public, anon;
grant execute on function public.care_read_workspace() to authenticated;

insert into storage.buckets(id,name,public) values('care-documents','care-documents',false)
on conflict(id) do update set public=false;
drop policy if exists care_private_document_read on storage.objects;
create policy care_private_document_read on storage.objects for select to authenticated
using (bucket_id='care-documents' and exists(select 1 from public.care_documents d where d.storage_path=storage.objects.name and public.care_document_visible(d.id)));

-- Restrictive guards keep an unrelated older broad policy from opening this private bucket.
-- Other buckets are unaffected; service_role seed/admin operations bypass RLS as usual.
drop policy if exists care_bucket_anon_read_guard on storage.objects;
create policy care_bucket_anon_read_guard on storage.objects as restrictive for select to anon
using (bucket_id <> 'care-documents');
drop policy if exists care_bucket_user_read_guard on storage.objects;
create policy care_bucket_user_read_guard on storage.objects as restrictive for select to authenticated
using (bucket_id <> 'care-documents' or exists(select 1 from public.care_documents d where d.storage_path=storage.objects.name and public.care_document_visible(d.id)));
drop policy if exists care_bucket_insert_guard on storage.objects;
create policy care_bucket_insert_guard on storage.objects as restrictive for insert to anon, authenticated
with check (bucket_id <> 'care-documents');
drop policy if exists care_bucket_update_guard on storage.objects;
create policy care_bucket_update_guard on storage.objects as restrictive for update to anon, authenticated
using (bucket_id <> 'care-documents') with check (bucket_id <> 'care-documents');
drop policy if exists care_bucket_delete_guard on storage.objects;
create policy care_bucket_delete_guard on storage.objects as restrictive for delete to anon, authenticated
using (bucket_id <> 'care-documents');

-- Do not publish twice; no anonymous subscriber can read scoped rows through RLS.
do $$
begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime') then
    if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='scans') then
      alter publication supabase_realtime add table public.scans;
    end if;
    if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='care_handoffs') then
      alter publication supabase_realtime add table public.care_handoffs;
    end if;
  end if;
end $$;
notify pgrst, 'reload schema';
commit;
