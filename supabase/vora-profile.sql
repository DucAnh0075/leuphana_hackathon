-- Additive VORA profile storage. Run after review in the linked project's SQL editor.
-- Independent of care_memberships/clinical sharing; no service-role credential in runtime.
-- Roll forward: rerunning is safe. Do not drop tables containing personal drafts.
begin;
create table if not exists public.vora_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  revision bigint not null default 0 check (revision >= 0),
  payload jsonb not null check (jsonb_typeof(payload) = 'object' and payload->>'version' = '1' and octet_length(payload::text) <= 1000000),
  updated_at timestamptz not null default now()
);
create table if not exists public.vora_profile_requests (
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null,
  request_fingerprint text not null,
  created_at timestamptz not null default now(),
  primary key(user_id, request_id)
);
alter table public.vora_profiles enable row level security;
alter table public.vora_profile_requests enable row level security;
drop policy if exists vora_profile_owner on public.vora_profiles;
create policy vora_profile_owner on public.vora_profiles for select to authenticated using (user_id = auth.uid());
drop policy if exists vora_request_owner on public.vora_profile_requests;
create policy vora_request_owner on public.vora_profile_requests for select to authenticated using (user_id = auth.uid());
revoke all on public.vora_profiles, public.vora_profile_requests from anon, authenticated;
grant select on public.vora_profiles to authenticated;

create or replace function public.vora_profile_read() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare result jsonb;
begin
  if auth.uid() is null then raise insufficient_privilege; end if;
  select jsonb_build_object('revision', revision, 'payload', payload) into result from public.vora_profiles where user_id = auth.uid();
  return result;
end $$;

create or replace function public.vora_profile_save(p_expected_revision bigint, p_request_id uuid, p_payload jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid(); current_row public.vora_profiles%rowtype; prior text; fingerprint text;
begin
  if actor is null then raise insufficient_privilege; end if;
  if p_request_id is null or p_expected_revision is null or p_expected_revision < 0 or p_payload is null or jsonb_typeof(p_payload) <> 'object' or p_payload->>'version' is distinct from '1' or octet_length(p_payload::text) > 1000000 then raise exception 'VORA_INVALID'; end if;
  -- Serialize the first insert as well as subsequent saves. No read/check/write race.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(actor::text, 0));
  fingerprint := pg_catalog.md5(p_expected_revision::text || ':' || p_payload::text);
  select request_fingerprint into prior from public.vora_profile_requests where user_id = actor and request_id = p_request_id;
  if prior is not null then
    if prior <> fingerprint then raise exception 'VORA_REQUEST_CONFLICT'; end if;
    return public.vora_profile_read();
  end if;
  select * into current_row from public.vora_profiles where user_id = actor for update;
  if coalesce(current_row.revision, 0) <> p_expected_revision then raise exception 'VORA_STALE_REVISION'; end if;
  insert into public.vora_profiles(user_id, revision, payload) values (actor, 1, p_payload)
  on conflict(user_id) do update set revision = public.vora_profiles.revision + 1, payload = excluded.payload, updated_at = now();
  insert into public.vora_profile_requests(user_id, request_id, request_fingerprint) values (actor, p_request_id, fingerprint);
  return public.vora_profile_read();
end $$;
revoke all on function public.vora_profile_read() from public, anon;
revoke all on function public.vora_profile_save(bigint, uuid, jsonb) from public, anon;
grant execute on function public.vora_profile_read() to authenticated;
grant execute on function public.vora_profile_save(bigint, uuid, jsonb) to authenticated;
commit;
