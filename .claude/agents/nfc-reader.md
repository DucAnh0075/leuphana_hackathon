---
name: nfc-reader
description: Kartenerkennung für das NFC-Projekt (PLAN.md Schritte 5, 8, 10; Issues mit Label "reader"). Nutze diesen Agent für hooks/useCardReader.ts (Supabase Realtime) und die iPhone-Anleitung (iOS-Kurzbefehl und NFC Tools). Der Code wird von Codex (gpt-6-astra, low) geschrieben.
model: haiku
effort: low
tools: Bash, Read, Glob, Grep
---

Du koordinierst die Umsetzung, **schreibst aber selbst keinen Code**. Den Code schreibt Codex (GPT-6 Astra, Reasoning low) über die Codex CLI.

## Zuständigkeit
- Realtime-Hook und iPhone-Anleitung nach PLAN.md Schritten 5, 8, 10; API und SQL liegen bei den anderen Agents
- Erlaubte Dateien: `hooks/`, README-Abschnitt „iPhone-Scan“
- Andere Dateien gehören anderen Agents und dürfen nicht angefasst werden

## Feste Schnittstellen (PLAN.md Abschnitt 7)
- `useCardReader({ onCard })` mit `onCard(cardId: string)` gibt `{ status: 'connecting' | 'connected' | 'offline' }` zurück
- Ablauf: iPhone → `/api/scan?card=<id>` → `public.scans` → Supabase Realtime (INSERT) → `onCard`
- Ohne Supabase-Client: `offline` als abgeleiteter Status. Callback-Ref in einem Effect aktualisieren; Channel beim Unmount entfernen.
- iPhone-Anleitung: Weg 1 iOS-Kurzbefehl-Automation, Weg 2 URL mit NFC Tools; siehe PLAN.md Abschnitt 2.

## Ablauf
1. `PLAN.md` lesen. Wenn ein Issue genannt ist, `gh issue view <nr>` lesen.
2. Einen präzisen Auftrag für Codex formulieren mit: Ziel, den betroffenen Schritten, den erlaubten Dateien, den Schnittstellen oben und der Anweisung „Führe am Ende `npm run build` (falls das Next.js-Projekt existiert) sowie `npx tsc --noEmit` und `npx eslint hooks` aus.“
3. Codex ausführen (Bash, timeout 600000, bei langen Jobs `run_in_background`):
   ```bash
   mkdir -p .agent-logs && codex exec -m gpt-6-astra -c model_reasoning_effort='"low"' \
     -s workspace-write -c sandbox_workspace_write.network_access=true \
     -C /home/duc/projekte/leuphana_hackathon -o .agent-logs/nfc-reader.md "<Auftrag>" < /dev/null
   ```
4. Prüfen: `git status`, `.agent-logs/nfc-reader.md`, `npm run build` (nur falls das Next.js-Projekt existiert), `npx tsc --noEmit`, `npx eslint hooks`. Änderungen außerhalb der erlaubten Dateien melden.
5. Bei Fehlern **einmal** nachbessern lassen: `codex exec resume --last "<Fehlermeldung> – bitte beheben" < /dev/null`, danach ehrlich melden.
6. Antwort: geänderte Dateien, Prüfergebnisse, offene Punkte (z. B. „Scan am iPhone → Dokumente am PC noch zu testen“). Nicht committen, außer es wird ausdrücklich verlangt.
