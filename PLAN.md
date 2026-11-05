# NFC-Notfallkarte → Vorsorgedokumente anzeigen

> Teamplan für den Leuphana AI Hackathon (05.11.2026). Thema: digitales Tool für Patientenverfügung und Vorsorgevollmacht.

## 1. Idee in einem Satz
Man hält ein iPhone an eine NFC-Karte, und im Browser des PCs öffnet sich sofort eine Seite mit **allen hinterlegten Vorsorgedokumenten** (Vorsorgevollmacht, Patientenverfügung, Betreuungsverfügung …). Jedes PDF lässt sich Seite für Seite durchblättern.

## 2. Wichtig zu wissen
- **Auf der Karte liegen keine PDFs.** Eine NFC-Karte speichert nur ca. 144–888 Bytes. Die Karte ist nur der **Auslöser**: Sobald eine Karte erkannt wird, zeigt die Website alle PDFs aus Supabase Storage.
- **Das iPhone liest die Karte**, statt eines USB-Readers. Der PC hat `https://leuphanahackathon.vercel.app/` bereits offen. Für Notfälle gibt es zusätzlich den Button **„Karte simulieren“**.
- **Weg 1: iOS-Kurzbefehl-Automation (empfohlen für die Demo).** Kurzbefehle → Automation → + → NFC → Scannen → Karte ans iPhone halten und Namen vergeben. Aktion „Inhalte von URL abrufen“ mit `https://leuphanahackathon.vercel.app/api/scan?card=demo` hinzufügen. „Sofort ausführen“ aktivieren, „Bei Ausführung benachrichtigen“ deaktivieren. Die Karte muss dafür **nicht beschrieben** werden; Safari und das Antippen einer Mitteilung entfallen.
- **Weg 2: URL auf der Karte mit NFC Tools (Fallback).** Schreiben → Datensatz hinzufügen → URL → `https://leuphanahackathon.vercel.app/scan?card=demo` → Schreiben. Karte **nicht sperren**. iPhone an die Karte halten → Mitteilung antippen → Safari öffnet `/scan`, sendet den Scan und zeigt „✓ An PC gesendet“.
- Für den Hackathon verzichten wir bewusst auf Login, Admin-Seite und DSGVO-Maßnahmen. Das gehört in den Pitch als „nächster Schritt“.

## 3. Tech-Stack
| Teil | Technologie |
|---|---|
| Frontend + API | **Next.js** (App Router, TypeScript, Tailwind) |
| Hosting | **Vercel** |
| PDF-Speicher | **Supabase Storage**, öffentlicher Bucket `documents` |
| PDF-Anzeige | **react-pdf** (basiert auf pdf.js) |
| Kartenerkennung | **Supabase Realtime** + Tabelle `scans` |

## 4. Ablauf
```
PC (Chrome, Vollbild): https://leuphanahackathon.vercel.app/
   „Notfallkarte mit dem Handy scannen …“
   ▲  Supabase Realtime: INSERT in scans → useCardReader → onCard(cardId)
   │
API /api/scan?card=<id> (Next.js auf Vercel) → insert into scans(card_id)
   ▲
   └─ iPhone liest die NFC-Karte (Weg 1 oder Weg 2)

PC: onCard(cardId) → router.push('/dokumente')
   ▼
/dokumente  (Server Component)
   │  listet alle PDFs im Supabase-Bucket `documents` → öffentliche URLs
   ▼
PdfViewer: Dokument-Tabs → Seiten-Thumbnails → große Seite, Blättern, Zoom
   └ Button „Fertig“ oder 2 Min. Inaktivität → zurück zu „/“
```

## 5. Projektstruktur
```
app/
  page.tsx                 # Startseite / Kiosk: „Karte auflegen“
  api/scan/route.ts        # GET/POST: Scan in scans eintragen
  scan/page.tsx            # iPhone: Scan senden und bestätigen
  dokumente/page.tsx       # lädt alle PDFs aus Supabase, rendert den Viewer
  layout.tsx
components/
  PdfViewer.tsx            # Client: Tabs, Thumbnails, Seitenansicht
  CardListener.tsx         # Client: nutzt useCardReader, leitet weiter
hooks/
  useCardReader.ts         # Supabase Realtime: INSERT in scans → onCard
lib/
  supabase.ts              # Supabase-Client
supabase/
  schema.sql              # Tabelle scans, RLS und Realtime
public/
  (optional) Fallback-PDFs, falls Supabase in der Demo nicht erreichbar ist
.env.example
PLAN.md
README.md
```

## 6. Umsetzung, Schritt für Schritt

