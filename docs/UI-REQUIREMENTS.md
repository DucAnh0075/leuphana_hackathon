# UI Anforderungen und Stack Vorschlag für die NFC Notfallkarte

Stand: 05.11.2026, nach der Kontextkorrektur zum KIS-Demonstrator. Anforderungskatalog mit aktualisierter Interpretation; keine Produktfreigabe.

Ergänzend liegt ein eigener [Entwurf für die zweite, persönliche Vorsorge-UI](UI-CONSUMER-ERWEITERUNG.md) vor. Er beschreibt Vorbereitung, Unterstützung und nachvollziehbare Übergabe als Gegenstück zur KIS-Ansicht. Die Erweiterung ist geplant; die folgenden KIS-Anforderungen bleiben für die bestehende Oberfläche maßgeblich.

## Aktuelle Weiterentwicklung: klinische Informationsdichte und Belegstellen

Diese Ausgestaltung folgt der anschließenden Nutzerkorrektur mit zwei M-KIS-Referenzbildern. Sie ersetzt für die aktuelle Demo die frühere Annahme einer sichtbaren Kartenleseaktion und eines zunächst leeren Dokumentbestands. Die zuvor dokumentierten Entscheidungen und Issue-IDs bleiben als Herkunft nachvollziehbar.

- KIS.1: Eine dichte Stations- und Falloberfläche mit schmalen Werkzeugleisten, Fachnavigation und tabellarischen Informationsbereichen ersetzt großzügige Produktflächen.
- KIS.2: Acht fiktive Patienten besitzen individuell zusammenhängende Diagnosen, Vitalverläufe, Laborwerte, Medikation, Kontakte und Ereignisse.
- KIS.3: Die klinische Oberfläche zeigt keine Aktion „Karte einlesen“. Die Demo stellt bereits integrierte Informationen in der Patientenakte dar.
- KIS.4: Je Patient liegen vier eigenständig erzeugte Vorsorgedokumente vor; eine Patientenverfügung, Betreuungsverfügung und Auskunftsvollmacht werden nicht als gleichwertige Vertretungsvollmachten bezeichnet.
- KIS.5: Relevante Kurzangaben stehen in ihrem fachlichen Kontext. Bedingungen, Einschränkungen und ausgeschlossene Bereiche müssen gemeinsam mit einer Aussage einsehbar bleiben.
- KIS.6: Jede Kurzangabe referenziert Patient, Dokument-ID, Seite, Abschnitt und wörtlichen Beleg aus dem synthetischen Dokument.
- KIS.7: Der Quellenaufruf öffnet das richtige PDF direkt auf der genannten Seite. Auch nach Patientenwechsel darf kein fremder Beleg stehen bleiben.
- KIS.8: Der Patientenkopf bleibt während der Dokumentlektüre sichtbar. Schließen kehrt zum passenden Aktenbereich zurück.
- KIS.9: Dokumentiert/verfügbar bedeutet keine rechtliche Freigabe. Ein Betreuungswunsch wird nicht als gerichtliche Bestellung, ein Auskunftsrecht nicht als Behandlungsentscheidung und eine situationsbezogene Patientenverfügung nicht als pauschale Therapieanordnung dargestellt.
- KIS.10: Alle patientenbezogenen Angaben und Festlegungen sind synthetisch; es werden keine echten Personen, Unterschriften oder produktiven Schnittstellen behauptet.
- KIS.11: Strukturierte Angaben und PDFs stammen aus demselben editierbaren Datensatz. Die Erzeugung validiert Belegzitat und Abschnitt auf der tatsächlichen PDF-Seite.
- KIS.12: Browserprüfungen und Screenshot-Iterationen müssen Stationssicht, gefüllte Fallakte, mehrere Dokumenttypen, gezielte Quellenaufrufe, Patientenwechsel und schmale Ansichten abdecken.

- KIS.13: Echte Vorlagen werden als solche belegt: offizielles Vollmachtformular, ausgewählte BMJ-Textbausteine und selbst verfasste Beispiele bleiben unterscheidbar.
- KIS.14: Personen und Festlegungen sind synthetisch. Jede ausgefüllte PDF-Seite ist als Demo markiert; keine Signaturen oder bestätigte Rechtswirksamkeit werden erzeugt.
- KIS.15: Gesundheitssorge, ausgeschlossene Befugnisse und Ja-/Nein-Auswahlen müssen zwischen Originalformular, gespeicherten Formularfeldern und Aktenhinweisen übereinstimmen.
- KIS.16: Konkrete Behandlungswünsche erscheinen im Versorgungskontext. Die Anwendungssituation bleibt zusammen mit dem Wunsch sichtbar; keine pauschale Therapie- oder Reanimationsanordnung wird abgeleitet.
- KIS.17: Jede konkrete Aussage hat eine eigene Beleg-ID mit Patient, Dokument, Seite, Abschnitt und Zitat. Neuladen oder manipulierte Seitenparameter dürfen den Beleg nicht einer anderen Aussage zuordnen.
- KIS.18: Farbakzente kennzeichnen fachliche Bereiche. Pulsbewegung ist klar simuliert, pausierbar und bei reduzierter Bewegung deaktiviert; Messwerte bleiben unverändert.
- KIS.19: Individuelle Demofassungen enthalten ausgewählte, konsistente Alternativen. Die unveränderte Textbausteinvorlage ist separat als Quelle einsehbar und wird nicht mit einer persönlichen Erklärung verwechselt.

