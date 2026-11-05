-- Im Supabase-Dashboard SQL Editor ausführen.
create table if not exists public.scans (
  id bigint generated always as identity primary key,
  card_id text not null default 'demo',
  created_at timestamptz not null default now()
);

alter table public.scans enable row level security;
drop policy if exists "anon insert" on public.scans;
create policy "anon insert" on public.scans for insert to anon with check (true);
drop policy if exists "anon select" on public.scans;
create policy "anon select" on public.scans for select to anon using (true);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'scans'
  ) then
    alter publication supabase_realtime add table public.scans;
  end if;
end;
$$;