### Schritt 1: Setup
```bash
npx create-next-app@latest vorsorge-nfc --ts --tailwind --app
cd vorsorge-nfc
npm i @supabase/supabase-js react-pdf
```
`.env.local` (und dasselbe in Vercel unter Settings → Environment Variables):
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### Schritt 2: Supabase
1. Projekt auf supabase.com anlegen
2. Unter Storage einen neuen Bucket `documents` anlegen und **Public** anhaken
3. PDFs per Drag & Drop im Dashboard hochladen (keine Admin-Seite nötig). Dateinamen sprechend wählen, sie werden als Titel angezeigt, z. B. `Vorsorgevollmacht.pdf`, `Patientenverfuegung.pdf`, `Betreuungsverfuegung.pdf`.

### Schritt 3: PDFs sammeln (Content-Team)
So viele passende PDFs wie möglich zusammentragen, vor allem von den offiziellen BMJV-Seiten aus dem Briefing:
- Vorsorgevollmacht / Betreuungsverfügung: https://www.bmjv.de/DE/service/formulare/form_vorsorgevollmacht/form_vorsorgevollmacht_node.html
- Patientenverfügung (Broschüre + Textbausteine): https://www.bmjv.de/DE/themen/vorsorge_betreuungsrecht/patientenverfuegung/patientenverfuegung_node.html
- zusätzlich Beispiele bzw. ausgefüllte Muster (fiktive Person „Max Mustermann“), Notfallausweis, Organspendeausweis usw.

Alles in den Bucket `documents` hochladen.

### Schritt 4: Dokumente laden (`app/dokumente/page.tsx`)
- `supabase.storage.from('documents').list('', { limit: 100, sortBy: { column: 'name', order: 'asc' } })`
- nur `.pdf` behalten. Pro Datei mit `getPublicUrl(name)` die URL holen und den Titel aus dem Dateinamen bilden (ohne `.pdf`, `_` wird zu Leerzeichen).
- `export const dynamic = 'force-dynamic'`, damit neu hochgeladene PDFs sofort erscheinen
- Liste `{ title, url }[]` an `<PdfViewer docs={...} />` übergeben

### Schritt 5: Karte erkennen (`hooks/useCardReader.ts`)
- `useCardReader({ onCard })` abonniert per Supabase Realtime INSERTs in `public.scans` und ruft `onCard(cardId: string)` auf.
- Rückgabe: `{ status: 'connecting' | 'connected' | 'offline' }`; ohne Supabase-Konfiguration ist der Status `offline`.
- Callback in einer Ref per Effect aktualisieren, Channel beim Unmount entfernen.

### Schritt 6: Startseite (`app/page.tsx` + `components/CardListener.tsx`)
- großer, ruhiger Bildschirm: Karten-Icon mit Puls-Animation, Text „Notfallkarte auf den Reader legen“
- kleiner Status unten: „Verbinde ...“ / „Bereit - Karte mit dem iPhone scannen“
- bei Karte: kurze Erfolgsanimation („Karte erkannt ✓“), dann `router.push('/dokumente')`
- Button **„Karte simulieren“** (und Leertaste), der dasselbe auslöst, als Absicherung für die Demo

### Schritt 7: PDF-Viewer (`components/PdfViewer.tsx`)
- `'use client'`. In der Page per `next/dynamic(() => import(...), { ssr: false })` laden, weil pdf.js `window` braucht.
- Worker einrichten:
  ```ts
  import { pdfjs, Document, Page } from 'react-pdf';
  import 'react-pdf/dist/Page/AnnotationLayer.css';
  import 'react-pdf/dist/Page/TextLayer.css';
  pdfjs.GlobalWorkerOptions.workerSrc =
    new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
  ```
- Layout:
  - **oben** Tabs bzw. Kacheln, eine pro PDF (Titel + Seitenzahl)
  - **links** Thumbnail-Leiste mit allen Seiten des aktiven PDFs (`<Page width={120} />`), Klick springt zur Seite
  - **Mitte** große aktuelle Seite (`<Page pageNumber={n} width={containerWidth} />`)
  - **unten** ← → Buttons, „Seite x von y“, Zoom +/−, „Herunterladen“, „Fertig“
- Pfeiltasten blättern, `Esc` bzw. „Fertig“ führt zurück zu `/`
- Inaktivitäts-Timer: nach 2 Minuten ohne Eingabe zurück zu `/`
- `useCardReader` ist auch hier aktiv: Eine neue Karte lädt die Seite neu
- große Schrift, hoher Kontrast, alles auch per Tastatur bedienbar (Thema „barrierearm“)

