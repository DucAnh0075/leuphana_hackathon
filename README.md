# Vorsorge-NFC

Eine Next.js-Anwendung, die Vorsorgedokumente als PDFs über Supabase oder einen lokalen Fallback bereitstellt und per NFC aufgerufen werden kann.

## Setup

1. Abhängigkeiten installieren: `npm install`
2. `.env.example` nach `.env.local` kopieren und die Supabase-Werte eintragen.
3. Entwicklungsserver starten: `npm run dev`
4. Im Browser `http://localhost:3000/dokumente` öffnen.

## Offline-Modus

Fehlen die Supabase-Umgebungsvariablen, ist Supabase nicht erreichbar, tritt beim Laden ein Fehler auf oder enthält der Bucket `documents` keine PDFs, verwendet die Anwendung die PDFs aus `public/pdfs/`. Berücksichtigt werden nur Dateien mit der Endung `.pdf` (Groß-/Kleinschreibung ist egal), alphabetisch sortiert. Über dem Viewer erscheint das Banner „Offline-Modus – lokale Dokumente“.

PDFs für diesen Fallback nach `public/pdfs/` legen. Sind auch dort keine PDFs vorhanden oder fehlt der Ordner, erscheint ein entsprechender Hinweis. Der Fallback benötigt weiterhin einen erreichbaren Next.js-Server; er speichert die Website nicht für einen vollständig netzlosen Browserbetrieb.

Als Demo liegt das offizielle [BMJV-Formular Vorsorgevollmacht](https://www.bmjv.de/DE/service/formulare/form_vorsorgevollmacht/form_vorsorgevollmacht_node.html) unter `public/pdfs/Vorsorgevollmacht.pdf` bei.

## Deployment (Vercel)

1. Das Repo auf [vercel.com](https://vercel.com) importieren. Als Framework Preset **Next.js** wählen und die Defaults übernehmen.
2. Die Umgebungsvariablen `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_ANON_KEY` setzen, jeweils für **Production** und **Preview**.
3. Deployen.

Produktions-URL: _noch nicht eingetragen_

### Demo-Laptop-Ablauf (PLAN.md Schritt 9)

Chrome mit der Vercel-URL öffnen und mit **F11** in den Vollbildmodus wechseln. Bei einem PC/SC-Reader (Variante B) zusätzlich `node bridge/reader.js` unter **Windows** starten (nicht in WSL).
