# NFC-Notfallkarte → Vorsorgedokumente anzeigen

> Teamplan für den Leuphana AI Hackathon (05.11.2026). Thema: digitales Tool für Patientenverfügung und Vorsorgevollmacht.

## 1. Idee in einem Satz
Man legt eine NFC-Karte auf einen USB-NFC-Reader am Laptop, und im Browser öffnet sich sofort eine Seite mit **allen hinterlegten Vorsorgedokumenten** (Vorsorgevollmacht, Patientenverfügung, Betreuungsverfügung …). Jedes PDF lässt sich Seite für Seite durchblättern.

## 2. Wichtig zu wissen
- **Auf der Karte liegen keine PDFs.** Eine NFC-Karte speichert nur ca. 144–888 Bytes. Die Karte ist nur der **Auslöser**: Sobald eine Karte erkannt wird, zeigt die Website alle PDFs aus Supabase Storage.
- **Den Reader-Typ kennen wir noch nicht.** Ein Test dauert 10 Sekunden: Notepad öffnen, Cursor ins Feld setzen, Karte auflegen.
  - Werden Zahlen und Buchstaben getippt, ist es ein **Tastatur-Reader (Variante A)**. Wir brauchen keinen Treiber, die Website liest die Eingabe direkt.
  - Passiert nichts, ist es ein **PC/SC-Reader (Variante B)**, z. B. ACR122U. Dann braucht es ein kleines Node-Skript, das unter **Windows** läuft (nicht in WSL, weil WSL keinen USB-Zugriff hat).
- Wir bauen **beide Varianten** ein, damit es egal ist, welcher Reader es ist. Für Notfälle gibt es zusätzlich einen Button **„Karte simulieren“**.
- Die Karte muss vorerst **nicht beschrieben** werden. Jede Karte hat ab Werk eine eindeutige UID, und das reicht als Auslöser. Optional kann man mit der App **NFC Tools (wakdev)** die Website-URL auf die Karte schreiben, dann öffnet sich die Seite auch beim Antippen mit dem iPhone.
- Für den Hackathon verzichten wir bewusst auf Login, Admin-Seite und DSGVO-Maßnahmen. Das gehört in den Pitch als „nächster Schritt“.

## 3. Tech-Stack
| Teil | Technologie |
|---|---|
| Frontend + API | **Next.js** (App Router, TypeScript, Tailwind) |
| Hosting | **Vercel** |
| PDF-Speicher | **Supabase Storage**, öffentlicher Bucket `documents` |
| PDF-Anzeige | **react-pdf** (basiert auf pdf.js) |
| Reader-Bridge (nur Variante B) | Node.js + `nfc-pcsc` + `ws`, lokal auf dem Windows-Laptop |

## 4. Ablauf
```
Karte auf USB-Reader legen
   │
   ├─ A: Tastatur-Reader tippt UID + Enter ───────────────────────┐
   └─ B: bridge/reader.js (Windows) liest UID                      │
         → sendet über WebSocket ws://localhost:8787 ──────────────┤
                                                                   ▼
Browser (Chrome, Vollbild): Startseite „/“ „Karte auflegen …“
   │  useCardReader() erkennt die Karte → router.push('/dokumente')
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
  dokumente/page.tsx       # lädt alle PDFs aus Supabase, rendert den Viewer
  layout.tsx
components/
  PdfViewer.tsx            # Client: Tabs, Thumbnails, Seitenansicht
  CardListener.tsx         # Client: nutzt useCardReader, leitet weiter
hooks/
  useCardReader.ts         # Tastatur-Variante + WebSocket-Variante
lib/
  supabase.ts              # Supabase-Client
bridge/                    # nur für PC/SC-Reader, läuft lokal unter Windows
  package.json
  reader.js
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
Der Hook ruft `onCard(uid)` auf, egal über welche Variante die Karte kommt:
- **Variante A (Tastatur):** `window.addEventListener('keydown')` puffert Zeichen, wenn sie schnell hintereinander kommen (< 50 ms Abstand, so schnell tippt kein Mensch). Bei `Enter` mit mindestens 4 Zeichen im Puffer wird `onCard(buffer)` aufgerufen.
- **Variante B (WebSocket):** `new WebSocket('ws://localhost:8787')`, bei `onmessage` folgt `onCard(JSON.parse(data).uid)`. Bei Fehlern wird alle 3 s ein neuer Verbindungsversuch gestartet. Chrome erlaubt `ws://localhost` auch von der https-Vercel-Seite aus.
- Außerdem gibt der Hook einen Status zurück (`'keyboard' | 'bridge-connected'`), der auf der Startseite angezeigt wird