### Schritt 8: Scans empfangen
In `supabase/schema.sql` Tabelle, RLS und Realtime einrichten:
```sql
create table scans (
  id bigint generated always as identity primary key,
  card_id text not null default 'demo',
  created_at timestamptz not null default now()
);
alter table scans enable row level security;
create policy "anon insert" on scans for insert to anon with check (true);
create policy "anon select" on scans for select to anon using (true);
alter publication supabase_realtime add table scans;
```
- `app/api/scan/route.ts`: GET und POST, `card` aus Query bzw. Body (Standard `demo`), Insert in `scans`, Antwort `{ ok: true }`.
- `app/scan/page.tsx`: ruft beim Laden `/api/scan` auf, zeigt „✓ An PC gesendet“ und einen Button „Nochmal senden“.

### Schritt 9: Deployment
1. Repo auf GitHub pushen
2. Auf vercel.com „Import Project“ wählen, Env-Variablen setzen und deployen
3. Auf dem Demo-Laptop: Chrome im Vollbild (F11) auf der Vercel-URL

### Schritt 10: iPhone einrichten
iOS-Kurzbefehl-Automation nach **Weg 1 in Abschnitt 2** einrichten und testen. Zusätzlich die Fallback-URL mit **NFC Tools nach Weg 2 in Abschnitt 2** auf die Karte schreiben und testen. Karte nicht sperren.

## 7. Aufgabenteilung (Vorschlag)
| Wer | Aufgabe | Schritte |
|---|---|---|
| Person 1 | Setup, Supabase, Deployment | 1, 2, 4, 9 |
| Person 2 | Kartenerkennung: iPhone-Scan, Realtime-Hook | 5, 8, 10 |
| Person 3 | UI: Startseite + PDF-Viewer | 6, 7 |
| Person 4 | Content (PDFs sammeln, Mustermann-Dokumente) + Pitch | 3 |

Schnittstellen, an die sich alle halten:
- `useCardReader({ onCard })` ruft `onCard(cardId: string)` auf und liefert `{ status: 'connecting' | 'connected' | 'offline' }`.
- API: `/api/scan?card=<id>` trägt einen Scan in `scans` ein.
- Der Viewer bekommt `docs: { title: string; url: string }[]`.

## 8. Testen / Demo-Check
1. **iPhone-Test:** Scan am iPhone → PC zeigt die Dokumente in unter 2 s (Weg 1 und Weg 2 testen).
2. `npm run dev` → `http://localhost:3000`: Karte mit dem iPhone scannen führt zu `/dokumente`, alle PDFs aus dem Bucket erscheinen als Tabs
3. Jedes PDF prüfen: alle Seiten sichtbar, Thumbnails, Blättern mit Buttons und Pfeiltasten, Zoom, Download
4. „Karte simulieren“, den „Fertig“-Button und das Zurückspringen nach 2 Min. testen
5. Ein neues PDF im Supabase-Dashboard hochladen und neu laden: Es muss ohne Deploy erscheinen
6. Dasselbe gegen `https://leuphanahackathon.vercel.app/` mit aktivem Supabase Realtime wiederholen.

**Akzeptanz (Issue 32):** Bei offener PC-Seite `/` führt der Aufruf von `/api/scan?card=demo` automatisch zum Sprung auf `/dokumente`.

## 9. Ausblick für den Pitch (nicht im Hackathon-Umfang)
- pro Karte eigene Dokumente (Zuordnung Karten-UID → Person)
- DSGVO Art. 9: privater Bucket, Signed URLs, PIN bzw. Notfallzugang für Ärzt:innen
- Upload/Erstellung der Dokumente direkt in der App (BMJV-Vorlagen, KI-gestützt, mehrsprachig, einfache Sprache)

## 10. Agents (Claude Code + Codex)
Unter `.claude/agents/` liegen vier Agents. Die drei Coding-Agents sind schlanke Claude-Hüllen (Haiku, low). Das eigentliche Coden geben sie per `codex exec` an **GPT-6 Astra (Reasoning low)** weiter, danach prüfen sie den Build und melden das Ergebnis.

| Agent | Aufgabe | Schritte | Issue-Label |
|---|---|---|---|
| `nfc-setup` | Next.js-Gerüst, Supabase, `/dokumente`, Deployment | 1, 2, 4, 9 | `setup` |
| `nfc-reader` | `useCardReader` (Supabase Realtime) + iPhone-Anleitung | 5, 8, 10 | `reader` |
| `nfc-ui` | Startseite + PDF-Viewer | 6, 7 | `ui` |
| `nfc-content` | PDFs recherchieren und herunterladen (kein Codex) | 3 | `content` |

Voraussetzung: Codex CLI installiert und eingeloggt (`codex login`).
Aufruf in Claude Code, z. B.: *„Nutze den Agent nfc-ui für Issue #15“*.
Reihenfolge: zuerst `nfc-setup`, danach `nfc-reader`, `nfc-ui` und `nfc-content` parallel. Die Logs von Codex landen in `.agent-logs/` (nicht im Git).
