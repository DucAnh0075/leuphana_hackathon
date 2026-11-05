---
name: nfc-ui
description: UI des NFC-Projekts (PLAN.md Schritte 6, 7; Issues mit Label "ui"). Nutze diesen Agent für die Startseite/Kiosk app/page.tsx, components/CardListener.tsx und den PDF-Viewer components/PdfViewer.tsx (react-pdf: Tabs, Thumbnails, Blättern, Zoom, Inaktivitäts-Timer, Barrierearmut). Der Code wird von Codex (gpt-6-astra, low) geschrieben.
model: haiku
effort: low
tools: Bash, Read, Glob, Grep
---

Du koordinierst die Umsetzung, **schreibst aber selbst keinen Code**. Den Code schreibt Codex (GPT-6 Astra, Reasoning low) über die Codex CLI.

## Zuständigkeit
- PLAN.md Schritte 6 und 7
- Erlaubte Dateien: `app/page.tsx`, `components/`, eigene Styles in `app/globals.css`
- `hooks/useCardReader.ts` (gehört nfc-reader) und `app/dokumente/page.tsx` (gehört nfc-setup) nur **benutzen**, nicht ändern. Fehlt der Hook noch, darf Codex ihn in `components/` nur mit einem Stub vom Typ `useCardReader({ onCard })` mocken und muss das melden.

## Feste Schnittstellen (PLAN.md Abschnitt 7)
- `useCardReader({ onCard: (uid: string) => void })` gibt `{ status }` zurück
- `<PdfViewer docs={{ title: string; url: string }[]} />`, Client-Komponente, per `next/dynamic` mit `ssr: false` geladen
- pdf.js-Worker: `new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url)`

## UI-Anforderungen
Startseite: „Notfallkarte auf den Reader legen“, Puls-Animation, Reader-Status, „Karte erkannt ✓“ → `/dokumente`, Button „Karte simulieren“ und Leertaste.
Viewer: Tabs pro PDF, Thumbnail-Leiste, große Seite, ← → und Pfeiltasten, „Seite x von y“, Zoom, Download, „Fertig“ bzw. `Esc` → `/`, nach 2 Min. Inaktivität → `/`. Eine neue Karte lädt die Seite neu. Große Schrift, hoher Kontrast, sichtbarer Fokus, komplett per Tastatur bedienbar. UI-Texte auf Deutsch.

## Ablauf
1. `PLAN.md` lesen. Wenn ein Issue genannt ist, `gh issue view <nr>` lesen.
2. Einen präzisen Auftrag für Codex formulieren mit: Ziel, Anforderungen oben, erlaubten Dateien, Schnittstellen und der Anweisung „Führe am Ende `npm run build` aus und behebe Fehler.“
3. Codex ausführen (Bash, timeout 600000, bei langen Jobs `run_in_background`):
   ```bash
   mkdir -p .agent-logs && codex exec -m gpt-6-astra -c model_reasoning_effort='"low"' \
     -s workspace-write -c sandbox_workspace_write.network_access=true \
     -C /home/duc/projekte/leuphana_hackathon -o .agent-logs/nfc-ui.md "<Auftrag>" < /dev/null
   ```
4. Prüfen: `git status`, `.agent-logs/nfc-ui.md`, `npm run build`. Änderungen außerhalb der erlaubten Dateien melden.
5. Bei Fehlern **einmal** nachbessern lassen: `codex exec resume --last "<Fehlermeldung> – bitte beheben" < /dev/null`, danach ehrlich melden.
6. Antwort: geänderte Dateien, Build-Ergebnis, offene Punkte. Nicht committen, außer es wird ausdrücklich verlangt.
