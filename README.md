# VORAcard & KIS-Demonstrator

Dieses Repository verbindet den persönlichen Vorsorgebereich **VORAcard** mit einer klinischen Demo für acht synthetische Patientenakten. Maßgeblich ist [DucAnh0075/leuphana_hackathon](https://github.com/DucAnh0075/leuphana_hackathon).

- `/vorsorge`: öffentliche Startseite mit Deutsch/Englisch und getrenntem Demo-Einstieg.
- `/vorsorge/app`: geschütztes Profil mit wiederholbaren Dokumentenfällen, Vorbereitungsnotizen, persönlichen Präventionsfiltern, Aufgaben und Demo-Terminbelegen. Die Profil-API schützt Änderungen mit Versionsprüfung und Vorgangskennung. Fälle für andere Personen erben keine persönlichen Alters-/Programmdaten.
- `/vorsorge?view=documents`: bestehendes Dokumentarchiv mit gezielter Freigabe; `/klinik`: berechtigter Eingang, Fallzuordnung und bestätigte Aktenübernahme. Vorbereitungsnotizen werden nicht automatisch zu unterschriebenen Originalen oder Klinikdokumenten.
- `/`: öffentliche KIS-Demo mit acht Avataren, individueller Vitalwertsimulation, Quellenbelegen und PDF-Leser.

Die neue Profilmigration liegt additiv in [supabase/vora-profile.sql](supabase/vora-profile.sql), wurde bei dieser Integration aber **nicht in der Cloud angewendet**. Supabase-Konten und Providerkonfiguration wurden nicht verändert. Der getrennte Demo-Modus verwendet synthetische Daten; echte Profilspeicherung setzt die Konfiguration aus [CARE-SETUP.md](docs/CARE-SETUP.md) voraus. Lokale Gesundheitsdaten sind keine verschlüsselte Cloud-Akte.

ePA-Import, Arzt- und Notartermine sind ausdrücklich Demonstrationen bzw. Vorbereitung. Eine reale ePA-/Krankenhausanbindung, echte Terminbuchungen und ein durchgängiger Upload neu unterschriebener Dokumentenfälle sind nicht angeschlossen. Die weitergehende Prävention für Familienpersonen und ein News-/Rechtebereich gehören noch nicht zu diesem Stand.

Ein kontextbezogener KI-Dialog verwendet öffentliche Abschnittsinformationen und bewusst gesendeten Chattext. Persönliche Dokumentantworten, Profil- und Impfdaten werden nicht automatisch übertragen. Konkrete Anbieter, Einwilligung und Betriebsgrenzen stehen in [VORA-AI.md](docs/VORA-AI.md).

## Produktkonzept und Anforderungen

- [VORA Designsprache, Prozess und Abnahme](docs/VORA-DESIGN.md)
- [Vorsorge-Recherche mit amtlichen Formularen und Quellenstand](docs/research/VORA-VORSORGE.md)
- [KI-Konfiguration und Datenschutzgrenzen](docs/VORA-AI.md): eine vorhandene Konfiguration allein beweist keine funktionierende Modellverbindung.

- [Aktuelle Consumer-Features und Abnahme](docs/CONSUMER-FEATURES.md): englische Prozessführung, Mindestumfang je Feature, Kundennutzen, Backend-Bedarf und bewusste Streichungen.

- [Bestehende KIS-Oberfläche](docs/UI-REQUIREMENTS.md): klinische Anforderungen und umgesetzter Demokontext.
- [Zweite UI: persönliche Vorsorge](docs/UI-CONSUMER-ERWEITERUNG.md): Herleitung des freigegebenen Plans mit Nutzenargumenten und Hardwarefragen.
- [Persönliche UI, Auth und Kartenereignis starten](docs/CARE-SETUP.md): implementierter Ablauf, Supabase-Voraussetzungen und Prüfgrenzen.

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
2. Die statische KIS-Ansicht benötigt keine Konfiguration. Für die gemeinsame persönliche/klinische Vorführung auf verteiltem Hosting den Supabase-Modus gemäß [CARE-SETUP.md](docs/CARE-SETUP.md) einrichten. Der lokale synthetische Sitzungszustand ist nicht zwischen Serverless-Instanzen geteilt.
3. Deployen.

Bisherige Deployment-URL: https://leuphanahackathon.vercel.app/. Die Bereitstellung des aktuellen Feature-Stands unter dieser Adresse ist noch nicht bestätigt.

### Demo-Laptop-Ablauf

Die lokale Vorschau oder eine für diesen Stand geprüfte Deployment-URL öffnen. Die bestehende Stationsansicht unter `/` zeigt synthetische Akten. Für die zusammenhängende Übergabevorführung eine synthetische Demo öffnen, das Dokumentarchiv über `/vorsorge?view=documents&demo=<Demo-ID>` aufrufen und über den Link in die Klinikansicht wechseln. Das Kartenereignis erscheint dort zunächst als Eingang; erst nach bestätigter Fallzuordnung wird die Akte aktualisiert. Voraussetzungen und Grenzen stehen in [CARE-SETUP.md](docs/CARE-SETUP.md).

## iPhone-Scan (statt USB-Reader)

1. Für den echten Modus zunächst Supabase, Testkonten, kontrollierte Mitgliedschaften und Kartenfreigabe gemäß [CARE-SETUP.md](docs/CARE-SETUP.md) einrichten. Eine erreichbare HTTPS-Adresse dieses App-Stands verwenden; die bisherige Deployment-URL allein belegt dessen Bereitstellung nicht.
2. Auf der Karte einen URL-Verweis auf `/scan?card=<registrierte-Kartenkennung>` hinterlegen, sofern der konkrete Tag dies unterstützt. Alternativ kann eine iOS-Automation diesen Link im Browser öffnen. Chip, Schreibverfahren und iPhone-Verhalten sind noch praktisch zu prüfen; die Annahme „eine Funktion auf dem Chip“ bleibt offen.
3. Den Link auf dem iPhone öffnen, mit einem berechtigten Konto anmelden und **„Scan an Klinik senden“** bestätigen. Erst diese Aktion sendet einen autorisierten `POST /api/scan` mit Karten- und Vorgangskennung. Das Öffnen des Links allein verändert nichts.
4. In der angemeldeten Klinikansicht den Eingang prüfen, die Fallzuordnung bestätigen und anschließend den Empfangsnachweis in der persönlichen Ansicht kontrollieren. Ein Scan ist noch keine bestätigte Aktenübernahme.
5. **Test ohne Handy:** Im synthetischen Demo-Lauf die Klinikansicht öffnen und **„Kartenereignis simulieren“** verwenden. Persönliche und klinische Ansicht müssen dieselbe Demo-ID verwenden.

Der frühere Kurzbefehl „Inhalte von URL abrufen“ auf `GET /api/scan?card=demo` ist abgelöst: GET liefert jetzt 405. Es gibt keine pauschale Karte `demo` und keinen Fallback auf eine feste Patientenakte. Eine Safari-Sitzung wird nicht automatisch an einen separaten Kurzbefehl weitergegeben.

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

### Individuelle EKG- und Vitalwertsimulation

Die Stationsliste zeigt für jede der acht Personen eine eigene schematische Sinuskurve mit Puls, Blutdruck und SpO₂. Die Fallübersicht und das Kurvenblatt zeigen dieselben Werte mit derselben Simulationsuhr. Ausgangswerte stammen aus der letzten historischen Demomessung; individuelle Verläufe werden stabil aus der Patienten-ID berechnet. Filtern, Patientenwechsel und Tabwechsel starten die Simulation nicht neu; ein Neuladen der Seite beginnt einen neuen Demolauf.

„Simulation pausieren“ in der Werkzeugleiste hält Kurven und Werte gemeinsam an. Die Systemeinstellung für reduzierte Bewegung zeigt eine ruhende Kurve; Zahlen bleiben lesbar und die globale Pause bleibt verfügbar. In einem ausgeblendeten Browsertab wird nicht gezeichnet, die unpausierte Simulationszeit läuft jedoch weiter. Bei der Rückkehr erscheint direkt der aktuelle Stand. Puls und SpO₂ ändern sich langsam, Blutdruck wird nur als gelegentliche simulierte Messung aktualisiert. Die historischen Tabellen und Verläufe von 06:00 bis 16:00 Uhr bleiben separat erhalten.

Diese Darstellung läuft ausschließlich im Browser: keine Live-Messung, keine Ableitung aus Diagnosen und keine Speicherung oder Übertragung der simulierten Werte. Die Simulation verändert keine Backend-, Karten- oder Dokumentdaten.

### Daten und Belegkette

- `lib/demo-patients.json`: gemeinsamer, editierbarer synthetischer Quelldatensatz.
- `public/demo-documents/`: ursprünglicher KIS-Bestand aus 32 PDFs/72 Seiten, ergänzt um eine separate vierseitige Fassung 2 für die Übergabedemo.
- `scripts/generate_demo_documents.py`: reproduzierbare PDF-Erzeugung; prüft alle 64 Kurz- und Detailverweise gegen Text und Abschnitt auf der tatsächlichen PDF-Seite.

Alle Personen, Kontaktdaten, Messwerte und individuellen Festlegungen sind erfunden. Die Formulierungen der Patientenverfügung und das Vollmachtformular stammen aus den jeweils angegebenen echten Vorlagen. Die Dokumente sind als synthetisch und nicht rechtswirksam gekennzeichnet. Angezeigte Daten sind Demonstrationsinhalt, keine klinischen Empfehlungen oder automatisch rechtlich geprüften Befugnisse. Die Informationen sind für die Vorführung bereits im KIS vorhanden; es besteht keine echte Krankenhaus- oder NFC-Anbindung. Der ursprüngliche Supabase-Adapter bleibt im Repository erhalten, beliefert diese synthetische Demo jedoch nicht.

### Echte Vorlagen und konkrete Behandlungswünsche

Die acht Vorsorgevollmachten verwenden das unveränderte Formularlayout des Bundesministeriums der Justiz (Januar 2023), ausgefüllt mit fiktiven Personen und expliziten Ja-/Nein-Auswahlen. Die interaktiven Formularfelder bleiben erhalten. Jede Seite trägt einen Demohinweis; Unterschriften werden nicht erzeugt.

Die Patientenverfügungen sind individuelle Demofassungen aus ausgewählten Textbausteinen des vom Nutzer bereitgestellten BMJ-PDFs. Nicht gewählte, widersprüchliche Alternativen gehören nicht zur individuellen Erklärung. Die unveränderte Vorlage liegt als benötigte, reproduzierbare Quelle unter `public/templates/patientenverfuegung-textbausteine.pdf`. Betreuungsverfügung und begrenzte Auskunftserklärung bleiben selbst verfasste synthetische Beispiele. Die Herkunft wird je Dokument in `provenance` angegeben.

Je Akte ergänzen vier `carePreferences` konkrete Aussagen zu Schmerztherapie, Ernährung, Notfallplanung und Beatmung. Jede Aussage führt ihre Anwendungssituation, Grenzen und die genaue Belegstelle mit. Erika Berger und Henri Becker zeigen unterschiedliche Wünsche zur Wiederbelebung. Das System bestätigt keine aktuelle Anwendbarkeit und leitet keine allgemeine DNR-Anordnung ab.

Die Zuordnung ist für die Demo redaktionell vorbereitet und gegen die tatsächlichen PDF-Inhalte geprüft. Es gibt weiterhin keine automatische Dokumentextraktion und keine reale KIS-Anbindung. Direktlinks enthalten die Beleg-ID; beim Neuladen wird sie innerhalb derselben Patientenakte und desselben Dokuments aufgelöst.

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
python -m pip install reportlab pymupdf pypdf
python scripts/generate_demo_documents.py
```
