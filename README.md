# Vorsorge-NFC

Eine Next.js-Demo eines Krankenhausinformationssystems mit acht synthetischen Patientenakten. Vorsorgeinformationen sind in die Akten integriert und mit den jeweiligen Dokumenten und Belegstellen verknüpft.

## Setup

1. Abhängigkeiten installieren: `npm install`
2. Für die synthetische KIS-Demo sind keine Umgebungsvariablen erforderlich.
3. Entwicklungsserver starten: `npm run dev`
4. Im Browser `http://localhost:3000` öffnen.

## Vorhandener Dokumentadapter (derzeit nicht in der KIS-Demo aktiv)

Der ursprüngliche Dokumentadapter bleibt für die spätere Anbindung erhalten. Fehlen dort die Supabase-Umgebungsvariablen, ist Supabase nicht erreichbar oder enthält der Bucket `documents` keine PDFs, greift der Adapter auf `public/pdfs/` zurück. Die aktuelle KIS-Demo verwendet stattdessen ausschließlich den synthetischen Bestand aus `lib/demo-patients.json` und `public/demo-documents/`. Berücksichtigt werden nur Dateien mit der Endung `.pdf` (Groß-/Kleinschreibung ist egal), alphabetisch sortiert. In der Akte wird der lokale Musterbestand als Demodokumente gekennzeichnet.

PDFs für diesen Fallback nach `public/pdfs/` legen. Sind auch dort keine PDFs vorhanden oder fehlt der Ordner, erscheint ein entsprechender Hinweis. Der Fallback benötigt weiterhin einen erreichbaren Next.js-Server; er speichert die Website nicht für einen vollständig netzlosen Browserbetrieb.