### Schritt 6: Startseite (`app/page.tsx` + `components/CardListener.tsx`)
- großer, ruhiger Bildschirm: Karten-Icon mit Puls-Animation, Text „Notfallkarte auf den Reader legen“
- kleiner Status unten: „Reader bereit (Tastatur)“ / „Reader-Bridge verbunden“
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

### Schritt 8: Reader-Bridge (nur Variante B, `bridge/`)
`bridge/package.json`: Dependencies `nfc-pcsc`, `ws`

`bridge/reader.js`, ungefähr so:
```js
const { NFC } = require('nfc-pcsc');
const { WebSocketServer } = require('ws');
const wss = new WebSocketServer({ port: 8787 });
const nfc = new NFC();
nfc.on('reader', reader => {
  console.log('Reader:', reader.name);
  reader.on('card', card => {
    console.log('Karte:', card.uid);
    const msg = JSON.stringify({ uid: card.uid });
    wss.clients.forEach(c => c.readyState === 1 && c.send(msg));
  });
  reader.on('error', e => console.error(e));
});
console.log('Bridge läuft auf ws://localhost:8787');
```
Start (in **Windows**-PowerShell, nicht in WSL):
```powershell
cd bridge
npm install
node reader.js
```
Schlägt `npm install` bei `nfc-pcsc` fehl (native Module), hilft `npm i -g windows-build-tools` bzw. die Installation der Visual Studio Build Tools. Ein Fallback in Python wäre `pyscard` + `websockets` mit derselben Nachricht `{ "uid": "..." }`.

### Schritt 9: Deployment
1. Repo auf GitHub pushen
2. Auf vercel.com „Import Project“ wählen, Env-Variablen setzen und deployen
3. Auf dem Demo-Laptop: Chrome im Vollbild (F11) auf der Vercel-URL, bei Variante B läuft zusätzlich `node bridge/reader.js`

### Schritt 10 (optional): Karte beschreiben für das iPhone
In der App **NFC Tools** (wakdev): Schreiben → Datensatz hinzufügen → URL → `https://<app>.vercel.app/dokumente` → Schreiben → Karte ans iPhone halten.
Danach öffnet ein entsperrtes iPhone die Seite beim Antippen der Karte. Die Karte **nicht sperren**, solange sich die URL noch ändern kann.

## 7. Aufgabenteilung (Vorschlag)
| Wer | Aufgabe | Schritte |
|---|---|---|
| Person 1 | Setup, Supabase, Deployment | 1, 2, 4, 9 |
| Person 2 | Kartenerkennung: Reader testen, Hook, Bridge | 5, 8, 10 |
| Person 3 | UI: Startseite + PDF-Viewer | 6, 7 |
| Person 4 | Content (PDFs sammeln, Mustermann-Dokumente) + Pitch | 3 |

Schnittstellen, an die sich alle halten:
- Der Hook liefert `onCard(uid: string)`.
- Die Bridge sendet `{"uid": "..."}` an `ws://localhost:8787`.
- Der Viewer bekommt `docs: { title: string; url: string }[]`.

## 8. Testen / Demo-Check
1. **Reader-Test:** Notepad öffnen, Karte auflegen → Variante A oder B feststellen. Bei B muss `node bridge/reader.js` die UID in der Konsole ausgeben.
2. `npm run dev` → `http://localhost:3000`: Karte auflegen führt zu `/dokumente`, alle PDFs aus dem Bucket erscheinen als Tabs
3. Jedes PDF prüfen: alle Seiten sichtbar, Thumbnails, Blättern mit Buttons und Pfeiltasten, Zoom, Download
4. „Karte simulieren“, den „Fertig“-Button und das Zurückspringen nach 2 Min. testen
5. Ein neues PDF im Supabase-Dashboard hochladen und neu laden: Es muss ohne Deploy erscheinen
6. Dasselbe gegen die Vercel-URL wiederholen (bei Variante B mit lokal laufender Bridge)

## 9. Ausblick für den Pitch (nicht im Hackathon-Umfang)
- pro Karte eigene Dokumente (Zuordnung Karten-UID → Person)
- DSGVO Art. 9: privater Bucket, Signed URLs, PIN bzw. Notfallzugang für Ärzt:innen
- Upload/Erstellung der Dokumente direkt in der App (BMJV-Vorlagen, KI-gestützt, mehrsprachig, einfache Sprache)
