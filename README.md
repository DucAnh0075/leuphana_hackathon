# Vorsorge-NFC

Eine Next.js-Demo eines Krankenhausinformationssystems mit acht synthetischen Patientenakten. Vorsorgeinformationen sind in die Akten integriert und mit den jeweiligen Dokumenten und Belegstellen verknüpft.

## Produktkonzept und Anforderungen

- [Bestehende KIS-Oberfläche](docs/UI-REQUIREMENTS.md): klinische Anforderungen und umgesetzter Demokontext.
- [Zweite UI: persönliche Vorsorge](docs/UI-CONSUMER-ERWEITERUNG.md): Herleitung des freigegebenen Plans mit Nutzenargumenten und Hardwarefragen.
- [Persönliche UI, Auth und Kartenereignis starten](docs/CARE-SETUP.md): implementierter Ablauf, Supabase-Voraussetzungen und Prüfgrenzen.

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
2. Die statische KIS-Ansicht benötigt keine Konfiguration. Für die gemeinsame persönliche/klinische Vorführung auf verteiltem Hosting den Supabase-Modus gemäß [CARE-SETUP.md](docs/CARE-SETUP.md) einrichten. Der lokale synthetische Sitzungszustand ist nicht zwischen Serverless-Instanzen geteilt.
3. Deployen.

Produktions-URL: _noch nicht eingetragen_

### Demo-Laptop-Ablauf (PLAN.md Schritt 9)

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
- `public/demo-documents/`: ursprünglicher KIS-Bestand aus 32 PDFs/72 Seiten, ergänzt um eine separate vierseitige Fassung 2 für die Übergabedemo.
- `scripts/generate_demo_documents.py`: reproduzierbare PDF-Erzeugung; prüft alle 64 Kurz- und Detailverweise gegen Text und Abschnitt auf der tatsächlichen PDF-Seite.

Alle Personen, Kontaktdaten, Messwerte und individuellen Festlegungen sind erfunden. Die Formulierungen der Patientenverfügung und das Vollmachtformular stammen aus den jeweils angegebenen echten Vorlagen. Die Dokumente sind als synthetisch und nicht rechtswirksam gekennzeichnet. Angezeigte Daten sind Demonstrationsinhalt, keine klinischen Empfehlungen oder automatisch rechtlich geprüften Befugnisse. Die Informationen sind für die Vorführung bereits im KIS vorhanden; es besteht keine echte Krankenhaus- oder NFC-Anbindung. Der ursprüngliche Supabase-Adapter bleibt im Repository erhalten, beliefert diese synthetische Demo jedoch nicht.

### Echte Vorlagen und konkrete Behandlungswünsche

Die acht Vorsorgevollmachten verwenden das unveränderte Formularlayout des Bundesministeriums der Justiz (Januar 2023), ausgefüllt mit fiktiven Personen und expliziten Ja-/Nein-Auswahlen. Die interaktiven Formularfelder bleiben erhalten. Jede Seite trägt einen Demohinweis; Unterschriften werden nicht erzeugt.

Die Patientenverfügungen sind individuelle Demofassungen aus ausgewählten Textbausteinen des vom Nutzer bereitgestellten BMJ-PDFs. Nicht gewählte, widersprüchliche Alternativen gehören nicht zur individuellen Erklärung. Die unveränderte Vorlage liegt als benötigte, reproduzierbare Quelle unter `public/templates/patientenverfuegung-textbausteine.pdf`. Betreuungsverfügung und begrenzte Auskunftserklärung bleiben selbst verfasste synthetische Beispiele. Die Herkunft wird je Dokument in `provenance` angegeben.

Je Akte ergänzen vier `carePreferences` konkrete Aussagen zu Schmerztherapie, Ernährung, Notfallplanung und Beatmung. Jede Aussage führt ihre Anwendungssituation, Grenzen und die genaue Belegstelle mit. Erika Berger und Karl Hoffmann zeigen unterschiedliche Wünsche zur Wiederbelebung. Das System bestätigt keine aktuelle Anwendbarkeit und leitet keine allgemeine DNR-Anordnung ab.

Die Zuordnung ist für die Demo redaktionell vorbereitet und gegen die tatsächlichen PDF-Inhalte geprüft. Es gibt weiterhin keine automatische Dokumentextraktion und keine reale KIS-Anbindung. Direktlinks enthalten die Beleg-ID; beim Neuladen wird sie innerhalb derselben Patientenakte und desselben Dokuments aufgelöst.

Der Vitalmonitor zeigt feste synthetische Messwerte. Seine schematische Pulsanimation ist pausierbar und folgt der Systemeinstellung für reduzierte Bewegung; sie stellt kein EKG oder Live-Monitoring dar.

### Lokal starten und prüfen

```bash
npm ci
npm run dev -- --port 3110
npm run lint
npm run build
npm run test:ui
```

Vorschau: http://localhost:3110. Persönliche Ansicht und Demo-Einstieg: http://localhost:3110/anmelden. In VS Code denselben Worktree mit `feat/notfallkarten-ui` öffnen.
Die Browsertests verwenden unter Windows Microsoft Edge; auf anderen Systemen vorher `npx playwright install chromium` ausführen. Prüfbilder und Traces bleiben im ignorierten `test-results/`.

PDF-Daten nach Änderungen neu erzeugen (Python-Entwicklungswerkzeuge, nicht für den App-Betrieb nötig):

```bash
python -m pip install reportlab pymupdf pypdf
python scripts/generate_demo_documents.py
```
