# Persönliche Vorsorge, Auth und Kartenereignis

Stand: 05.11.2026. Implementierter Demonstrator im Branch `feat/notfallkarten-ui`.
Die klinische Integration ist simuliert. Sämtliche bereitgestellten Personen und PDFs sind synthetisch.

## Aktueller Consumer-Ausbau VORAcard — 06.11.2026

**VORAcard** startet mit einer öffentlichen DE/EN-Website unter `/vorsorge`. Registrierung/Anmeldung führen in das Profil unter `/vorsorge/app`; eine gesonderte Demo bleibt ausdrücklich als solche erkennbar. Personenbezug, Anlass und Dokumentauswahl gehören zu getrennten Fällen im Profil. Der Dokumentenfinder ist pro Fall erneut ausführbar. Das Dashboard verbindet offene Dokumentaufgaben, hinzugefügte Vorsorgeaufgaben und bestätigte Arzt-/Notar-Demotermine. Maßgeblich ist der [aktuelle Featurevertrag](CONSUMER-FEATURES.md#aktueller-voracard-vertrag--6-november-2026); frühere Abnahmen bleiben historische Nachweise.

Der [Profiladapter](../lib/vora-profile-service.ts) nutzt die bestehende verifizierte Supabase-Sitzung und die RPCs `vora_profile_read` / `vora_profile_save`. [supabase/vora-profile.sql](../supabase/vora-profile.sql) enthält die **additive, noch nicht angewendete** Migration mit Eigentümerbindung, Revision und Wiederholungsschutz. Der geprüfte lokale Auth-Lauf meldet `configured: false`; produktiver Profilspeicher und Cloud-RLS sind deshalb noch nicht nachgewiesen. Es wurden keine Providerkonfiguration, Care-Tabellen oder bestehenden Freigaben geändert. Einrichten und Prüfen dieser Migration im verknüpften Projekt ist ein offener Betriebsschritt, kein bereits erfolgter DB-Effekt.

Dokumentfälle, Sprachpräferenz, Profilfilter, Aufgaben und Demo-Termindaten haben einen DB-Adapter; die separate Demo hält ihre Profile im Server-Arbeitsspeicher. Gesundheitspass, Organspendeentwurf und lokale Dateien verwenden den serverseitig bestimmten Konto-/Demo-`localScope` und werden nicht automatisch in die Profil-DB oder Klinikakte kopiert. Der Chat bleibt temporär. Echte ePA-, Doctolib- und Notariatsbuchungen sind nicht angebunden. DE/EN wählt tatsächliche verfügbare BMJV-Sprachfassungen; persönliche Notizen werden nicht automatisch übersetzt.

Die frühere Planung bleibt unter `/vorsorge?view=legacy` mit ihrem bisherigen `sessionStorage` und Text-Export erreichbar. Der [Featurekatalog](CONSUMER-FEATURES.md) erhält die frühere Priorisierung als nachvollziehbare Vorgeschichte und verweist auf den aktuellen Ausbau.

**Aktuelle Login-Präferenz:** Der einfache Einstieg verwendet E-Mail und Passwort über die bestehende Authentifizierung. Mailcodes sind eine sekundäre Option, keine Voraussetzung für diesen Ablauf. Der verknüpfte Supabase-Zugang, sein Schema und die Providerkonfiguration werden durch diese UI-Anpassung nicht verändert.

## Einstieg und Voraussetzungen

| Ziel | Voraussetzung / Einstieg |
|---|---|
| Vorhandene statische KIS-Ansicht | `/`, ohne Konfiguration |
| Öffentliche VORAcard-Website | `/vorsorge`, ohne Anmeldung; Nutzen, Ablauf und DE/EN-Sprachwahl |
| Profil, Fälle, wiederholbarer Dokumentenfinder und Dashboard | `/vorsorge/app`, verifizierte Sitzung und eingerichteter Profilspeicher; alternativ ausdrückliche getrennte Demo |
| Bestehende Dokumente und Übergabe vorführen | `/anmelden` → „Open sample workspace“ |
| Eigene Dokumente und Übergaben | `/vorsorge?view=documents` bzw. `view=handoffs`; ohne Demo-ID mit Supabase-Sitzung |
| Klinischer Eingang und Aktenübernahme | `/klinik`; klinische Mitgliedschaft oder ausdrücklich synthetischer Demo-Lauf |
| Karte als Auslöser | `/scan?card=<Kartenkennung>`; Seite öffnen, anmelden und Scan bestätigen |
| Echte Supabase-Verbindung | Projekt, Schema, private Dateien, zwei eingerichtete Testkonten und kontrollierte Mitgliedschaften |
| E-Mail-Code für externe Tester | Eigener SMTP-Versand und OTP-Mailvorlage |
| Physische Handyvorführung | Konkretes iPhone/Tag testen, erreichbare HTTPS-Adresse; localhost auf dem Handy verweist auf das Handy selbst |

Die synthetische Vorführung benötigt **keine** Zugangsdaten. Sie verwendet einen eigenen serverseitigen Zustand und weder eine vorgetäuschte Anmeldung noch einen Ersatzweg zu privaten Cloud-Daten.

```bash
npm ci
npm run build
npm run start -- --port 3110
```

Planung öffnen: http://localhost:3110/vorsorge. Bestehende Dokumente im Beispielmodus: http://localhost:3110/anmelden. Für die Entwicklung kann stattdessen `npm run dev -- --port 3110` verwendet werden.

Die Demo-ID in der URL verbindet persönliche und klinische Ansicht. Über „Persönliche Ansicht öffnen“ beziehungsweise „Klinikansicht öffnen“ denselben Lauf verwenden. Der Zustand gilt für **einen laufenden Next.js-Serverprozess**, höchstens 24 Stunden und maximal 100 Läufe. Ein Serverneustart beendet die Läufe. Die Demo-ID ist ein öffentlicher Verweis auf synthetische Daten, kein Authentifizierungsnachweis. Mehrere getrennte Serverless-Instanzen teilen diesen Zustand nicht; für eine verteilte Vorführung den Supabase-Modus verwenden.

## Was der Chip auslöst

Die Präzisierung des Nutzers ist umgesetzt als Vertrag:

**Scan → geprüftes Kartenereignis → freigegebenes Dokumentpaket abrufen → Eingang in der Klinik anzeigen → Fallzuordnung bestätigen → Akte aktualisieren → Rückmeldung in der persönlichen Ansicht.**

Auf dem Chip muss dafür nicht die Anwendung selbst laufen. Die vorhandene Repository-Lösung sieht einen Link beziehungsweise iPhone-Auslöser vor. Quelle ist [Issue #32](https://github.com/DucAnh0075/leuphana_hackathon/issues/32), Stand `upstream/main 8d891788`.

`POST /api/scan` erwartet JSON mit `card` und einer UUID als `requestId`. Im echten Modus benötigt der Aufruf eine verifizierte Sitzung sowie die serverseitig eingerichtete Karten-/Dokumentfreigabe. Ein Kartenkontakt verleiht keine Klinikrolle. Unbekannte Karten liefern einen Fehler; es gibt keinen Patienten-Fallback.

Im synthetischen Lauf öffnet „Kartenereignis simulieren“ exakt denselben Scan-Endpunkt mit dem Demo-Kontext. Die physische Karte wurde hier noch nicht getestet. Die Scan-Seite sendet erst nach der sichtbaren Bestätigung; das bloße Öffnen eines Links verändert keinen Zustand.

**Offene Hardwarefrage:** Welcher Chip/Tag wird verwendet, welche Daten oder Aktionen unterstützt er, und bedeutet die Annahme „nur eine Funktion auf dem Chip“ einen einzelnen URL-/NDEF-Eintrag? Die tatsächliche Kapazität und das Verhalten des Lesegeräts sind unbekannt. Die App führt mehrere Schritte nach einem einzelnen Ereignis aus; daraus folgt keine Aussage über die konkrete Hardware.

### Änderung gegenüber dem bisherigen Scan-Prototyp

- Der frühere `GET /api/scan` schrieb anonym in die Datenbank. GET liefert jetzt **405** und verändert nichts.
- Der alte iOS-Kurzbefehl muss auf den neuen autorisierten Ablauf umgestellt werden. Eine Safari-Sitzung steht einem Kurzbefehl nicht automatisch als Cookie zur Verfügung; der unterstützte einfache Weg ist zunächst die Scan-Seite im Browser.
- Globale anonyme Scan-Policies werden im Schema durch zugriffsgebundene Regeln ersetzt.
- Ein erfolgreicher Scan bestätigt den Eingang des Pakets, nicht die Aktenübernahme.
- Die Datenbankmigration wurde hier nicht auf einem Cloud-Projekt ausgeführt. Bestehende externe Installationen wurden daher nicht verändert.


### Zusammenführung mit dem bisherigen Teamstand

Beim Zusammenführen von `upstream/main` (`8d891788`) bleiben das Scan-/Realtime-Prinzip aus Issue #32 und die vorhandene Scan-Tabelle erhalten. Der frühere anonyme GET-Schreibzugriff und der globale Fallback auf Fall `26004179` werden durch den oben beschriebenen autorisierten Ablauf ersetzt. Die Benachrichtigung meldet den Dokumenteingang; die Aktenübernahme verlangt eine gesonderte Zuordnungsbestätigung. Der ursprüngliche Teamplan bleibt in `PLAN.md` als historischer Prototyp lesbar, während README und Reader-Agent den aktuellen Vertrag beschreiben. Eine geänderte Repository-Fassung bestätigt weder ein Vercel-Deployment noch die Anwendung der Cloud-Migration.

Nach dieser Zusammenführung wurden Produktionsbuild einschließlich TypeScript, ESLint und alle 20 vorhandenen Playwright-Prüfungen erneut erfolgreich ausgeführt. Die vier neu erzeugten PDFs für die umbenannte Demoakte 26004179 wurden über neun Seiten, acht Belegstellen und 67 Formular-Widgets geprüft und visuell kontrolliert.

## Supabase einrichten

Für die erste Inbetriebnahme ein separates Demo-/Testprojekt verwenden. Die Migration ändert bewusst die Berechtigungen des vorhandenen Scan-Prototyps; sie ist kein unverbindlicher UI-Schritt.

1. `.env.example` als `.env.local` übernehmen und Projekt-URL sowie Publishable-Key oder vorhandenen Anon-Key setzen. Die Datei bleibt ignoriert; keine Schlüssel ins Git-Repository oder in Screenshots übernehmen.
2. [supabase/schema.sql](../supabase/schema.sql) im vorgesehenen Projekt ausführen. Es erweitert den Scanvertrag, legt die Vorsorgeobjekte, RLS-Regeln, transaktionalen Funktionen und den privaten Bucket `care-documents` an. Die Datei ist für Wiederholung ausgelegt. Ein vorhandener Bucket `documents` wird nicht umbenannt oder gelöscht; die neue Zugriffskontrolle gilt für `care-documents`.
3. Zwei unterschiedliche synthetische Testkonten in Supabase Auth anlegen: eine vorsorgende Person und einen klinischen Empfänger. Die App legt keine Konten automatisch an.
4. Für Mailcodes die Auth-Mailvorlage auf `{{ .Token }}` einstellen und externen SMTP-Versand konfigurieren. Alternativ lassen sich die vorbereiteten Konten über die Passwortansicht anmelden.
5. Für das einmalige Bereitstellungsskript serverseitig `SUPABASE_SERVICE_ROLE_KEY`, `CARE_OWNER_USER_ID` und `CARE_CLINIC_USER_ID` setzen. Diese Werte gehören nicht in Browserkonfiguration oder `NEXT_PUBLIC_*`.
6. Erst den lokalen Dry-run prüfen, dann im vorgesehenen Testprojekt anwenden:

```bash
node scripts/seed-care.mjs
node --env-file=.env.local scripts/seed-care.mjs --apply
```

Ohne `--apply` schreibt das Skript nichts. Es prüft die fünf benötigten PDFs. Der angewendete Seed legt kontrollierte Mitgliedschaften, die synthetische Person, den Empfänger, Dokumentmetadaten, private Dateien, vier bisherige Aktenfassungen und ein Kartenpaket an. Er erstellt keine Auth-Konten. Wiederholung ist vorgesehen; vorhandene Handoffs werden nicht zur Demo-„Bereinigung“ gelöscht.

7. Nach Änderungen an `NEXT_PUBLIC_*` für die Produktionsvorschau erneut `npm run build` ausführen und den Server neu starten; beim Entwicklungsserver genügt ein Neustart. Persönliches Konto in einem Browserprofil und klinisches Konto in einem zweiten Profil anmelden.
8. Die in den Tests beschriebenen Zugriffsfälle anschließend gegen dieses echte Projekt prüfen. Lokale Demo-Tests beweisen nicht die Wirksamkeit einer Cloud-RLS-Konfiguration.

Aktuelle Herstellerhinweise: [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs), [E-Mail-OTP](https://supabase.com/docs/guides/auth/auth-email-passwordless), [SMTP-Grenzen](https://supabase.com/docs/guides/auth/auth-smtp), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Zugriff und Zustandsgrenzen

- Sitzung, App-Mitgliedschaft und im Dokument benannte Vertretungsbefugnis sind getrennt. Kein Rollen-Dropdown erzeugt echte Zugriffsrechte.
- Der normale Anwendungsbetrieb nutzt ausschließlich den nutzergebundenen Supabase-Client. Der Service-Key ist ausschließlich für das bewusst aufgerufene Bereitstellungsskript vorgesehen.
- Private PDFs werden bei jedem neuen Abruf über einen geschützten Endpunkt geprüft und mit `private, no-store` ausgeliefert. Es werden keine langlebigen öffentlichen Downloadlinks für private Dokumente erzeugt.
- Kartenverlust sperrt neue Kartenabrufe. Bereits bestätigte Aktenfassungen und vorhandene Empfangsnachweise werden dadurch nicht gelöscht; heruntergeladene Dateien lassen sich nicht zurückholen.
- Wiederholungen mit derselben Vorgangskennung sind idempotent. Dieselbe Kennung mit anderem Inhalt wird zurückgewiesen.
- Klinische Übernahme und Rückfragen verwenden eine erwartete Revision. Ein veralteter Browser darf keinen neueren Zustand überschreiben.
- Rückfrage → persönliche Antwort → erneute Zuordnungsprüfung ist ein Vorgang mit erhaltener Historie.
- Die Datenbank liefert den Workspace in einem zusammenhängenden Snapshot. Aktenübernahme und Bestätigung werden transaktional geschrieben.
- Realtime dient als Hinweis zum Nachladen. Regelmäßiger Abgleich ergänzt den Hinweis; eine Animation erzeugt nie einen bestätigten Zustand.
- Die normale KIS-Ansicht und ihre bisherigen öffentlichen PDFs bleiben ausdrücklich synthetisch. Es gibt keinen Upload beliebiger personenbezogener Daten in diesem Ausbau.

## Assistenz

Der implementierte Endpunkt `POST /api/assistant` arbeitet **lokal und deterministisch** auf dem bereits autorisierten Vorsorgebestand. Er beantwortet die drei Aufgaben Belegstelle, nächster Schritt und Übergabestand. Quellen verweisen auf Dokument, Fassung und Seite. Es werden weder Dokumente versendet noch Berechtigungen oder Unterschriften durch die Hilfe erzeugt.

**Historischer Stand dieses Bestandsassistenten vom 05.11.2026:** Die damals vorgeschlagene externe OpenAI-Anbindung wurde durch die automatische Freigabeprüfung wegen möglicher Übermittlung von Vorsorgeinhalten abgelehnt und nicht eingebaut. Die lokale Hilfe unter `/api/assistant` bleibt ohne Schlüssel und externe Modellverbindung nutzbar.

**Neuer VORA-Chat vom 06.11.2026:** Der ausdrücklich beauftragte Dialog nutzt `/api/vora/assistant` mit lokaler ChatGPT-Anmeldung oder ausdrücklich gewähltem API-Schlüsselmodus. Nach Gesprächseinwilligung werden Chattext, Verlauf und ausgewählter öffentlicher VORA-/Vorlagenkontext übermittelt; gespeicherte Antworten, Profil-, Impf-, Karten-/Datei- und Reisedaten werden nicht automatisch angehängt. Ein API-Schlüssel ist keine Voraussetzung des ChatGPT-Wegs. Einrichtung, Grenzen und Fehlerzustände stehen in [VORA-AI.md](VORA-AI.md). Die frühere Ablehnung betrifft den historischen Bestandsassistenten, nicht diesen neuen begrenzten Endpunkt; Supabase bleibt unverändert.

## Quellen für die neue Fassung

`lib/demo-care-revision.json` ist die einzige Quelle für die zusätzliche Gesprächsbegleitung in Fassung 2 der Patientenverfügung von Erika Berger. Sie erteilt keine zusätzliche Vertretungsbefugnis. `scripts/generate_care_revision.py` hängt die synthetische Ergänzung an die drei unveränderten bisherigen Seiten an und prüft Text, Seitenzahl und Erhalt des Originals.

```bash
python scripts/generate_care_revision.py
```

Die neue Fassung ist ein eigenes Artefakt; die frühere Fassung bleibt erhalten. Vorlagen und bestehende 64 Belegstellen der ursprünglichen KIS-Demo werden nicht durch einen neu interpretierten Datenbestand ersetzt.

## Prüfung und Grenzen

```bash
npx tsc --noEmit --incremental false
npm run lint
npm run build
npm run test:ui
```

Die Browserprüfungen verwenden standardmäßig Port 3110; mit `PLAYWRIGHT_PORT` kann ein anderer freier Port angegeben werden. Unter Windows wird Microsoft Edge verwendet.

- `tests/ui.spec.ts`: bisherige Stations-, Dokument- und Belegnavigation.
- `tests/care-ui.spec.ts`: persönliche Übergabe und klinische Bestätigung in zwei Browserkontexten; Scan/Rückfrage/Antwort.
- `tests/care-api.spec.ts`: echte lokale API-Grenzen, Wiederholungen, veraltete Revisionen, Kartensperrung, Antwortverlauf und quellenbezogene Hilfe.
- Screenshots und Traces liegen unter dem ignorierten `test-results/`.

Noch nicht nachgewiesen: echte Cloud-Anmeldung, angewendetes Datenbankschema/RLS, SMTP-Zustellung, physisches NFC-Verhalten, eine produktive KIS-Schnittstelle oder medizinische/rechtliche Anwendbarkeit. Dafür fehlen derzeit Supabase-Konfiguration, eingerichtete Konten und konkrete Hardware. Lokal bestanden: Produktionsbuild ohne Warnungen, Typecheck, ESLint und alle 20 Playwright-Prüfungen (12 bestehende KIS-/PDF-Prüfungen, sechs API- und zwei browserübergreifende Vorsorgeabläufe). Nach der abschließenden mobilen Politur wurden der Produktionsbuild und beide betroffenen Vorsorge-Browsertests erneut erfolgreich ausgeführt. Die visuelle Prüfung erfolgte bei 1440 und 390 Pixel Breite; die PDF-Ergänzung wurde gerendert und auf unveränderte Originalseiten sowie die Belegstelle auf Seite 4 geprüft. Der Seed-Dry-run bestätigt fünf PDFs und null externe Schreibvorgänge. Diese Ergebnisse ersetzen die noch ausstehenden Cloud- und Hardwareprüfungen nicht.

Rückweg bei einem App-Problem: bisherigen Branchstand auschecken und den Prozess neu starten. Produktive Datenbestände werden nicht automatisch zurückgesetzt. Nach einer späteren Schemaanwendung Berechtigungsänderungen gezielt prüfen; keine historischen Bestätigungen oder Bucket-Dateien als vermeintlichen UI-Rollback löschen.
