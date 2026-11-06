# Vorsorge-NFC

Eine Next.js-Demo eines Krankenhausinformationssystems mit acht synthetischen Patientenakten. Vorsorgeinformationen sind in die Akten integriert und mit den jeweiligen Dokumenten und Belegstellen verknüpft.

Maßgeblich ist dieses Repository: [DucAnh0075/leuphana_hackathon](https://github.com/DucAnh0075/leuphana_hackathon). Der aktuelle Arbeitsumfang ist die KIS-Oberfläche auf `/`; eine persönliche Vorsorgeansicht oder ein Übergabe-Backend gehört nicht zu diesem Stand.

## Setup

1. Node.js **22 ab 22.13.0 oder ab 24** verwenden; die genaue Vorgabe steht unter `engines` in [package.json](package.json). Die gesperrten PDF- und Lint-Abhängigkeiten benötigen diese Versionen.
2. Abhängigkeiten reproduzierbar aus [package-lock.json](package-lock.json) installieren: `npm ci`.
3. Für die synthetische KIS-Demo sind keine Umgebungsvariablen erforderlich.
4. Entwicklungsserver starten: `npm run dev`.
5. Im Browser `http://localhost:3000` öffnen.

## Vorhandener Dokumentadapter (derzeit nicht in der KIS-Demo aktiv)

Der ursprüngliche Dokumentadapter bleibt für die spätere Anbindung erhalten. Fehlen dort die Supabase-Umgebungsvariablen, ist Supabase nicht erreichbar oder enthält der Bucket `documents` keine PDFs, greift der Adapter auf `public/pdfs/` zurück. Die aktuelle KIS-Demo verwendet stattdessen ausschließlich den synthetischen Bestand aus `lib/demo-patients.json` und `public/demo-documents/`. Berücksichtigt werden nur Dateien mit der Endung `.pdf` (Groß-/Kleinschreibung ist egal), alphabetisch sortiert. In der Akte wird der lokale Musterbestand als Demodokumente gekennzeichnet.

PDFs für diesen Fallback nach `public/pdfs/` legen. Sind auch dort keine PDFs vorhanden oder fehlt der Ordner, erscheint ein entsprechender Hinweis. Der Fallback benötigt weiterhin einen erreichbaren Next.js-Server; er speichert die Website nicht für einen vollständig netzlosen Browserbetrieb.

Als Demo liegt das offizielle [BMJV-Formular Vorsorgevollmacht](https://www.bmjv.de/DE/service/formulare/form_vorsorgevollmacht/form_vorsorgevollmacht_node.html) unter `public/pdfs/Vorsorgevollmacht.pdf` bei.

## Deployment (Vercel)

1. Das Repo auf [vercel.com](https://vercel.com) importieren. Als Framework Preset **Next.js** wählen und die Defaults übernehmen.
2. Für die aktuelle synthetische Demo sind keine Supabase-Umgebungsvariablen nötig. Für den vorhandenen Dokumentadapter oder die optionale Scan-Anbindung werden `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_ANON_KEY` benötigt.
3. Deployen.

Im bisherigen Projekt dokumentierte Deployment-URL: https://leuphanahackathon.vercel.app/. Welcher Commit dort tatsächlich läuft, ist vor einer Vorführung gesondert zu prüfen; ein lokaler Build bestätigt kein Deployment.

### Demo-Laptop-Ablauf (PLAN.md Schritt 9)

Chrome mit der lokalen Vorschau oder einer geprüften Deployment-URL öffnen und mit **F11** in den Vollbildmodus wechseln. Die aktuelle KIS-Demo beginnt auf der Station und führt in eine Patientenakte. Für eine Vorführung mit iPhone muss der folgende optionale Scanpfad zuvor mit der konkreten Hardware und Deployment-Konfiguration geprüft werden.

## Optionale iPhone-Scan-Anbindung (statt USB-Reader)

Die KIS-Oberfläche verarbeitet lokale `demo-card-scan`-Ereignisse und bei vorhandener Supabase-Konfiguration neue Einträge in `scans` über Realtime. Die Demokarte `demo` öffnet Henri Beckers Dokumente. Die folgenden Integrationsschritte setzen eine eigene Supabase-Konfiguration voraus; ein simulierter Browser-Scan bestätigt weder die physische NFC-Karte noch den Ablauf vom iPhone über Supabase zum PC.

1. `supabase/schema.sql` im Supabase-Dashboard im **SQL Editor** ausführen. Das richtet die Tabelle `scans`, die Zugriffsregeln und Supabase Realtime ein.
2. **Weg 1 – Kurzbefehle-Automation:** Auf dem iPhone Kurzbefehle → Automation → + → NFC → Scannen → Karte ans iPhone halten. Aktion **„Inhalte von URL abrufen“** mit `https://leuphanahackathon.vercel.app/api/scan?card=demo` hinzufügen. **„Sofort ausführen“** einschalten und **„Bei Ausführung benachrichtigen“** ausschalten.
3. **Weg 2 – NFC Tools (wakdev):** Unter Schreiben → Datensatz hinzufügen → URL den URL-Datensatz `https://leuphanahackathon.vercel.app/scan?card=demo` auf die Karte schreiben. **Karte nicht sperren.** Beim Scannen die iPhone-Mitteilung antippen; die Seite sendet den Scan und zeigt „✓ An PC gesendet“.
4. **Test ohne Handy:** `https://leuphanahackathon.vercel.app/api/scan?card=demo` im Browser aufrufen. Bei geöffneter PC-Seite und verbundenem Realtime-Hook sollte der PC zu den Dokumenten wechseln.

Die Dokumente sind bereits in der Demo vorhanden. Eine reale Krankenhausanbindung und der ursprünglich in PLAN.md vorgesehene USB-Reader sind nicht angeschlossen.

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
- `public/demo-documents/`: 32 eigens erzeugte PDF-Dokumente mit insgesamt 48 Seiten.
- `scripts/generate_demo_documents.py`: reproduzierbare PDF-Erzeugung; prüft jeden der 32 Kurzverweise gegen Text und Abschnitt auf der tatsächlichen PDF-Seite.

Alle Personen, Kontaktdaten, Messwerte und Dokumenterklärungen sind erfunden. Die Dokumente sind als synthetisch und nicht rechtswirksam gekennzeichnet. Angezeigte Daten sind Demonstrationsinhalt, keine klinischen Empfehlungen oder automatisch rechtlich geprüften Befugnisse. Die Informationen sind für die Vorführung bereits im KIS vorhanden; es besteht keine echte Krankenhausanbindung. Die optionale Scan-Anbindung ist oben beschrieben; ihre Hardware- und Cloud-Abnahme bleibt separat erforderlich. Der ursprüngliche Supabase-Dokumentadapter bleibt im Repository erhalten, beliefert diese synthetische Demo jedoch nicht.

### Lokal starten und prüfen

```bash
npm ci
npm run lint
npm run build
npm run test:ui
```

Alle Befehle im selben Checkout ausführen. Der Produktionsbuild muss den aktuellen Quellen entsprechen; nach Codeänderungen vor den Browsertests erneut `npm run build` ausführen. Playwright startet und beendet seinen eigenen Produktionsserver auf `http://127.0.0.1:3196`. Ein bereits belegter Port führt zum Abbruch, damit kein fremder Entwicklungsserver oder anderer Worktree geprüft wird. Währenddessen in diesem Checkout keinen Entwicklungsserver oder weiteren Build starten.

Für parallele Checkouts einen freien Port wählen, zum Beispiel in PowerShell:

```powershell
$env:PLAYWRIGHT_PORT = "3197"
npm run test:ui
```

Auf macOS/Linux: `PLAYWRIGHT_PORT=3197 npm run test:ui`. Der Port gilt gleichermaßen für Testserver und Browser. Die Browsertests verwenden unter Windows Microsoft Edge; auf anderen Systemen vorher `npx playwright install chromium` ausführen. Prüfbilder und Traces bleiben im ignorierten [test-results/](test-results/). ESLint prüft Anwendung, Tests und Projektkonfiguration; generierte Testausgaben und unveränderte importierte Skills sind aus dieser Anwendungsprüfung ausgeschlossen.

PDF-Daten nach Änderungen neu erzeugen (Python-Entwicklungswerkzeuge, nicht für den App-Betrieb nötig):

```bash
python -m pip install reportlab pymupdf
python scripts/generate_demo_documents.py
```
