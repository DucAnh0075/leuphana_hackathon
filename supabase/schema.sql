-- Im Supabase-Dashboard → SQL Editor ausführen.
-- Meldet die letzte alter-Zeile „already member of publication“, ist Realtime schon aktiv – kein Problem.
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
notify pgrst, 'reload schema';
alter publication supabase_realtime add table public.scans;
