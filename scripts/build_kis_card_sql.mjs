import { readFileSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
export function buildKisCardSql() {
  const patient = JSON.parse(readFileSync(resolve(root, "lib/demo-patients.json"), "utf8")).patients.find(patient => patient.id === "26004179");
  const documents = patient.documents.map(({ url, ...doc }) => ({ ...doc, file: basename(url) }));
  const literal = value => "'" + JSON.stringify(value).replaceAll("'", "''") + "'::jsonb";
  return `-- Run once in the Supabase SQL editor (safe to rerun).
-- Upload PDFs as Vorsorgevollmacht.pdf and Patientenverfuegung.pdf to the public bucket documents.
create table if not exists public.kis_cards (
  id text primary key, patient_id text not null, documents jsonb not null,
  facts jsonb not null default '[]', care_preferences jsonb not null default '[]',
  updated_at timestamptz not null default now()
);
alter table public.kis_cards enable row level security;
drop policy if exists kis_cards_select on public.kis_cards;
create policy kis_cards_select on public.kis_cards for select to anon, authenticated using (true);
grant select on public.kis_cards to anon, authenticated;

create table if not exists public.kis_card_scans (
  id bigint generated always as identity primary key,
  card_id text not null check (char_length(card_id) between 1 and 64),
  created_at timestamptz not null default now()
);
alter table public.kis_card_scans enable row level security;
drop policy if exists kis_card_scans_insert on public.kis_card_scans;
create policy kis_card_scans_insert on public.kis_card_scans for insert to anon, authenticated with check (true);
drop policy if exists kis_card_scans_select on public.kis_card_scans;
create policy kis_card_scans_select on public.kis_card_scans for select to anon, authenticated using (true);
grant select, insert on public.kis_card_scans to anon, authenticated;
grant usage on sequence public.kis_card_scans_id_seq to anon, authenticated;
do $$
begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime') then
    if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='kis_card_scans') then
      alter publication supabase_realtime add table public.kis_card_scans;
    end if;
  end if;
end $$;

insert into public.kis_cards (id, patient_id, documents, facts, care_preferences)
values ('demo', '26004179', ${literal(documents)}, ${literal(patient.facts)}, ${literal(patient.carePreferences)})
on conflict (id) do update set patient_id = excluded.patient_id, documents = excluded.documents,
  facts = excluded.facts, care_preferences = excluded.care_preferences, updated_at = now();
`;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  writeFileSync(resolve(root, "supabase/kis-card.sql"), buildKisCardSql());
}