Referenzen: [M-KIS Fallübersicht](https://www.meierhofer.com/wp-content/uploads/2023/11/kis-screen-mit-falluebersicht.png), [M-KIS Vitaldaten](https://www.meierhofer.com/wp-content/uploads/2023/11/kis-screen-mit-falluebersicht-und-vitaldaten.png). Übernommen werden Informationshierarchie und Dichte; es wird keine originale Herstelleroberfläche oder echte Integration behauptet.

Datenumfang dieser Iteration: acht Patienten, 32 Dokumente, 72 PDF-Seiten und 64 belegte Kurz- und Detailangaben. Die bisherigen Import- und Reader-Issues bleiben Integrationsaufgaben; ihr Auslöser ist kein dominantes Produktbedienelement im klinischen Alltag.

## Frühere Kontextkorrektur: erster KIS-Demonstrator

Henri hat die Produktperspektive präzisiert: Die Demo zeigt den Arbeitsplatz des Klinikpersonals **innerhalb eines Krankenhausinformationssystems (KIS)**. Sie ist keine Kartenbestellseite und kein separates Patientenportal. Die Issues bleiben fachlich gültig; ihre UI-Begriffe werden im folgenden KIS-Kontext interpretiert.

Die folgende konkrete Demo-Ausgestaltung (Erika Berger, feste Zuordnung) ist eine vorläufige Umsetzungsannahme und keine ausdrücklich bestätigte Personen- oder Zuordnungsentscheidung des Nutzers.

1. Einstieg ist eine Stationsübersicht mit fiktiven Patienten, Zimmern und Betten.
2. Eine Demokarte ist fest Erika Berger, Fall 26004182, Zimmer 201 / A zugeordnet. Ein Scan darf ihre Dokumente niemals der gerade zufällig geöffneten anderen Patientenakte zuweisen.
3. Das Einlesen zeigt Erkennung, Zuordnung und Dokumenteneingang. Danach erscheinen die tatsächlich verfügbaren PDF-Dokumente mit Quelle, Eingangszeit und Lesestatus in der passenden Akte.
4. Der PDF-Viewer ist Teil der Akte; der Patientenkopf bleibt sichtbar. Schließen führt zur Dokumentliste, Inaktivität zur Stationsübersicht. Eingegangene Dokumente bleiben innerhalb der laufenden Demo erhalten.
5. Wiederholte Scans erzeugen keine Duplikate. „Demo zurücksetzen“ löscht ausdrücklich den simulierten Eingang für eine erneute Vorführung.
6. Alle Patientendaten sind fiktiv. Die feste Zuordnung ist Demo-Logik, kein Identitäts- oder Berechtigungsnachweis. Das mitgelieferte PDF ist ein leeres Musterformular und keine unterschriebene Erklärung der fiktiven Patientin.
7. Es besteht keine technische Verbindung zu einem produktiven ORBIS-/MEDICO-System. Reader-Anbindung, echte Patientenidentifikation und klinische Schnittstellen bleiben getrennte Integrationsaufgaben.

**Übernommene UI-Muster:** kompakte Stationslisten, Organisationshierarchie Station/Zimmer/Bett, dauerhafter Patientenkontext und Hinweise auf neue Dokumente. Quellen: [Dedalus Produktportfolio 2025, Unit View und Krankengeschichte](https://www.dedalus.com/dach/wp-content/uploads/sites/24/2025/04/Dedalus_Produktportfolio_2025_04.pdf), [CGM MEDICO – Stationsorganisation](https://www.cgm.com/deu_de/loesungen/krankenhaus/krankenhausinformationssysteme/cgm-medico/behandlungsmanagement.html). Die neutrale Gestaltung übernimmt die Informationshierarchie, keine Herstelleridentität oder behauptete Zertifizierung.

**Aktueller Umsetzungsstand:** Der dev-Stand mit lokalem PDF-Fallback ist integriert. Der UI-Branch enthält einen KIS-Demonstrator mit Stationsliste, Suche, Zimmerfilter, Patientenakte, Dokumenteneingang, wiederholbarer Kartensimulation und eingebettetem PDF-Viewer. Zustände werden im Browser-Arbeitsspeicher gehalten und beim Neuladen zurückgesetzt. Die nachfolgenden Issues und Quellenangaben stammen aus dem ursprünglichen Anforderungskatalog; Anforderungen sind keine pauschale Behauptung einer vollständigen Abnahme.


## Ziel und vereinbarter Umfang

Klinikpersonal arbeitet in einer Stationsübersicht und Patientenakte. Das Einlesen einer Notfallkarte führt die zugeordneten Vorsorgedokumente in diesen bestehenden Arbeitskontext. Der primäre Nutzungskontext ist ein klinischer Demoarbeitsplatz am Laptop.

Henri hat den Umfang „Hackathon-MVP plus Produktblick“ gewählt. Die KI-Seitenleiste aus Issue #28 ist optional. Dokumenterstellung, produktive Patientenidentifikation und Zugang zu echten Gesundheitsdaten gehören zum späteren Produktblick. Die Demo ordnet ihre eine simulierte Karte ausdrücklich einer festen fiktiven Patientin zu; daraus entsteht kein Identitäts- oder Berechtigungsnachweis.

Dieser Katalog ist eine eigenständige Ausarbeitung mit Links zu den Originalen. Es werden keine Issue-Exporte oder Dokumentkopien als Quellenarchiv eingecheckt.

## Quellenstand der ursprünglichen Analyse (historisch)

- Originalrepository: [DucAnh0075/leuphana_hackathon](https://github.com/DucAnh0075/leuphana_hackathon).
- [Teamplan](../PLAN.md), main bei 3bf8dcc51ac29dd6bb0f0f541797476343fc464f.
- Aktuelle Entwicklungsbasis: [dev bei 3462214](https://github.com/DucAnh0075/leuphana_hackathon/tree/3462214); derselbe Stand liegt auf feat/backend-supabase.
- Issues #3–#6 sind inzwischen geschlossen, #7–#31 offen. Die gelesenen Detailantworten enthalten keine Kommentare; Aussagen über dortige Absprachen werden nicht unterstellt.
- Das Repository enthält das [ursprüngliche Briefing](../Basic%20Information%20Digital%20Tool%20Vorsorgedokumente.pdf), die [Pitch-Checkliste](../Checkliste%20Pitch%20Open%20track.pdf), [Daten und Fakten](../Daten%26Fakten%20Pitch.pdf) und das [Positionspapier zur integrierten Notfallplanung](../Die%20Integrierte%20Notfallplanung%20-%20Positionspapier.pdf). Diese Unterlagen wurden im Zusammenhang gelesen. Statistische Aussagen aus der Zusammenstellung sind vor einer öffentlichen Verwendung an ihren Originalquellen zu prüfen.
- Die vorhandenen [UI-Prompts](../.claude/agents/nfc-ui.md) und die Setup-, Reader- und Content-Prompts beschreiben Zuständigkeiten. Ihre Ausführungskommandos sind kein zusätzlicher Arbeitsauftrag.

### Befund vor dem UI-Bau (historisch)

| Bereich | Befund | Konsequenz |
|---|---|---|
| Projekt | Next 16.4.5, React 19.3.0, TypeScript strict, Tailwind 4 | Gerüst übernehmen; kein zweites Projekt erzeugen |
| Datenzugriff | Supabase-Client und dynamische Route /dokumente | Bestehende Datenanbindung integrieren |
| Dokumentliste | PDF-Filter, Titel aus Dateinamen, alphabetisch, Limit 100 | Pagination beziehungsweise sichtbare Grenze berücksichtigen |
| Viewer | Client-Komponente mit PDF-Links | Vollständiger Viewer fehlt |
| Start | Unveränderte Next.js-Beispielseite | KIS-Stationsarbeitsplatz gestalten |
| Layout | Englisch, „Create Next App“, generische Metadaten | Deutsch und passende Produktmetadaten setzen |
| Fehler/Leerzustand | Meldungen vorhanden, teils mit Supabase-/Env-Anweisungen | Nutzertexte und technische Diagnose trennen |
| Reader | Keine hooks/- oder bridge/-Implementierung im gelesenen Tree | Schnittstelle abstimmen; Simulation ermöglicht UI-Entwicklung |
| Offline/KI | Keine Implementierung gefunden | Offline-Fallback entwickeln, KI optional vorbereiten |
| Verifikation | Code gelesen, nicht gebaut oder am Reader getestet | Geschlossene Issues sind kein eigener Laufzeitnachweis |

## Leseschlüssel und Prioritäten

„Quelle“ bezeichnet den übernommenen Kern eines Issues. „Ergänzung“ bezeichnet hier vorgeschlagene Konkretisierungen, die aus Nutzerablauf, Fehlerfällen oder Schnittstellen folgen; sie sind keine rückwirkenden Teamentscheidungen. Die Nummer 15.1 bezeichnet eine Anforderung zu Issue #15 und erzeugt kein neues GitHub-Issue.

MVP muss ohne KI funktionieren. Bedingte Aufgaben hängen vom Reader ab. Optionale Aufgaben dürfen die Kernabnahme nicht blockieren. Für jede Ergänzung bleibt beim UI-Review erkennbar, welche Entscheidung sie vorschlägt.

## Gemeinsame Anforderungen

- 0.1: Stationsübersicht, Patientenauswahl, Karteneingang, Dokumentauswahl und Lesen bilden einen durchgängigen Ablauf; die Stationsübersicht bleibt erreichbar.
- 0.2: Die gesamte Bedienoberfläche verwendet verständliches Deutsch, konsistente Aktionsnamen und den Dokumenttyp als Orientierung.
- 0.3: Dokumentinhalt und Seitenzahl stammen aus tatsächlich geladenen PDFs. Fehlende Werte werden nicht geschätzt.
- 0.4: Kartenstatus, Datenladezustand und PDF-Ladezustand werden unabhängig behandelt. Ein erkannter Kartenimpuls beweist noch kein erfolgreich geladenes Dokument.
- 0.5: Für den öffentlichen Demo-Dokumentbestand werden ausschließlich freigegebene Formulare und ausdrücklich fiktive Muster verwendet.
- 0.6: Die feste Demokarte verweist auf eine klar fiktive Patientin. Es werden keine bestätigte UID-Identität, Anmeldung oder medizinische Gültigkeit behauptet.
- 0.7: Leere Liste, fehlgeschlagene Liste, beschädigtes PDF und fehlende optionale KI-Antwort erhalten unterschiedliche Zustände.
- 0.8: Ein verspätetes Ladeergebnis darf die inzwischen gewählte Karte, das aktive Dokument oder die aktuelle Seite nicht überschreiben.
- 0.9: Tastatur, Maus und Touch erreichen dieselben Kernfunktionen. Fokus und aktive Auswahl bleiben sichtbar.
- 0.10: Vorgeschlagenes primäres Testprofil: Windows-Demo-Laptop, Chrome, 1366 × 768 und 1920 × 1080. Ergänzend 390 Pixel breite Darstellung und Browserzoom 200 Prozent.
- 0.11: Performance wird am echten Demo-PDF-Bestand gemessen. Vorgeschlagenes Ziel: sichtbare Kartenreaktion binnen 300 ms und erste Seite eines lokalen Demo-PDFs binnen 2 s nach warmer Initialisierung. Netzladezeiten separat erfassen.
- 0.12: Große Dokumente dürfen die Bedienung nicht blockieren. Aktuelle Seite priorisieren, Vorschaubilder bedarfsgerecht laden.
- 0.13: Ohne optionales KI-Modul nutzt das Originaldokument die frei werdende Fläche.
- 0.14: Kein Zustand darf nur durch Farbe, Animation oder ein unbeschriftetes Icon erkennbar sein.

## Anforderungen je Issue

### Issue 3 Projektgrundlage
[Original #3](https://github.com/DucAnh0075/leuphana_hackathon/issues/3) · geschlossen · Voraussetzung

Quelle: Next.js-Gerüst mit TypeScript, App Router, Tailwind, Supabase und React-PDF; erfolgreicher Build.
- 3.1: Das vorhandene Gerüst aus dev bildet die Grundlage des UI-Branches.
- 3.2: / öffnet den KIS-Arbeitsplatz; /dokumente bleibt als Weiterleitung dorthin erreichbar. Das PDF öffnet im Patientenkontext.
- 3.3: Erweiterungen folgen dem bestehenden Strict-TypeScript-Setup; das vorhandene Lockfile bleibt Grundlage reproduzierbarer Installationen.
- 3.4: Ergänzung: Viewer-Interaktionen, Datenzugriff und Reader-Ereignisse erhalten getrennte Verantwortlichkeiten.
Abnahme: Installation aus dem Lockfile, Lint und Produktionsbuild; beide Routen starten ohne Browser- oder Hydrationsfehler.

### Issue 4 Dokumentenspeicher
[Original #4](https://github.com/DucAnh0075/leuphana_hackathon/issues/4) · geschlossen · Voraussetzung

Quelle: öffentlicher Bucket documents und erreichbares Test-PDF.
- 4.1: Die UI kann die freigegebenen Demo-PDFs ohne zusätzlichen Login lesen.
- 4.2: Die Verfügbarkeit wird mit einer realen PDF-URL geprüft; der Issue-Status allein genügt nicht.
- 4.3: Ergänzung: Öffentlicher Lesezugriff erlaubt keine Upload- oder Löschfunktion aus der UI.
- 4.4: Ergänzung: Ein vorübergehend nicht erreichbarer Speicher blockiert weder Rückkehr noch Simulation.
Abnahme: PDF ohne Dashboard-Sitzung öffnen; Ausfall bewusst auslösen und Fallback prüfen.

### Issue 5 Konfiguration
[Original #5](https://github.com/DucAnh0075/leuphana_hackathon/issues/5) · geschlossen · Voraussetzung

Quelle: zentraler Supabase-Client, Env-Beispiel und verständlicher Fehler bei fehlender Konfiguration.
- 5.1: Vorhandene Variablennamen und Client-Schnittstelle weiterverwenden.
- 5.2: Fehlende Konfiguration führt zu einem nutzbaren Fehler- oder lokalen Demozustand.
- 5.3: Ergänzung: Nutzer sehen eine Handlungsoption; Env-Namen und Einrichtungsdetails bleiben in der technischen Diagnose.
- 5.4: Ergänzung: Zugangsdaten werden nicht in Beispieldaten, Screenshots oder Quelltext übernommen.
Abnahme: Beide Variablen vorhanden, eine fehlt, beide fehlen; kein unkontrollierter Seitenabbruch.

### Issue 6 Dokumentliste
[Original #6](https://github.com/DucAnh0075/leuphana_hackathon/issues/6) · geschlossen · Datenintegration

Quelle: PDFs aus documents, Titel aus Dateinamen, dynamisches Laden, Übergabe von title und url sowie Leerzustand.
- 6.1: Dateiendungen werden unabhängig von Groß-/Kleinschreibung erkannt; Ordner und andere Dateien sind keine Dokument-Tabs.
- 6.2: Reihenfolge ist stabil; Titel bleiben lesbar, auch bei langen Namen und Umlauten.
- 6.3: Eine leere Liste zeigt „Keine Dokumente hinterlegt“ mit Rückkehrmöglichkeit.
- 6.4: Ergänzung: Leerstand und Abruffehler sind unterscheidbar; Retry ist bei Fehlern erreichbar.
- 6.5: Ergänzung: Mehr als 100 Dateien werden nicht unbemerkt abgeschnitten. Für den Demo-Bestand ist die Vollständigkeit zu prüfen; bei Überschreitung wird paginiert.
- 6.6: Neu bereitgestellte Dokumente erscheinen nach erneuter Abfrage ohne Frontend-Neuveröffentlichung.
Abnahme: Null, ein und mehrere PDFs; Nicht-PDF-Dateien, identische Anzeigetitel, lange Dateinamen und neuer Upload.

### Issue 7 Fallback
[Original #7](https://github.com/DucAnh0075/leuphana_hackathon/issues/7) · MVP

Quelle: lokale PDFs bei fehlender Konfiguration oder Speicherausfall, sichtbarer Offline-Hinweis.
- 7.1: Ein definierter lokaler Demobestand lässt den Viewer unabhängig vom Cloudspeicher arbeiten.
- 7.2: Der Datenursprung ist sichtbar, zum Beispiel „Lokale Demo-Dokumente“.
- 7.3: Ergänzung: Ein leerer Cloud-Bestand wird nicht still mit Beispieldaten aufgefüllt.
- 7.4: Ergänzung: Scheitern Cloud und lokaler Bestand, erscheint ein Fehler mit Wiederholen und Zurück.
- 7.5: Ergänzung: Ausfall des Speichers und vollständiger Internetausfall werden separat getestet.
- 7.6: Vorschlag für die erste Demo: lokal startbare Anwendung inklusive PDF-Worker und benötigter Assets. Eine zuvor unbesuchte gehostete Website ist durch lokale PDF-Pfade allein nicht offline verfügbar.
Abnahme: Cloud nicht erreichbar; Env fehlt; Internet getrennt bei lokal laufender Anwendung. Vollständige PWA-Offlinefähigkeit ist eine spätere Entscheidung.

### Issue 8 Veröffentlichung
[Original #8](https://github.com/DucAnh0075/leuphana_hackathon/issues/8) · MVP-Integration

Quelle: Vercel-Veröffentlichung, Env-Konfiguration, dokumentierte URL und beide Routen funktionsfähig.
- 8.1: Entwicklungsstand und veröffentlichter Stand sind über Commit und URL identifizierbar.
- 8.2: Direkter Einstieg in /dokumente funktioniert auf der veröffentlichten URL.
- 8.3: Ergänzung: PDF-Worker, PDF-Zugriff und Download werden im Produktionsbuild geprüft.
- 8.4: Ergänzung: Zugriff von HTTPS auf eine lokale Reader-Bridge wird am Zielbrowser tatsächlich getestet; Berechtigungsabfragen gehören in die Demo-Anleitung.
Abnahme: Kernablauf lokal und auf der Ziel-URL mit demselben Dokumentbestand.

### Issue 9 Reader bestimmen
[Original #9](https://github.com/DucAnh0075/leuphana_hackathon/issues/9) · Integrationsvoraussetzung

Quelle: Notepad-Test, Modellbezeichnung und beobachtete UID.
- 9.1: Reader-Modell, Betriebssystem, Testdatum und beobachtetes Verhalten werden festgehalten.
- 9.2: Ergänzung: Keine Tastatureingabe bedeutet zunächst „noch nicht bestimmt“; Verbindung und Treiber können ebenfalls die Ursache sein.
- 9.3: Der tatsächliche Reader wird als Tastatur- oder PC/SC-Pfad angeschlossen.
- 9.4: Ergänzung: Ein Test mit Simulation ersetzt keinen Hardwaretest.
Abnahme: Karte auflegen, entfernen und erneut auflegen; Ereignisse dem echten Vorgang zuordnen.

### Issue 10 Tastaturreader
[Original #10](https://github.com/DucAnh0075/leuphana_hackathon/issues/10) · MVP

Quelle: schneller Zeichenpuffer, Abstand unter 50 ms, Enter, mindestens vier Zeichen, Eingabefelder ignorieren.
- 10.1: Ein vollständiger Scan löst genau einen Kartenablauf aus.
- 10.2: Zu langsame oder unterbrochene Eingaben verwerfen den angefangenen Puffer.
- 10.3: Ergänzung: Eingaben in input, textarea und bearbeitbaren Textbereichen lösen keine Karte aus.
- 10.4: Ergänzung: Steuer-, Modifier- und Wiederholungstasten werden nicht als UID-Zeichen interpretiert.
- 10.5: Ergänzung: Die Zeitheuristik ist keine Authentifizierung; normale Bedienung und Readerzeichen werden gemeinsam getestet.
Abnahme: gültiger Scan, kurzer Scan, Timeout, normales Tippen, Eingabefeld und gehaltene Taste.

### Issue 11 Bridge-Anbindung
[Original #11](https://github.com/DucAnh0075/leuphana_hackathon/issues/11) · MVP

Quelle: WebSocket auf localhost:8787, uid-Nachricht, Reconnect alle drei Sekunden, bestehender Statusvertrag.
- 11.1: Gültige Nachrichten lösen denselben UI-Ablauf wie Tastatur und Simulation aus.
- 11.2: Fehlende Bridge lässt die Oberfläche und Tastaturbedienung nutzbar.
- 11.3: Ergänzung: Fehlerhaftes JSON, leere UID und unbekannte Nachrichtentypen verursachen keinen Absturz.
- 11.4: Ergänzung: Listener, Verbindungen und Wiederverbindungstimer werden beim Verlassen sauber beendet.
- 11.5: Ergänzung: Eine verbundene Bridge wird nicht mit einem nachgewiesen verfügbaren Hardware-Reader gleichgesetzt.
Abnahme: Verbindungsaufbau, Verbindungsverlust, Wiederverbindung und ungültige Nachricht.

### Issue 12 Windows-Bridge
[Original #12](https://github.com/DucAnh0075/leuphana_hackathon/issues/12) · bedingt durch Hardware

Quelle: lokales Node-Programm mit nfc-pcsc/ws und realem Reader-Test.
- 12.1: Die Bridge läuft auf dem Windows-Rechner mit USB-Zugriff.
- 12.2: Kartenereignisse erreichen den Browser im vereinbarten Nachrichtenformat.
- 12.3: Ergänzung: Leserfehler und fehlender Reader werden als Diagnose sichtbar, ohne einen Erfolg zu simulieren.
- 12.4: Ergänzung: Die lokale Schnittstelle wird auf Loopback begrenzt und zugelassene Browser-Origin geprüft.
Abnahme: tatsächliche Karte, Entfernen des Readers, erneuter Anschluss und parallele Browserverbindung.

### Issue 13 Ersatz-Bridge
[Original #13](https://github.com/DucAnh0075/leuphana_hackathon/issues/13) · bedingter Fallback

Quelle: Python-Ersatz mit demselben Port und uid-Format.
- 13.1: Der UI-Vertrag bleibt beim Wechsel der Bridge unverändert.
- 13.2: Ergänzung: Es läuft nur eine Bridge auf dem Port; Portkonflikte werden erklärt.
- 13.3: Der Ersatz wird erst bei einem konkret gescheiterten primären Pfad benötigt.
Abnahme: identisches Kartenverhalten mit dem Ersatz, dokumentierter Start und Stop.

### Issue 14 Smartphone-Zugang
[Original #14](https://github.com/DucAnh0075/leuphana_hackathon/issues/14) · optional

Quelle: NFC-URL auf der Karte, entsperrtes iPhone, Karte weiter beschreibbar.
- 14.1: Der direkte Link öffnet /dokumente ohne USB-Reader oder lokale Bridge.
- 14.2: Ergänzung: Die mobile Oberfläche erlaubt Dokumentwechsel, Seitenwechsel, Zoom und Rückkehr.
- 14.3: Ergänzung: Der allgemeine Link stellt keine persönliche Dokumentzuordnung dar.
- 14.4: Vor dem Beschreiben ist die endgültige Demo-URL festzulegen.
Abnahme: physischer Scan auf dem vorgesehenen iPhone und nutzbarer Viewer in Safari.

### Issue 15 Startbildschirm
[Original #15](https://github.com/DucAnh0075/leuphana_hackathon/issues/15) · UI-Kern

Quelle: ruhiger Kiosk, große Überschrift, Karten-Icon, Puls und Reader-Status.
- 15.1: Einstieg ist die Stationsübersicht mit Patientennamen, Fallnummern, Zimmern und Betten.
- 15.2: Eine kompakte Aktion „Karte einlesen (Demo)“ zeigt den Eingang in die klinische Arbeitsoberfläche.
- 15.3: Ergänzung: Simulation, zugeordnete Demopatientin und Dokumenteingang sind sichtbar; eine vorhandene Akte darf nicht mit dem Kartenempfänger verwechselt werden.
- 15.4: Ergänzung: Für Tastatureingaben lautet der ehrliche Status „Tastaturmodus aktiv“, solange Hardwarepräsenz nicht festgestellt werden kann.
- 15.5: Ergänzung: Kurze Statusübergänge erklären den Import; keine dekorative Pulsanimation auf dem klinischen Arbeitsplatz.
- 15.6: Der Bildschirm funktioniert im Vollbild und in einem normalen Browserfenster.
Abnahme: sofort erkennbare Hauptaktion, lesbarer Status, kein Scrollzwang im primären Laptopformat.

### Issue 16 Karte erkannt und Simulation
[Original #16](https://github.com/DucAnh0075/leuphana_hackathon/issues/16) · UI-Kern

Quelle: CardListener, Erfolgsmeldung, Weiterleitung, Button und Leertaste.
- 16.1: Tastaturreader, Bridge und Simulation benutzen einen gemeinsamen Übergang.
- 16.2: „Karte erkannt“ bestätigt das Ereignis; der anschließende Ladezustand bestätigt erst den Dokumentabruf.
- 16.3: Ergänzung: Simulation ist als Demoaktion gekennzeichnet und behauptet keinen Hardwarekontakt.
- 16.4: Ergänzung: Wiederholte Ereignisse während eines laufenden Übergangs erzeugen keine mehrfachen Navigationen.
- 16.5: Ergänzung: Leertaste simuliert im Klinikarbeitsplatz außerhalb von Formularen, fokussierten Bedienelementen, Dialogen und dem PDF-Viewer.
- 16.6: Ergänzung: Nach der Zuordnung wird die richtige Patientenakte geöffnet und der Patientenkopf fokussiert.
Abnahme: alle drei Auslöser, Doppelklick und mehrfacher Scan während des Ladens.

### Issue 17 PDF-Viewer
[Original #17](https://github.com/DucAnh0075/leuphana_hackathon/issues/17) · UI-Kern

Quelle: browserseitiger React-PDF-Viewer, Worker, docs-Vertrag, Lade- und Fehlerzustand.
- 17.1: Das aktive Original-PDF wird innerhalb der Patientenakte mit dauerhaft sichtbarem Patientenkopf angezeigt.
- 17.2: Dokument laden, Seite rendern, Dokumentfehler und Seitenfehler sind unterscheidbar.
- 17.3: Ergänzung: Fehler eines PDFs lassen den Wechsel auf andere Dokumente zu.
- 17.4: Ergänzung: „Erneut versuchen“ und Öffnen des Originals bleiben bei renderbaren Zugriffspfaden erreichbar.
- 17.5: Ergänzung: Bei einem Wechsel verschwinden alte Seiten unter dem neuen Dokumenttitel.
- 17.6: Ergänzung: Passwortgeschützte oder nicht unterstützte PDFs werden verständlich als nicht darstellbar gemeldet; kein Passwortworkflow im MVP.
- 17.7: Ergänzung: Text- und Annotationsschichten erhalten auswählbaren Text und relevante Links.
- 17.8: Ergänzung: Worker und benötigte Ressourcen sind lokal gebündelt.
Abnahme: Text-PDF, mehrseitiges PDF, Bildscan, defekte Datei, 404, langsames Laden und schneller Dokumentwechsel.

### Issue 18 Dokumentauswahl
[Original #18](https://github.com/DucAnh0075/leuphana_hackathon/issues/18) · UI-Kern

Quelle: ein Tab beziehungsweise eine Kachel je PDF, Titel und Seitenzahl, aktive Hervorhebung, Rücksetzen auf Seite 1.
- 18.1: Jedes Dokument ist über seinen Titel auswählbar.
- 18.2: Seitenzahlen erscheinen erst nach erfolgreichem Ermitteln; vorher ein neutraler Ladezustand.
- 18.3: Ergänzung: Gleiche Titel werden intern über unterschiedliche Dokumentidentitäten getrennt.
- 18.4: Ergänzung: Viele oder lange Titel bleiben durch Scrollen und vollständigen zugänglichen Namen erreichbar.
- 18.5: Ergänzung: Pfeiltasten im Tab-Bereich bewegen den Tabfokus; Enter/Leertaste aktivieren den gewählten Tab.
- 18.6: Ein Wechsel beginnt auf Seite 1; der vorgeschlagene Zoom-Standard ist Seitenbreite.
Abnahme: ein und viele Dokumente, lange Namen, Tastaturwechsel und wiederholter Wechsel.

### Issue 19 Seitenvorschau
[Original #19](https://github.com/DucAnh0075/leuphana_hackathon/issues/19) · UI-Kern

Quelle: Miniaturen aller Seiten, Klicknavigation, aktive Markierung und Mitscrollen.
- 19.1: Jede Vorschau besitzt eine sichtbare Seitennummer und einen zugänglichen Namen.
- 19.2: Aktivieren per Maus oder Tastatur zeigt die entsprechende Seite.
- 19.3: Die aktuelle Seite ist hervorgehoben und wird bei Seitenwechseln im Vorschaufenster sichtbar.
- 19.4: Ergänzung: Vorladen wird begrenzt, damit lange PDFs nicht gleichzeitig sämtliche Canvas-Flächen erzeugen.
- 19.5: Ergänzung: Ein Vorschauladefehler blockiert weder Hauptseite noch Seitenwechsel.
- 19.6: Ergänzung: Auf kleinen Bildschirmen ist die Vorschau einklappbar; die Hauptnavigation bleibt verfügbar.
Abnahme: erste, mittlere und letzte Seite; langes PDF; Wechsel über Hauptnavigation synchronisiert die Vorschau.

### Issue 20 Seitennavigation
[Original #20](https://github.com/DucAnh0075/leuphana_hackathon/issues/20) · UI-Kern

Quelle: Vor/Zurück, Pfeiltasten, Seite x von y und Anpassung an Containerbreite.
- 20.1: Die erste Seite hat keinen aktiven Zurück-Schritt, die letzte keinen aktiven Weiter-Schritt.
- 20.2: Seitenzahl und angezeigte Seite stimmen nach jedem Wechsel überein.
- 20.3: Ergänzung: Pfeiltasten blättern im Lesebereich, überschreiben aber weder Tab-Navigation noch Texteingaben.
- 20.4: Ergänzung: Seitenwechsel hält den Fokus auf der ausgelösten Bedienaktion.
- 20.5: Ergänzung: Formatwechsel zwischen Hoch- und Querformat verzerrt das PDF nicht.
- 20.6: Ergänzung: Änderung der Fensterbreite aktualisiert die Darstellung ohne falsche Seitennummer.
Abnahme: Einseiter, Mehrseiter, Grenzseiten, Tastatur und Fenstergrößenwechsel.

### Issue 21 Zoom und Original
[Original #21](https://github.com/DucAnh0075/leuphana_hackathon/issues/21) · UI-Kern

Quelle: Zoomtasten, Plus/Minus auf der Tastatur, Herunterladen beziehungsweise Öffnen.
- 21.1: Vorschlag: Zoom von 50 bis 200 Prozent in 25-Prozent-Schritten plus „An Breite anpassen“.
- 21.2: Aktuelle Zoomstufe und verfügbare Aktionen sind erkennbar.
- 21.3: Ergänzung: Browserzoom mit Strg/Cmd wird nicht abgefangen.
- 21.4: Ergänzung: Zoomen verändert nur die Darstellung und niemals den PDF-Inhalt.
- 21.5: Die Originaldatei kann heruntergeladen oder in einem neuen Tab geöffnet werden.
- 21.6: Ergänzung: Wenn der Browser nur Öffnen unterstützt, benennt die Aktion genau dieses Verhalten.
Abnahme: Zoomgrenzen, Größenwechsel, Originaldatei erreichbar und keine ungewollte neue Sitzung.

### Issue 22 Abschluss und Inaktivität
[Original #22](https://github.com/DucAnh0075/leuphana_hackathon/issues/22) · UI-Kern

Quelle: Fertig, Escape und automatische Rückkehr nach zwei Minuten ohne Eingabe.
- 22.1: „Dokument schließen“ führt zur Dokumentliste derselben Akte. „Zur Stationsübersicht“ schließt die Akte; der Dokumenteneingang bleibt erhalten.
- 22.2: Escape schließt zuerst den Warnungsdialog, danach den PDF-Viewer, danach die Akte. Eingegangene Dokumente werden dadurch nicht entfernt.
- 22.3: Ergänzung: Tastatur-, Zeiger-, Touch- und Scrollaktivität erneuern den Timer; Hintergrundabrufe tun dies nicht.
- 22.4: Ergänzung: Nach 100 Sekunden erscheint eine Warnung mit 20 Sekunden Reaktionszeit und „Weiterlesen“.
- 22.5: Ergänzung: Verlängern ist wiederholt möglich; danach beginnt die Frist neu.
- 22.6: Ergänzung: Beim Schließen verschwindet der PDF-Lesezustand; der Import bleibt erhalten. Nur „Demo zurücksetzen“ oder ein Neuladen löscht den simulierten Aktenbestand.
- 22.7: Ergänzung: Timer werden beim Verlassen entfernt und laufen nicht doppelt.
Abnahme: Fristablauf, Aktivität kurz vor Ablauf, Verlängern, Escape im Dialog und wiederholter Start.
Die Verlängerung konkretisiert die Barrierearmut anhand [WCAG Timing Adjustable](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html).

### Issue 23 Weitere Karte
[Original #23](https://github.com/DucAnh0075/leuphana_hackathon/issues/23) · UI-Kern

Quelle: neue Karte aktualisiert den Bestand und setzt auf Dokument 1, Seite 1.
- 23.1: Kartenereignisse werden auch während des Lesens verarbeitet.
- 23.2: Eine erkannte Karte öffnet die zugehörige Akte unabhängig von der vorher ausgewählten Person; der PDF-Lesezustand wird beim Öffnen neu initialisiert.
- 23.3: Ergänzung: Aktualisieren der Daten und Rücksetzen des lokalen Viewer-Zustands sind getrennte Schritte.
- 23.4: Ergänzung: Wiederholte Imports derselben Demokarte erzeugen keine Dokument- oder Verlaufduplikate.
- 23.5: Ergänzung: Antworten aus einer älteren Sitzung dürfen den aktuellen Bestand nicht ersetzen.
Abnahme: zweite Karte auf Seite 3 eines anderen PDFs; Duplikate; langsamere Antwort der vorherigen Sitzung.

### Issue 24 Barrierearme Bedienung
[Original #24](https://github.com/DucAnh0075/leuphana_hackathon/issues/24) · UI-Kern

Quelle: große Schrift, WCAG-AA-Kontraste, sichtbarer Fokus, Tastatur und benannte Icon-Buttons.
- 24.1: Vorschlag: UI-Grundschrift 18 px mit klarer Hierarchie und ausreichend Zeilenabstand.
- 24.2: Normaltext erreicht 4,5:1, großer Text mindestens 3:1; Status bleibt zusätzlich textlich verständlich.
- 24.3: Jede Aktion ist fokussierbar; Reihenfolge folgt der sichtbaren Arbeitsfolge.
- 24.4: Vorschlag: wichtige Bedienflächen mindestens 44 × 44 CSS-Pixel.
- 24.5: Dokument-Tabs, Dialoge und Icon-Aktionen besitzen passende Semantik und Namen.
- 24.6: Lade- und Fehleränderungen werden für assistive Technik angekündigt, ohne jeden Renderfortschritt vorzulesen.
- 24.7: Reduzierte Bewegung wird berücksichtigt; keine blinkende Notfallsymbolik.
- 24.8: Browserzoom 200 Prozent erhält erreichbare Bedienelemente; für das PDF ist separates Scrollen zulässig.
- 24.9: Ergänzung: Eine zugängliche UI macht einen eingescannten, ungetaggten PDF-Inhalt nicht automatisch barrierefrei.
Abnahme: kompletter Ablauf nur mit Tastatur, Fokusprüfung, Kontrastprüfung, reduzierter Bewegung und Screenreader-Stichprobe.
Quellen: [W3C Kontrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [W3C Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/). Die 44-Pixel-Zielgröße ist hier ein Designvorschlag.

### Issue 25 Dokumentquellen
[Original #25](https://github.com/DucAnh0075/leuphana_hackathon/issues/25) · Content-Abhängigkeit

Quelle: offizielle Formulare und weitere seriöse Muster mit Herkunft.
- 25.1: Patientenverfügung, Vorsorgevollmacht und Betreuungsverfügung sind als Dokumentarten erkennbar.
- 25.2: Ergänzung: Erläuterungsbroschüre, leeres Formular und ausgefülltes Muster werden nicht gleich benannt.
- 25.3: Quellenherkunft und Version sind für das Content-Team nachvollziehbar.
- 25.4: Ergänzung: Ein Download wird auf tatsächliches PDF-Format und Lesbarkeit geprüft.
Abnahme: freigegebener Demo-Dokumentbestand mit eindeutigen Titeln und überprüfbarer Herkunft.

### Issue 26 Fiktive Beispiele
[Original #26](https://github.com/DucAnh0075/leuphana_hackathon/issues/26) · Content-Abhängigkeit

Quelle: ausgefüllte Vorsorgevollmacht und Patientenverfügung für Max Mustermann, klare Musterkennzeichnung.
- 26.1: Muster sind im Dateititel und im Dokument selbst eindeutig erkennbar.
- 26.2: Ergänzung: Personenangaben sind innerhalb des Demobestands konsistent und fiktiv.
- 26.3: Ergänzung: Formulardaten und sichtbare PDF-Darstellung werden beide kontrolliert.
- 26.4: Konkrete Beispielsituationen werden fachlich geprüft; der Viewer behauptet keine Rechtsprüfung.
Abnahme: alle Musterseiten vollständig lesbar; keine realen Personenangaben.

### Issue 27 Bereitstellung
[Original #27](https://github.com/DucAnh0075/leuphana_hackathon/issues/27) · Content-Integration

Quelle: verfügbare PDFs im Speicher, sprechende Namen, Prüfung über /dokumente.
- 27.1: Jeder freigegebene Inhalt erscheint einmal in der Dokumentauswahl.
- 27.2: Ergänzung: Cloud- und lokaler Demobestand haben eine nachvollziehbare Zuordnung.
- 27.3: Ergänzung: Entfernte oder ersetzte PDFs führen nach Aktualisierung nicht zu veralteten Tabs.
Abnahme: jeden Tab öffnen, Seiten und Download prüfen, anschließend ein Dokument ergänzen und erneut laden.

### Issue 28 KI Zusammenfassung
[Original #28](https://github.com/DucAnh0075/leuphana_hackathon/issues/28) · ausdrücklich optional

Quelle: Zusammenfassung pro PDF, ärztliche und einfache Fassung, Cache, optionale Übersetzung.
- 28.1: Ein- und ausblendbare Seitenleiste bezieht sich eindeutig auf das aktive Dokument.
- 28.2: „Ärztlich“ und „Einfache Sprache“ sind zwei getrennte Ansichten.
- 28.3: Ergänzung: Generierung, verfügbarer Inhalt, Fehler und nicht unterstützter Dokumenttyp sind unterscheidbar.
- 28.4: Ergänzung: Das PDF bleibt nutzbar, während die KI lädt oder ausfällt.
- 28.5: Ergänzung: Aussagen erhalten nachvollziehbare Seitenbezüge; Bedingungen und Einschränkungen aus dem Original bleiben erhalten.
- 28.6: Ergänzung: Fehlender Text oder widersprüchliche Angaben werden kenntlich gemacht; es werden keine Behandlungsentscheidungen ergänzt.
- 28.7: Ergänzung: Kennzeichnung als KI-Zusammenfassung mit Zugang zum Original; keine Gleichsetzung mit ärztlich freigegebener Anordnung.
- 28.8: Ergänzung: Cache bezieht sich auf Dokumentversion, Darstellungsmodus und Generierungsversion, nicht nur den Dateinamen.
- 28.9: Ergänzung: Beim Dokumentwechsel erscheint keine Zusammenfassung des vorherigen PDFs unter dem neuen Titel.
- 28.10: Modell und Anbieter bleiben bis zur gesonderten Auswahl offen. Das im Issue beispielhaft genannte Modell wird nicht ungeprüft als verfügbar vorausgesetzt.
Abnahme: Originalbezüge stichprobenartig fachlich prüfen, Dokumentwechsel während Antwort, API-Ausfall, neue Dokumentversion und Scan ohne extrahierbaren Text.

### Issue 29 Pitch
[Original #29](https://github.com/DucAnh0075/leuphana_hackathon/issues/29) · Präsentationskontext

Quelle: sechs Minuten, konkrete Person, Problembeleg, Geschäftsmodell, KI-Einsatz und klare Kernbotschaft.
- 29.1: Die UI-Demo zeigt Karte, Dokumentzugriff und Lesen als zusammenhängenden Nutzen.
- 29.2: Ergänzung: Gezeigte Features werden als vorhanden, simuliert oder geplant korrekt benannt.
- 29.3: Ergänzung: Bei optional nicht umgesetzter KI wird kein Live-KI-Einsatz behauptet.
- 29.4: Zahlen tragen Population, Jahr und Originalquelle; wirtschaftliche Effekte bleiben Hypothesen, solange sie nicht belegt sind.
Abnahme: Demo und Pitch erzählen denselben tatsächlich umgesetzten Funktionsumfang.

### Issue 30 Probelauf
[Original #30](https://github.com/DucAnh0075/leuphana_hackathon/issues/30) · Abnahme

Quelle: echter Reader, Veranstaltungs-WLAN, Backup-Video, Rollen und Zeitprobe.
- 30.1: Hauptablauf läuft auf dem tatsächlichen Demo-Laptop.
- 30.2: Ergänzung: Simulation und lokaler Ausfallpfad sind vorab geübt.
- 30.3: Ergänzung: Nach Fertig oder Timeout kann die nächste Vorführung sauber beginnen.
- 30.4: Vortrag plus Live-Demo bleiben innerhalb von sechs Minuten.
Abnahme: vollständige Probe mit Rollenverteilung; Ausfälle und Umgebungsbedingungen protokollieren.

### Issue 31 Abgabe
[Original #31](https://github.com/DucAnh0075/leuphana_hackathon/issues/31) · organisatorisch

Quelle: Team-ID als Dateiname, Upload, Sicherung und Anschlussadapter.
- 31.1: Die verlinkte Demo-URL zeigt den beabsichtigten Release-Stand.
- 31.2: Präsentation und Backup-Video zeigen denselben Funktionsumfang.
- 31.3: Zuständige Person prüft Upload und Vorführtechnik; diese Organisation erzeugt kein zusätzliches UI-Feature.
Abnahme: bestätigter Upload und praktisch geprüfte Vorführung.

## Informationsarchitektur und Gestaltungsvorschlag

Stationsübersicht: links Arbeitsbereiche und Zimmer, zentral Patientenliste mit Suche und Zimmerfilter. Patientenakte: dauerhafter Patientenkopf, Aktenbereiche Übersicht/Vorsorgedokumente/Verlauf, Eingangsliste mit Quelle und Zeit. PDF-Viewer: eingebettet unter dem Patientenkopf, einklappbare Seitenvorschau und Lesewerkzeuge; Schließen führt zur Akte.

Die visuelle Sprache soll an gut lesbare medizinische Dokumente anschließen: ruhige helle Flächen, klare Trennung zwischen Dokument und Bedienung, große Handlungsflächen. Keine Marketing-Kacheln oder Kennzahlen auf dem Arbeitsbildschirm.

Vorgeschlagene Tokens:
- Hintergrund #F3F6F8, Dokumentfläche #FFFFFF, Text #172B3A.
- Primäraktion #005A70, Trennlinien #CED8DE, Fehler #A12632.
- Schrift: bestehende Geist Sans konsequent verwenden, Zahlen mit gleichmäßiger Ziffernbreite; keine zusätzliche Schriftfamilie erforderlich.
- Typografie: 18 px Grundtext, 24 px Bereichstitel, 40–48 px Startanweisung; schmale Ansichten passen die Überschrift an.
- Hauptaktionen 44 px Mindesthöhe, klarer Fokusrahmen, nur kurze zustandsbezogene Bewegung.
Diese Farben sind Vorschläge; jede tatsächlich verwendete Kombination wird vor Abnahme gemessen.

## Empfohlener UI Tech Stack

| Baustein | Empfehlung | Begründung aus den Anforderungen |
|---|---|---|
| Anwendung | Bestehendes Next.js 16.4.5 mit App Router und React 19.3 übernehmen | Datenroute und Teamgerüst existieren; / und /dokumente bleiben stabil |
| Sprache | Vorhandenes TypeScript strict | Verhindert widersprüchliche Dokument-, Seiten- und Ereigniszustände |
| Styles | Vorhandenes Tailwind 4 plus kleine CSS-Tokenbasis | Responsive Lesefläche, Fokus, Kontraste und Reduced Motion ohne weitere Styling-Schicht |
| PDF | Bereits installiertes react-pdf 11 mit seinem kompatiblen PDF.js | Seiten, Thumbnails, Textschicht und Zoom sind Kernfunktionen |
| Bedienelemente | Native Buttons; gezielt Radix Tabs und Dialog ergänzen | Fokus-, Tab- und Dialogverhalten für #18, #22 und #24; keine komplette zusätzliche UI-Suite |
| Zustand | React state/reducer und kleine Hooks | Viewerzustand ist lokal; ein globaler Store ist derzeit nicht erforderlich |
| Daten | Bestehender Supabase-Adapter plus expliziter lokaler Demo-Adapter | #6/#7 ohne Speicherlogik in der visuellen Komponente |
| Reader | Vorhandenen Vertrag für useCardReader beibehalten; gemeinsame Ereignisverarbeitung | Hardware und Simulation lösen denselben Ablauf aus |
| Tests | Vorhandenes ESLint, TypeScript-Check, Build; Playwright als gezielte Test-Ergänzung | Browsernavigation, PDF-Rendering, Tastatur, Timer und Screenshotkontrolle |
| Hosting | Vercel nach bestehendem Plan; lokal startbare Demo als Rückfall | Bestehender Teamweg und prüfbarer Netz-Ausfallpfad |
| KI | Erweiterungspunkt vorsehen, Anbieterentscheidung separat | #28 ist optional und darf den Viewer nicht blockieren |

Die installierten Versionen und das vorhandene Lockfile werden vor dem UI-Bau übernommen, nicht blind aktualisiert. Das öffentliche React-PDF-Hauptbranch-README kann bereits eine andere Version beschreiben; maßgeblich ist beim Implementieren die Dokumentation der tatsächlich installierten Version 11.

Alternativen: Vite/React wäre für einen reinen Viewer möglich, würde hier aber das vorhandene Routing und Server-Datenladen ersetzen. Ein nativer PDF-iframe wäre schneller eingebaut, erlaubt jedoch weniger Kontrolle über Tabs, Thumbnails und konsistente Bedienung. Eine vollständige Material- oder Ant-Design-Suite liefert mehr Oberfläche als benötigt. Deshalb empfehle ich den vorhandenen Stack mit wenigen gezielten Ergänzungen.

## Technische Übergaben und nötige Korrekturen

1. Entwicklungsbasis: Der dev-Stand einschließlich lokalem PDF-Fallback wurde integriert. Die lokale AGENTS.md und installierten Next-Guides wurden beim Bau berücksichtigt.
2. Bestehender Viewer-Vertrag: docs ist eine Liste aus title und url. Den exportierten Typ kompatibel halten; stabile Identität, Quelle und Dokumentversion bei Bedarf ausdrücklich am gemeinsamen Vertrag ergänzen.
3. Bestehender Reader-Vertrag: useCardReader({ onCard }) liefert status; onCard erhält eine UID. Für Simulation wird derselbe Ereignisweg genutzt. Hardwarezustände nur erweitern, wenn der Reader-Owner sie tatsächlich liefern kann.
4. Session-Reset: Ein eigener Sitzungsschlüssel beziehungsweise Reset im Viewer muss Dokument, Seite, Zoom und spätere KI-Anfragen zurücksetzen. Ein reiner Daten-Refresh ist kein belastbarer Reset des gesamten UI-Zustands.
5. PDF-Browsergrenze: Der Plan schlägt ssr:false vor. Dieser dynamische Import gehört in eine Client-Komponente, nicht direkt in eine Server Component. Siehe [Next.js Lazy Loading](https://nextjs.org/docs/app/guides/lazy-loading).
6. Worker: Konfiguration im Modul der PDF-Komponenten und aus der kompatiblen PDF.js-Version bundeln; keine unbeabsichtigte CDN-Abhängigkeit. Siehe [React-PDF](https://github.com/wojtekmaj/react-pdf).
7. Tastaturkonflikte: Tabs nutzen eigene Pfeiltasten; Seitenwechsel greift nur im passenden Lesekontext. Das [Radix-Tab-Modell](https://www.radix-ui.com/primitives/docs/components/tabs) unterstützt diesen Fokusaufbau.
8. Datenzustände: Die derzeitigen Notice-Texte in /dokumente brauchen UI-gerechte Texte und Rückkehr/Retry. Die UI-Zuständigkeit reicht dafür an die Setup-Route; Änderung mit dem Setup-Owner abstimmen.
9. Globale Oberfläche: lang auf de, Produktmetadaten und tatsächliche Schriftverwendung korrigieren. Die aktuelle body-Regel verwendet Arial, obwohl Geist geladen wird.
10. Versionen: Vor Installation zusätzlicher Pakete Peer-Abhängigkeiten gegen den vorhandenen Lockfile-Stand prüfen. Für einen neuen Style-Stack besteht kein Anlass; [Tailwind unterstützt Next.js direkt](https://tailwindcss.com/docs/installation/framework-guides/nextjs).

## Produktblick nach dem MVP

Diese Anforderungen stammen aus dem größeren Briefing beziehungsweise dem Ausblick und sind keine stillen Voraussetzungen der ersten Demo:

- Persönliche Zuordnung von Karten und Dokumenten mit geregeltem Verlust, Ersatz und Widerruf.
- Authentifizierter beziehungsweise ausdrücklich geregelter Notfallzugriff auf private Dokumentbestände.
- Dokumentversionen, Aktualisierung, Widerruf und Herkunft so darstellen, dass veraltete Informationen erkennbar sind.
- Upload und geführte Erstellung auf Grundlage fachlich freigegebener Vorlagen.
- Fünf konkret auszuwählende Sprachen, dokumentierte Übersetzungsqualität und unterschiedliche Sprachniveaus.
- Fachliche Prüfung vereinfachter Texte, ohne relevante Bedingungen aus den Originalen zu verlieren.
- Barrierefreiheit der bereitgestellten Dokumente zusätzlich zur Oberfläche.
- Verständliche Angaben zu bevollmächtigten Personen, Zuständigkeit und Erreichbarkeit, soweit autorisierte Daten vorliegen.
- Rechtliche und organisatorische Freigabe für Verarbeitung und Weitergabe realer Gesundheitsdaten.
- Bedarf an Integration mit vorhandenen Versorgungssystemen prüfen; keine bereits funktionierende ePA-/Registerintegration behaupten.
- Erlösmodell anhand konkreter Zielgruppen und Nutzerfeedback entwickeln; kein Beleg für Kostensenkung allein aus einer technischen Demo ableiten.

## Prüfplan für den späteren Bau

| Szenario | Erwartetes Ergebnis |
|---|---|
| Simulation ohne Reader | Durchgängiger Einstieg, PDF lesen, Fertig, erneuter Start |
| Echte Karte auf beiden unterstützten Readerpfaden | Gleicher UI-Ablauf; tatsächliches Hardwareergebnis dokumentiert |
| Mehrfachsignal | Keine Navigationsschleife und kein wiederholtes Zurücksetzen während derselben Auflage |
| Leerer Bestand | Verständliche Leermeldung mit Rückkehr |
| Cloudfehler/fehlende Konfiguration | Expliziter lokaler Demobestand oder erklärter Fehler |
| Internet getrennt, lokale App aktiv | Gebündelte Assets und Demo-PDFs funktionieren |
| PDF defekt/404/geschützt | Lokaler Dokumentfehler; andere Dokumente erreichbar |
| Schneller Wechsel A nach B | Kein Ergebnis von A erscheint unter B |
| Einseiter/letzte Seite | Keine ungültige Seitennummer |
| Tastaturdurchlauf | Alle Funktionen erreichbar; Tabs und Seitenwechsel kollidieren nicht |
| Timeout | Warnung, Verlängerung und Rückkehr zur Station; Dokumenteingang bleibt erhalten |
| Neue Karte im Viewer | Neuer Bestand, Dokument 1, Seite 1, Standardzoom |
| Mobile Breite/200 Prozent Zoom | Kernaktionen bleiben sichtbar beziehungsweise erreichbar |
| Optionale KI fällt aus | Original-PDF unverändert nutzbar |
| Neu bereitgestelltes Dokument | Nach erneutem Laden ohne Deploy sichtbar |
| Veröffentlichter Build | PDF-Worker, Schrift, Datenzugriff und Reader-Verbindung tatsächlich geprüft |

Diese Szenarien sind Abnahmekriterien, keine bereits bestandenen Tests. Beim Bau reichen gezielte Browserprüfungen plus Lint, Typprüfung und Build; zusätzliche Tests dienen benannten Risiken.

## Reihenfolge bis zur ersten UI

1. Aktuellen dev-Stand integrieren, Abhängigkeiten prüfen und vorhandenes Gerüst bauen.
2. Mit einem freigegebenen lokalen Demo-PDF den Start, die Simulation und die vollständige Viewer-Bedienung umsetzen.
3. Lade-, Leer-, Fehler-, Fokus- und Timeoutzustände ergänzen und prüfen.
4. Supabase und echten Reader anschließen; beide Readerpfade separat abnehmen.
5. Produktionsbuild und Vorführablauf prüfen; optional danach die KI-Seitenleiste ergänzen.

Die erste KIS-Demo setzt Simulation und gekennzeichneten Demobestand um. Die endgültige Hardware- und Schnittstellenabnahme benötigt echte Reader-/KIS-Anbindungen; die oben aufgeführten Tests sind einzeln zu belegen.