Als Demo liegt das offizielle [BMJV-Formular Vorsorgevollmacht](https://www.bmjv.de/DE/service/formulare/form_vorsorgevollmacht/form_vorsorgevollmacht_node.html) unter `public/pdfs/Vorsorgevollmacht.pdf` bei.

## Deployment (Vercel)

1. Das Repo auf [vercel.com](https://vercel.com) importieren. Als Framework Preset **Next.js** wählen und die Defaults übernehmen.
2. Für die aktuelle synthetische Demo sind keine Supabase-Umgebungsvariablen nötig. Bei späterer Aktivierung des Dokumentadapters werden `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_ANON_KEY` benötigt.
3. Deployen.

Produktions-URL: https://leuphanahackathon.vercel.app/

### Demo-Laptop-Ablauf (PLAN.md Schritt 9)

Chrome mit der Vercel-URL öffnen und mit **F11** in den Vollbildmodus wechseln. Die Karte wird mit dem iPhone gescannt (siehe „iPhone-Scan“).

## iPhone-Scan (statt USB-Reader)

1. `supabase/schema.sql` im Supabase-Dashboard im **SQL Editor** ausführen. Das richtet die Tabelle `scans`, die Zugriffsregeln und Supabase Realtime ein.
2. **Weg 1 – Kurzbefehle-Automation:** Auf dem iPhone Kurzbefehle → Automation → + → NFC → Scannen → Karte ans iPhone halten. Aktion **„Inhalte von URL abrufen“** mit `https://leuphanahackathon.vercel.app/api/scan?card=demo` hinzufügen. **„Sofort ausführen“** einschalten und **„Bei Ausführung benachrichtigen“** ausschalten.
3. **Weg 2 – NFC Tools (wakdev):** Unter Schreiben → Datensatz hinzufügen → URL den URL-Datensatz `https://leuphanahackathon.vercel.app/scan?card=demo` auf die Karte schreiben. **Karte nicht sperren.** Beim Scannen die iPhone-Mitteilung antippen; die Seite sendet den Scan und zeigt „✓ An PC gesendet“.
4. **Test ohne Handy:** `https://leuphanahackathon.vercel.app/api/scan?card=demo` im Browser aufrufen. Bei geöffneter PC-Seite und verbundenem Realtime-Hook sollte der PC zu den Dokumenten wechseln.

Die lokale Vorschau oder eine tatsächlich bereitgestellte Deployment-URL öffnen und mit **F11** in den Vollbildmodus wechseln. Die Vorführung beginnt auf der Station und führt in eine Patientenakte. Die Dokumente sind bereits vorhanden; der in PLAN.md vorgesehene Reader und eine reale KIS-Anbindung sind noch nicht angeschlossen.

## Klinische Demo mit synthetischen Patientenakten

Die Oberfläche orientiert sich an den vom Nutzer gelieferten M-KIS-Referenzen:
[Fallübersicht](https://www.meierhofer.com/wp-content/uploads/2023/11/kis-screen-mit-falluebersicht.png) und
[Fallübersicht mit Vitaldaten](https://www.meierhofer.com/wp-content/uploads/2023/11/kis-screen-mit-falluebersicht-und-vitaldaten.png).
Stationsliste, Fallnavigation, Befunde, Vitalverlauf, Medikation und Vorsorgeinformationen bilden einen zusammenhängenden Arbeitsplatz. Die normale Oberfläche enthält keine Kartenlese- oder Bestellaktion.

### Vorführablauf

1. Station 2A öffnen, nach Name oder Zimmer filtern und einen der acht fiktiven Fälle auswählen.
2. Die Fallübersicht zeigt unterschiedliche synthetische Diagnosen, Laborwerte, Vitalverläufe, Medikation und Kontakte.
3. Ein Vorsorgehinweis zeigt die relevante Person oder Aussage sowie Bedingungen und Ausschlüsse.
4. Die Belegaktion öffnet das passende PDF auf der referenzierten Seite mit Abschnitt und Originalpassage. Die Patientenidentität bleibt sichtbar.
5. Weitere Dokumente und Kontakte sind innerhalb derselben Akte erreichbar.

Jede Akte enthält vier verschiedene Dokumentarten: Vorsorgevollmacht für Gesundheitsangelegenheiten, Patientenverfügung, Betreuungsverfügung sowie Auskunftsvollmacht/Schweigepflichtentbindung. Diese Rollen sind nicht austauschbar: Ein Betreuungswunsch ist keine gerichtliche Bestellung, ein Auskunftsrecht keine Behandlungsvollmacht und ein situationsbezogener Behandlungswunsch keine pauschale Therapieanordnung.

### Daten und Belegkette

- `lib/demo-patients.json`: gemeinsamer, editierbarer synthetischer Quelldatensatz.
- `public/demo-documents/`: 28 synthetische PDFs; hinzu kommen Henri Beckers zwei ausgefüllte amtliche Formulare in `public/pdfs/`.
- `scripts/generate_demo_documents.py`: reproduzierbare PDF-Erzeugung; prüft jeden der 32 Kurzverweise gegen Text und Abschnitt auf der tatsächlichen PDF-Seite.

Alle Personen, Kontaktdaten, Messwerte und Dokumenterklärungen sind erfunden. Die Dokumente sind als synthetisch und nicht rechtswirksam gekennzeichnet. Angezeigte Daten sind Demonstrationsinhalt, keine klinischen Empfehlungen oder automatisch rechtlich geprüften Befugnisse. Die Informationen sind für die Vorführung bereits im KIS vorhanden; es besteht keine echte Krankenhaus- oder NFC-Anbindung. Henri Beckers Karten-Dokumente werden über den Supabase-Adapter geladen.

### Lokal starten und prüfen

```bash
npm ci
npm run dev -- --port 3100
npm run lint
npm run build
npm run test:ui
```

Vorschau: http://localhost:3100. In VS Code denselben Worktree mit `feat/notfallkarten-ui` öffnen.
Die Browsertests verwenden unter Windows Microsoft Edge; auf anderen Systemen vorher `npx playwright install chromium` ausführen. Prüfbilder und Traces bleiben im ignorierten `test-results/`.

PDF-Daten nach Änderungen neu erzeugen (Python-Entwicklungswerkzeuge, nicht für den App-Betrieb nötig):

```bash
python -m pip install reportlab pymupdf
python scripts/generate_demo_documents.py
```

## Karten-Dokumente (Henri Becker)

Die Vorlagen liegen in `content/pdfs/`, ihre Quellen in `content/QUELLEN.md`.
`python scripts/fill_card_documents.py` erzeugt mit PyMuPDF die fiktiv ausgefüllten,
unsignierten Formulare `public/pdfs/Vorsorgevollmacht.pdf` und
`public/pdfs/Patientenverfuegung.pdf`. Beide mit genau diesen Dateinamen in den
Supabase-Storage-Bucket `documents` hochladen. Beim Scan wird die Liste neu geladen;
die Akte zeigt genau die Bucket-PDFs. Hinweise werden anhand des Dateinamens
zugeordnet. Bei nicht verfügbarem Bucket dienen die PDFs in `public/pdfs/` als Fallback.
