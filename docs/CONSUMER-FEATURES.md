# Consumer experience: feature contracts

## Aktueller VORAcard-Vertrag — 6. November 2026

**Aktuelle Informationsarchitektur:** Die öffentliche Website `/vorsorge` erklärt Nutzen und Ablauf mit Sprachwahl und einer reduzierbaren Markenanimation. Registrierung/Anmeldung und die ausdrücklich getrennte Demo führen nach `/vorsorge/app`. Erst dort werden Person, Anlass und Dokumentauswahl als **Fall** im Profil angelegt. Der Dokumentenfinder kann für einen weiteren Fall oder für eine bestätigte neue Auswahl erneut durchlaufen werden; vorhandene Antworten verschiedener Fälle bleiben getrennt.

| Zweck | Informationsfolge und Aktion | Grenze |
| --- | --- | --- |
| Einstieg verstehen | Website → `Konto erstellen` / `Anmelden` oder gekennzeichnete Demo → persönliches Dashboard | Die öffentliche Personenwahl ist keine versteckte Registrierung mehr. |
| Dokumente vorbereiten | Fallprofil → Dokumentenfinder → 40 Bausteine → Prüfung → amtliche Vorlage und Formfragen | Fallprofil bearbeiten statt vorhandene Antworten durch Personenwechsel löschen. DE/EN-Anzeige und tatsächliche Vorlagenwahl folgen der Sprache; eigene Antworten werden nicht übersetzt. |
| Formalitäten und Notariat | Dokument und konkretes Geschäft → keine allgemeine Notarpflicht / Beglaubigung / Beurkundung / Klärung → `Notartermin vorbereiten · Demo` → Zeit → Prüfung → Bestätigung | Eindeutig fiktive Notariate; keine echte Verfügbarkeit oder Buchung. Bestätigte Demo-Belege können mit Fallbezug im Dashboard gespeichert, heruntergeladen und storniert werden. |
| Prävention konkret planen | Leistung, Alters-/Programmgruppe, Intervall und Anlaufstelle → `Zu Aufgaben hinzufügen` oder `Termin vorbereiten` | Ohne letzte Untersuchung keine persönliche Fälligkeit oder Überfälligkeit. Keine individuelle medizinische Empfehlung. |
| Übersicht behalten | Offene Dokumentbausteine und Formalitäten, selbst hinzugefügte Vorsorgeaufgaben, Arzt-/Notar-Demotermine → passende Aufgabe öffnen oder Demo stornieren | Ein Speichern wird erst nach Serverbestätigung als erfolgreich angezeigt. Fehler erhalten Eingaben und Wiederholungsmöglichkeit. |
| Persönliche Gesundheitsunterlagen | ePA-first-Demoimpfpass; Organspendeausweis ausfüllen oder lokal hochladen; Reisevorbereitung | Gesundheitspass und Dateien liegen lokal im vom Server gelieferten `localScope` des Kontos bzw. der Demo. Kein automatischer Import alter globaler Browserdaten, keine echte ePA-/Registerverbindung. |

**Persistenz und Betriebsstand:** Ein eigener Profiladapter mit revisionsgebundenem, wiederholbarem Speichern ist implementiert. Die additive Migration [vora-profile.sql](../supabase/vora-profile.sql) liegt bereit, wurde jedoch **nicht angewendet**. Der überprüfte lokale Auth-Lauf meldet `configured: false`; ein bereits verknüpftes Supabase-Konto ersetzt keine Laufzeitkonfiguration. Ein produktiver DB-/RLS-Nachweis steht aus. Auth-Provider und bestehende Care-/Klinikdaten wurden nicht verändert. Die explizite Demo verwendet getrennten Server-Arbeitsspeicher und endet spätestens mit Ablauf oder Serverneustart. [Einrichtung und Grenzen](CARE-SETUP.md) beschreiben die nächsten Betriebsschritte.

**Vorlagen:** Vorsorgevollmacht und Betreuungsverfügung verwenden auf Englisch tatsächlich die amtlichen deutsch-englischen BMJV-Formulare; bei Abweichungen gilt deren deutscher Text. Für die Patientenverfügung sind englische Erklärungen und das deutsche amtliche Textbaustein-Original verfügbar. VORAcard erfindet keine amtliche englische Fassung. [Formen und Quellen](research/VORA-VORSORGE.md#11-formfragen-und-amtliche-sprachfassungen--06112026).

Die folgende Abnahme und der folgende Katalog gehören zur **vorherigen Iteration**. Sie bleiben Provenienz und beweisen nicht die aktuelle Website-/Profil-/Notariatsumsetzung. Die abschließende integrierte Abnahme dieses Auftrags berichtet der Lead gesondert; historische IDs **1–26** bleiben unverändert.

## Vorherige Iteration: VORA-Katalog — 6. November 2026

Owner: Consumer/VORA. Dieser Abschnitt beschreibt den aktuellen Ausbau und die ausdrücklich beauftragten Abläufe. Die historischen IDs **1–26**, früheren Entscheidungen und damaligen Prüfberichte bleiben darunter unverändert erhalten. Fachliche Originale und Grenzen stehen in [der Recherche](research/VORA-VORSORGE.md), der aktuelle UI-Vertrag in [VORA-DESIGN](VORA-DESIGN.md) und die Modellanbindung in [VORA-AI](VORA-AI.md). Implementierung, Demo, Nutzerbericht und abschließende Lead-Abnahme sind getrennte Nachweise.

| Bereich / Zweck | Informationsfolge | Konkrete Hauptaktionen | Aktueller Zustand und Grenze |
| --- | --- | --- | --- |
| **Documents — eigenen Willen vorbereiten** | Person/Zweck → Dokumentauswahl → 40 einzelne Blöcke (19 Vollmacht, 17 Patientenverfügung, 4 Betreuungsverfügung) → gemeinsame Prüfung → amtliches Original, Unterschrift und Ablage | `Choose documents`, `Continue document`, `Confirm & next` / `Leave open`, `Review documents`, `Open official form` bzw. `text modules` | Vier Phasen; Dokument, Phase und Block stehen in der URL, Wiederaufnahme sonst am nächsten offenen Block. Eigene Notizen, KI-Entwürfe und Review sind keine rechtswirksame Unterzeichnung. |
| **Prevention — passende Angebote verstehen** | Öffentliche G-BA-Angebote → optionale Alters-/Programmfilter → Bedingungen und Intervalle → Terminvorbereitung | `Prepare a visit` am Angebot übernimmt öffentliches Anliegen und Fachrichtung; Stadt/PLZ bleibt Nutzereingabe | Allgemeine Anspruchsorientierung, keine persönliche Fälligkeit/Empfehlung. Bestehende Terminvorbereitung wird erst nach `Use new visit topic` ersetzt; Abbruch erhält sie. |
| **Health pass / Vaccination passport — Unterlagen aus ihrer Quelle übernehmen** | ePA-Verbindungsstatus → gesonderte Einwilligung → Import → Herkunft und letzter erfolgreicher Demo-Abruf | `Connect Demo-ePA` → `Import demo vaccinations`; danach `Sync demo again` oder `Reset demo connection` | **ePA zuerst; kein Impfpass-Dateiupload und keine neue manuelle Erfassung.** Echter ePA-Anschluss fehlt. Demo-ePA ist ausdrücklich fiktiv. Vorhandene manuelle Notizen bleiben getrennt, lesbar und ungeprüft erhalten. |
| **Health pass / Organ donation card — freiwillige Entscheidung zugänglich halten** | Karte ausfüllen **oder** vorhandene Karte hochladen → eine von fünf Entscheidungen bzw. offene Entscheidung → prüfen → anzeigen/herunterladen → später ändern | `Complete a card` oder `Upload existing card`; örtlicher PNG/JPEG/PDF-Upload bis 5 MB, alternativ Formular und unsignierter deutscher Erklärungsentwurf | Unabhängig von ePA. Fünf Optionen: Zustimmung, Zustimmung mit Ausnahmen, nur bestimmte Organe/Gewebe, Widerspruch, Entscheidung durch benannte Person. Upload prüft technische Lesbarkeit, nicht Inhalt/Unterschrift; VORA schreibt nicht ins staatliche Register. |
| **Travel — konkrete Reise vorbereiten** | Ziel/Datum → amtliche Länder-/Transitinformationen → Einreisebedingungen getrennt von Beratung → Nachweise → Dokumentzugang | `Save trip`, `Prepare travel consultation`, `Open Health Pass`, `Open your documents`, Checkliste herunterladen | Beratung übernimmt nur öffentliches Anliegen/Fachrichtung in den Terminbrief; keine Reise- oder Personendaten werden automatisch weitergegeben. Datierte Länderhinweise und eigene Haken sind keine Einreisefreigabe. |
| **Appointment demo — Ablauf nachvollziehen** | Anliegen/Fachrichtung/Ort → fiktive Praxis und Beispielzeit → prüfen und ausdrücklich Demo bestätigen → Demo-Beleg/Kalender | `Try appointment demo`, `Preview practices (demo)`, `Confirm demo appointment`, Demo-Kalender herunterladen | Vier lokale Schritte, sämtliche Praxen/Zeiten fiktiv; Kalendereintrag trägt DEMO. Keine echte Verfügbarkeit, Doctolib-Übertragung oder Buchung. Vorbereitung bleibt im Arbeitsspeicher. |
| **Ask VORA — aktuellen Schritt verstehen** | Kleiner erreichbarer Avatar oder Blockfrage → Verbindung/Einwilligung → kurze Antwort und eine nächste Handlung → Rückfrage oder bewusste Notizübernahme | `Ask VORA`, `Continue with ChatGPT`, `Send`, im Dokument `Add explanation to my notes` | Temporäres Chatfenster; Nutzersprache hat Vorrang vor englischer UI. Nur Gespräch und öffentliche VORA-Erklärungen/Katalogkontext, keine gespeicherten Antworten/Dateien. Referenzen sind kuratiert, nicht live recherchiert. Nutzer meldet erfolgreiche lokale Anmeldung; vollständiger Live-Modelltest durch den Lead bleibt offen. |
| **Account / signed-document archive — vorhandene Unterlagen öffnen und gezielt teilen** | Einfache E-Mail/Passwort-Anmeldung → erhaltenes Ziel → vorhandenes Dokument/Fassung → Empfänger und Übergabe | `Log in`, `Signed-document archive`, bestehende Öffnen-/Teilen-Aktionen; E-Mail-Code sekundär | Separater vorhandener Supabase-/Care-Vertrag; Konfiguration bleibt unverändert. Anmeldung synchronisiert weder lokale Vorbereitung noch Gesundheitspass automatisch. |

Der aktuelle Impfpfad ersetzt die frühere manuelle Primäraktion. Das frühere pauschale Upload-Verbot wird **nur für vorhandene Organspendeausweise** erweitert; daraus folgt keine Freigabe für Impfpass- oder allgemeine Dokumentimporte. Die kleine kontextuelle Assistenz ersetzt die große dauerhafte Agentenfläche; sie erhält sichtbare Verbindungs-, Lade-, Fehler- und Einwilligungszustände.

**Tatsächliche Lead-Abnahme, 06.11.2026:** Finaler Produktionsbuild, fokussiertes ESLint und 20 Agent-/Provider-/Kontexttests bestanden. Vier betroffene Produktionsabläufe bestanden nach Korrektur einer veralteten Textassertion und eines beobachteten Navigationsproblems: vollständige 40-Block-Reise, isolierte Review-Invalidierung, Scroll-/Fokusorientierung, URL-Wiederaufnahme und öffentlicher Avatar-Kontext. Die getrennten Health-pass-, Ansichts-, Regressions- und Aktionsläufe sowie gerenderte Prüfung sind mit ihren eigenen Grenzen in [der aktuellen Design-Abnahme](VORA-DESIGN.md#current-implementation-and-lead-acceptance--6-november-2026) dokumentiert; es wird keine Gesamttestzahl daraus gebildet. [Produktionsbelege](../test-results/vora-production-final/recheck/) und [Health-pass-Belege](../test-results/vora-health-pass/evidence/) bleiben lokal. Der finale lokale Preview antwortet; die frühere Nutzerbestätigung zur Anmeldung ist kein Lead-Nachweis einer Live-Antwort des neuen Agenten. Historische Testzahlen unten bleiben unverändert.

## Historie — erster Consumer-Katalog und frühere Iterationen

Die folgenden Originalbeiträge beschreiben ihre damaligen Stände. Insbesondere manuelle Impfungen, statische Hilfe, OTP als Einstieg und frühere Upload-Grenzen gelten nicht als aktuelle Vorgaben gegen den obigen Katalog.

**Aktueller Ausbau VORA, 06.11.2026:** Henris anschließender Auftrag erweitert den hier dokumentierten ersten Umfang ausdrücklich um einen echten KI-Dialog, vollständiger aufgeteilte Dokumentprozesse, Impfpass, allgemeine Früherkennungsangebote und Reisevorbereitung. Die alte Priorisierung „statische Hilfe statt Agent“ gilt für den neuen VORA-Arbeitsbereich nicht mehr. [Recherche und Originalquellen](research/VORA-VORSORGE.md), [verbindliche UI-Richtung und Abnahme](VORA-DESIGN.md) sowie [KI-Vertrag und Betriebsgrenzen](VORA-AI.md) beschreiben den neuen Stand. Der folgende erste Katalog bleibt als nachvollziehbare Vorgeschichte erhalten; frühere lokale Entwürfe sind unter `/vorsorge?view=legacy` erreichbar.

Stand: 06.11.2026. Owner: Consumer-UI in `feat/notfallkarten-ui`. Grundlage sind Henris Korrekturen vom 06.11.: Englisch, wenige relevante Informationen, interaktive Prozessführung, dauerhaft erreichbare Sidebar, Vorlagenauswahl statt Upload, für sich selbst oder unterstützend für eine andere Person. Dieser Katalog ersetzt die frühere **Consumer**-Priorisierung in `UI-CONSUMER-ERWEITERUNG.md`; die klinische KIS-Oberfläche bleibt ein eigener Arbeitsplatz.

## Ziel und bewusste Grenze

**Vom unklaren Anliegen zu einem verständlichen, bearbeitbaren Vorsorgeplan – in kleinen Schritten.** Der unmittelbar sichtbare Nutzen ist Orientierung und geringerer Aufwand beim Einstieg. Ob Menschen damit tatsächlich weniger überfordert sind, muss ein Nutzertest zeigen; das ist kein durch Code bewiesener Effekt.

Der erste Ausbau erstellt einen **Planungsentwurf** aus Vorlagen-bezogenen Fragen. Er sammelt Wünsche, benannte Personen, Grenzen und offene Fragen. Er ersetzt noch nicht das vollständige Ausfüllen aller amtlichen Formularfelder, eine fachliche Prüfung, Unterschrift oder rechtswirksame Urkunde. Die Aktion heißt entsprechend `Download planning draft`, nicht `Finish legal document`. Neue Entwürfe werden nicht in die vorhandene Klinikakte oder deren Freigaben eingeschleust.

Die Consumer-Führung ist Englisch. Originale, Belegzitate und vom Klinikteam eingegebene Texte bleiben in ihrer Quellsprache; eine englische Erklärung ist keine beglaubigte Übersetzung. Die hinterlegten Vorlagen stammen aus dem deutschen Kontext, nicht aus einer beliebigen englischsprachigen Rechtsordnung. Die vorhandene Quellenherkunft in `public/templates/sources.json` und den Dokument-Metadaten bleibt erhalten. Allgemeine Abgrenzung der Dokumentarten: [Bundesgesundheitsportal](https://gesund.bund.de/vorsorge-fuer-den-ernstfall), [BMG zur Patientenverfügung](https://www.bundesgesundheitsministerium.de/patientenverfuegung/).

## Prozess und minimale Informationsarchitektur

```text
Public start                     Log in (optional here)
    |
Who is this for? -> What would help? -> Choose templates
                                             |
                                           Your plan
                                             |
                         About the person ----+---- selected document
                                                    |-- small package
                                                    |-- small package
                                                    `-- review answers
                                             |
                              Review planning draft -> Download draft

Separate existing-document path:
Documents -> Original/source -> Share selected versions -> Receipt / reply
```

Die Sidebar enthält nur `Your plan`, `Documents`, `Sharing` und eine zurückhaltende Hilfe. Ein Kontextwechsel ist jederzeit möglich, ohne eine Antwort still zu verwerfen. Anmeldung steht am Rand; sie ist keine Voraussetzung für die unverbindliche Orientierung. Geschützte Bestandsdokumente und klinische Übergaben benötigen weiterhin echte Berechtigungen oder den ausdrücklich synthetischen Beispielmodus.

Ein Bildschirm zeigt eine Hauptfrage beziehungsweise einen nächsten Schritt. Fortschritt beschreibt **bearbeitete Planungspakete**, nie einen medizinischen oder rechtlichen Vorsorge-Score. Details, frühere Fassungen, Ereignisse und technische Kennungen erscheinen erst bei Bedarf.

## Vollständiger Featurekatalog

`Lokal` bedeutet: keine Backend-Anfrage für diese Funktion. `Vorhanden` bezeichnet implementierte Verträge, nicht deren bereits bestätigten Cloud-Betrieb. Für den aktuellen Ausbau werden keine neuen externen Dienste eingeführt.

| Nr. / Feature | Zweck und konkreter Kundennutzen | Mindestens sichtbare UI / Interaktion | Backend und Daten | Entscheidung / Grenze | Abnahme |
|---|---|---|---|---|---|
| 1. Öffentlicher Einstieg | Ohne Registrierung verstehen, womit man beginnen kann. | Ein Nutzen-Satz, direkte Personenwahl mit `Continue`, `Log in`; keine Bestandsakte und kein KPI-Raster. | Lokal; keine private Datenabfrage beim Einstieg. | **Neu, Kern.** Anmeldung nicht vor Discovery erzwingen. | Ohne Sitzung erreichbar; keine Weiterleitung zum Login und kein `/api/care`-Aufruf vor Bestandszugriff. |
| 2. Für wen? | Fragen auf die betroffene Person beziehen und Verwechslung vermeiden. | `Myself` / `Someone else`; gewählter Kontext beim Bearbeiten sichtbar. | Lokal im Planungszustand. Keine Mitgliedschaft oder Vertretungsberechtigung daraus ableiten. | **Neu, Kern.** Helfen ist keine Vollmacht. | Personenwechsel verlangt Bestätigung und verwirft alte personenbezogene Antworten; Abbruch erhält sie. |
| 3. Anliegen klären | Dokumentnamen nicht kennen müssen, um anzufangen. | Kleine Auswahl konkreter Ziele und `Not sure yet`; zurück/editierbar. | Lokale, nachvollziehbare Zuordnung; keine Modellübermittlung. | **Neu, Kern.** Keine Diagnose oder rechtliche Einzelfallempfehlung. | Ziele verändern Vorschläge; Unsicherheit bleibt zulässig, keine automatische Auswahl aller Dokumente. |
| 4. Passende Vorlagen wählen | Verstehen, welche Vorlage zum genannten Zweck beitragen kann. | Verständlicher Titel, ein Grund, eine Grenze, Auswahlzustand und tatsächliche Aufgabenanzahl; gewählte Vorlagen bleiben sichtbar, weitere Vorlagen aufklappbar. | Lokaler Katalog mit stabilen IDs und Quellen; vorhandene vier Dokumentarten. | **Neu, Kern.** Nutzer wählt ausdrücklich; kein Upload. | Vorschlag erklärt sich aus Ziel; geändertes Ziel versteckt keine bestehende Auswahl; mindestens eine Auswahl vor Paketen; entfernte Vorlage erscheint nicht im Export. |
| 5. Paketübersicht / Aufgabenbaum | Umfang als kleine bearbeitbare Teile sehen. | Nur gewählte Dokumente, ihre Pakete, nächste offene Aufgabe; Zustand `Not started` / `In progress` / `Needs attention` / `Answered`. | Lokal, aus tatsächlichen Antworten abgeleitet. | **Neu, Kern.** Keine ornamental aufgeblähte Baumgrafik. | Pakete entsprechen Auswahl; gemeinsamer Personenteil wird nicht doppelt abgefragt; offene Aufgabe bleibt erreichbar. |
| 6. Geführte Bearbeitung | Jeweils wenige konkrete Fragen beantworten können. | Feldlabel, kurze Erklärung nur wo nötig, `Back`, Weiter-Aktion; Inline-Fehler. | Lokal; begrenzte Texte und bekannte Auswahlwerte. | **Neu, Kern.** Keine automatisch ausgefüllten Behandlungsentscheidungen. | Tastaturbedienbar; leere Pflichtantwort wird nicht als erledigt gewertet; vorherige Antworten bleiben beim Navigieren erhalten. |
| 7. Überspringen / später klären | Bei Unsicherheit weiterkommen, ohne etwas behaupten zu müssen. | `Leave this task open` und sichtbare offene Frage im Aufgabenbaum/Review. | Lokal, expliziter Pending-Zustand. | **Neu, Kern.** Überspringen ist kein Abschluss. | Pending senkt Vollständigkeit; Export benennt Lücken; spätere Antwort kann Lücke schließen. |
| 8. Hilfe am aktuellen Schritt | Einen Begriff oder die nächste Handlung verstehen, ohne den Prozess zu verlassen. | Kleiner Help-Einstieg; kurze kontextbezogene Erklärung, Quellenlink wenn fachlich. | Lokal, redaktionelle Hilfen. | **Vereinfachen.** Kein freies Chatfenster, keine erfundene KI-Kompetenz. | Hilfe passt zur aktuellen Aufgabe, schließt per Escape, Fokus kehrt zurück; Antworten werden nicht verändert. |
| 9. Fortschritt in diesem Tab | Unterbrechen, zurückspringen und neu laden können. | Zurückhaltender Hinweis `Saved in this tab`; letzte Aufgabe wiederfinden. | `sessionStorage`, versionierte/validierte Daten. Keine Cloud-Speicherung; keine Übertragung an Care-API. | **Neu, Kern.** Nur synthetische Angaben im Prototyp; Tab-Schließen kann Daten verlieren. | Reload erhält Zustand; beschädigte/veraltete Werte werden kontrolliert verworfen; Storage-Ausfall bietet verständlichen Hinweis statt falscher Speicherbestätigung. |
| 10. Entwurf prüfen / bearbeiten | Antworten und offene Punkte vor dem Export kontrollieren. | Gewählte Vorlage, eigene Antworten, offene Punkte, direkte Bearbeitung; Personenkontext. | Lokal; Review an aktuelle Revision gebunden. | **Neu, Kern.** Keine pauschale Gültigkeitsampel. | Änderungen nach Prüfung machen alte Prüfbestätigung ungültig; nicht ausgewählte Pakete fehlen. |
| 11. Planungsentwurf herunterladen | Ein greifbares Ergebnis für ein Gespräch oder die weitere Ausarbeitung mitnehmen. | `Download planning draft`, Format und Entwurfsstatus; klare nächste Schritte. | Lokaler Textdownload mit Antworten, Lücken, Quellen und Status. | **Neu, erster Umfang.** Kein unterschriebenes PDF, keine Klinikfreigabe. | Datei enthält tatsächliche Antworten, offene Punkte und Quellbezüge; keine verworfenen Angaben/Template-IDs; keine API-Mutation. |
| 12. Neu beginnen | Einen unpassenden oder fremden Entwurf sicher entfernen. | Sekundäre Reset-Aktion mit Bestätigung und abbrechbarem Dialog. | Entfernt nur eigenen Planungszustand im Tab. | **Behalten, minimal.** Keine Klinikakte oder Empfangsnachweise löschen. | Abbrechen erhält Zustand; bestätigen leert Antworten; Care-API wird nicht aufgerufen. |
| 13. Anmeldung | Private bestehende Unterlagen und Übergaben öffnen. | E-Mail-Code als Einstieg, Passwort als Alternative, sichtbarer Rückweg zum Plan. | Vorhanden: Supabase Auth `/api/auth`, verifizierte Sitzung. | **Behalten, später im Prozess.** Login behauptet keine Cloud-Speicherung des lokalen Entwurfs. | Weiterleitungsziel bleibt intern; Fehler und Ladezustand Englisch; Discovery bleibt frei. |
| 14. Beispielmodus | Ablauf ohne Projektkonfiguration nachvollziehen. | Explizite sekundäre Aktion `Open sample workspace`; sichtbare Kennzeichnung. | Vorhanden: `/api/demo`, isolierter synthetischer Lauf. | **Behalten, Demo-Werkzeug.** Kein stiller Fallback bei Auth-Fehlern. | Neue Demo bleibt vom privaten Modus getrennt; Rückweg mit `view`/`demo` korrekt; Ablauf/Serverneustart zeigt Neubeginn. |
| 15. Bestehende Dokumente | Hinterlegte Unterlagen finden und öffnen. | Englischer Typname, relevanter Stand, Öffnen; kein riesiger Metadatenblock. | Vorhanden: autorisierter `/api/care`-Snapshot, Dokument-API. | **Behalten, sekundär.** Kein vorgefülltes Archiv auf öffentlichem Start. | Aktuelle Dateien auffindbar; fremde Datei bleibt abgewiesen; fehlende Daten ergeben handlungsfähigen Leerzustand. |
| 16. Original und Belegstelle | Umfang und Einschränkungen am Original nachlesen. | Original, Seitensteuerung, aufklappbare Belegdetails; Quellsprache erkennbar. | Vorhandene geschützte PDF-Route; englische Viewer-Bedienung optional, KIS bleibt Deutsch. | **Behalten.** Zitate/Originale nicht still übersetzen. | Link öffnet richtige Datei/Seite; Bedingungen und Ausschlüsse bleiben erreichbar; Ladefehler wiederholbar. |
| 17. Fassungen | Verstehen, welche Fassung vorliegt oder übergeben wurde. | Version im Detail/Übergabedialog; frühere Fassungen zugeklappt. | Vorhandene immutable Dokument-IDs/Versionsmetadaten. | **Vereinfachen.** Keine Versionstabelle im Einstieg. | Bereits übergebene alte Fassung bleibt nachvollziehbar; aktuelle Fassung nicht mit Empfang verwechselt. |
| 18. Vorhandene Unterlagen teilen | Bewusst ein bestimmtes Paket an eine Klinik geben. | Person, Empfänger, ausgewählte Fassungen, `Send to clinic`, Abbrechen. | Vorhanden: `handoff`, rollen-/empfängergebunden, idempotente Request-ID. | **Behalten, sekundär.** Lokale Planungsentwürfe sind nicht automatisch teilbar. | Doppelversand erstellt keinen zweiten Vorgang; geänderte Auswahl neue Vorgangskennung; explizite Aktion erforderlich. |
| 19. Empfang / Übernahme | Nachvollziehen, ob Unterlagen angekommen und zugeordnet sind. | Empfänger, wahrer Status und nötige nächste Aktion; genaue Zeit im Detail. | Vorhandene Statusmaschine und klinische Bestätigung; Polling/Realtime laden Autoritätszustand nach. | **Behalten.** Eingang, Aktenübernahme und ärztliches Lesen sind verschieden. | Vor Fallbestätigung kein `Confirmed in record`; danach gleiche Fassung in beiden Ansichten, auch nach Reload. |
| 20. Rückfrage beantworten | Eine blockierte Zuordnung mit einer konkreten Antwort weiterbringen. | Originalfrage, kleines Antwortfeld, `Send reply`. | Vorhanden: `reply` mit erwarteter Revision; Verlauf bleibt erhalten. | **Behalten, nur wenn nötig.** Kein generischer Messenger. | Antwort bleibt im selben Vorgang; alte Revision abgewiesen; keine voreilige Aktenbestätigung. |
| 21. Offene Übergabe zurücknehmen | Noch nicht bestätigte Bereitstellung beenden. | Sekundäre Aktion + Bestätigung, klare Grenze. | Vorhanden: `withdraw` mit Revision. | **Behalten.** Bereits übernommene Aktenfassungen bleiben bestehen. | Abbruch bewahrt Vorgang; Rücknahme löscht keinen bestätigten Nachweis. |
| 22. Verlauf / technische Details | Einen konkreten Vorgang bei Bedarf nachvollziehen. | Geschlossener Detailsbereich, fachliche Ereignisse; ID nur im Detail. | Vorhandene Ereignisse, Zeiten, Request-/Handoff-IDs. | **Verstecken bis gebraucht.** Kein Datenfeed auf Home. | Verlauf widerspricht Hauptstatus nicht; technische Kennungen fehlen im Einstieg. |
| 23. Karte / Scan / Sperre | Vorhandene Dokumente auslösen und verlorenen Verweis sperren. | `Card settings` sekundär bei Sharing, Aktivzustand, Link, Sperraktion; Scan-Bestätigung. | Vorhanden: Kartenfreigabe, POST-Scan, Berechtigungen, Card-Status. Hardware offen. | **Behalten, zurückstufen.** Keine große Kartenillustration im Home, kein Shop. | GET mutiert nicht, unbekannte Karte ohne Patientenfallback; Sperre verhindert neue Scans; bestehende Nachweise bleiben. |
| 24. Dokumentbezogene Unterstützung | In vorhandenen Unterlagen die belegte Stelle oder den Übergabestand finden. | Kleine kontextbezogene Auswahl der drei unterstützten Fragen; belegte Antwort. | Vorhanden: lokaler deterministischer `/api/assistant` auf erlaubtem Snapshot. | **Vereinfachen.** Freitext-Chat streichen; kein externer LLM-Aufruf. | Quelle gehört zum erlaubten Bestand; keine Berechtigungsänderung; Quellzitat unverändert. |
| 25. Sprache / Navigation / Feedback | Ohne Rätsel den nächsten Schritt und Rückweg erkennen. | Englische Systemtexte, klare aktive Sidebar, sichtbarer Fokus, knappe Statusmeldung. | Lokal; keine Sprachpräferenz-Datenbank nötig. | **Querschnitt, Pflicht.** Keine zusätzliche Sprachumschaltung als Feature. | Desktop/Mobil/Tastatur; Quelltexte als Deutsch markiert; keine deutschen Systembuttons in Consumer-Pfaden. |
| 26. Fehler, Ablauf und Abmelden | Einen unterbrochenen Ablauf verstehen und Kontrolle behalten. | Englische Meldung + passende Aktion, Abmelden, neuer Demo-Lauf. | Vorhandene Auth-/API-Fehler; lokale Storage-Ausfälle getrennt. | **Querschnitt, Pflicht.** Kein endloses Retry derselben abgelaufenen ID. | Keine stale Antworten nach Personenwechsel; 410 stoppt Polling; Logout erhält keine private Anzeige. |

### Gestrichen oder ausdrücklich zurückgestellt

| Element | Bewertung / Grund | Backend-Bedarf bei späterer Aufnahme | Konsequenz jetzt |
|---|---|---|---|
| Daten-Dashboard, Dokumentzahlen, letzte Sync-Zeit, große Karte, Kontakt-Kacheln | Schwacher Einstiegsnutzen; lenken von Entscheidung und nächstem Schritt ab. | Keiner zusätzlich. | Vom Home entfernen; wichtige Details nur im Kontext. |
| Freier Allzweck-Agent | Unklarer Nutzen ohne verlässliche Quellen-/Aktionsgrenzen; die vorhandene Hilfe ist kein freies Sprachmodell. | Einwilligung zur Datenübermittlung, Modellintegration, Autorisierung, Evaluation, Kosten-/Fehlergrenzen. | Keine Chat-Hauptseite; lokale Hilfe. Die frühere externe Anbindung bleibt nicht implementiert. |
| Upload/OCR | Widerspricht dem gewünschten Template-first-Ablauf und erzeugt Extraktionsunsicherheit. | Dateiprüfung, private Speicherung, Auswertung, Herkunft, menschliche Kontrolle. | Keine Upload-Aktion. |
| Rechtlich vollständige Formularerzeugung und Signatur | Hoher späterer Nutzen, aber nicht durch wenige Planungsfragen erbracht. | Versionierte Feld-/Klauselmodelle, vollständiges Validierungs-/Exportverfahren, Freigabe-/Signaturvertrag; nicht nur ein Chatprompt. | Klare Entwurfsgrenze; kein `Legally complete` oder `Ready to share` für neue Planung. |
| Cloud-Speichern neuer Entwürfe, Gerätewechsel | Wertvoll nach bewiesenem Entwurfsablauf; bestehende API kann es nicht. | Draft-API/Tabellen, RLS, Eigentum/Delegation, Revisionen, Recovery und Übergang zu freigegebenem Dokument. | Nur Tab-Speicherung + Export; Login nicht als Speicherversprechen verkaufen. |
| Angehörigenkonten / stellvertretende Ausführung | Hilfe für andere ist relevant, reale Vertretungsrechte sind ein eigener Vertrag. | Einladungen, kontrollierte Grants, Widerruf, nachvollziehbare Zustimmung. | Planungsoption ohne Zugriff auf fremde Bestandsakten. |
| Marketplace, Notariatstermine, Zahlungsfunktionen, Gamification, Vorsorge-Score | Kein notwendiger Beitrag zum gegenwärtigen Kernablauf; unbelegte Nutzen-/Geschäftshypothese. | Mehrere neue Systeme. | Nicht bauen und nicht durch Platzhalter ankündigen. |
| Weitere Vitalanimationen / GIFs im Consumer-Home | Kein Nutzen für die konkrete Aufgabe. | Keiner. | Streichen. Bewegung nur als unmittelbares Interaktionsfeedback. |
| Klinischer Arbeitsplatz als Hauptnavigation | Endnutzer braucht ihn nicht zum Planen. | Bestehende separate KIS-Ansicht. | Nur expliziter Demo-Link; klinische Funktionen bleiben erhalten. |

## Abnahme und Teststrategie

Automatisierte Tests prüfen Verhalten, nicht Pixelpositionen oder eine erfundene Featureanzahl. Bestehende API-Tests für Rollen, Idempotenz, Revisionen und Kartenverlust bleiben bestehen.

| Prüfung | Nachweis / konkret vermiedener Fehler |
|---|---|
| Modell: Ziel -> Vorschlag | Ein Informationswunsch führt nicht still zu medizinischer Entscheidungsvollmacht; `unsure` selektiert nichts. |
| Modell: offene Pakete | Übersprungene/leere Antworten zählen nicht als vollständig; Export enthält Lücken. |
| Modell: Kontext und Revision | Personenwechsel entfernt frühere Personenangaben; Änderung invalidiert Review; abgewählte Dokumente verschwinden aus Export. |
| Modell: gespeicherte Eingaben | Unbekannte IDs, zu lange Inhalte, falsche Versionen und manipulierte Zustände sind begrenzt bzw. werden verworfen. |
| Browser: öffentlicher Weg | Ohne Auth vom Start zur gezielten Auswahl und zu einem editierbaren Entwurf; keine private API vorher. |
| Browser: Rückweg/Reload | Pakete wechseln, Antwort bearbeiten, reloaden, wieder aufnehmen; keine Datenverluste durch Sidebar. |
| Browser: anderer Mensch / Reset | Bestätigung nötig, Abbruch erhält Antworten, bestätigter Wechsel beseitigt personenbezogene Werte. |
| Browser: englische Consumer-UI | Einstieg, Formulare, Dialoge, Anmeldung, Scan und PDF-Bedienung englisch; Originalsprache bleibt explizit. |
| Browser: Übergabe-Regression | Zwei Browserkontexte prüfen Eingang -> klinische Fallzuordnung -> bestätigte Fassung und Rückfrage -> Antwort. |
| Visuell / Accessibility | 1440, 390 und 320 px; Sidebar erreichbar, Hauptaktion sichtbar, keine horizontale Überbreite; Fokus/Keyboard/Reduced Motion. |
| Echte Usability, noch offen | Drei unvorbereitete Personen sollen ohne Erklärung passenden Einstieg, nächste Aufgabe, offene Frage und Entwurfsgrenze benennen können. Beobachtete Stolperstellen dokumentieren, keine Erfolgsquote erfinden. |

Akzeptiert ist der sichtbare, testbare Planungsweg und die vereinfachte bestehende Dokumentübergabe. Nicht durch diese Abnahme bewiesen: rechtliche Vollständigkeit, medizinische Eignung, Cloud-Auth/RLS ohne eingerichtetes Projekt, physische NFC-Funktion, tatsächlich geringere Überforderung oder echte Klinikverfügbarkeit.

## Umsetzung und Review

Stand der Umsetzung vom 06.11.2026: Der öffentliche Planungsweg, die englische Sidebar und die vereinfachten Bestandsdokument-/Übergabeansichten sind implementiert. Neue Planung bleibt lokal und nutzt keinen neuen Backend-Vertrag. Die neue Anforderung ersetzt insbesondere das frühere `import-first` und den dokumentzentrierten Consumer-Start; historische Entscheidungen bleiben als solche erhalten.

Geprüft wurden Produktionsbuild einschließlich TypeScript und ESLint. Die 35 automatisierten Szenarien bestehen aus 20 vorhandenen Klinik-/Care-/API-Prüfungen, neun neuen Modelltests und sechs neuen Consumer-Browsertests. Im ersten Gesamtlauf bestanden 33/35; zwei neue Tests trafen zusätzlich auf den unsichtbaren Next.js-Routenankündiger statt ausschließlich auf die Formularmeldung. Nach Eingrenzung dieser Testselektoren wurden alle sechs Consumer-Browsertests erneut erfolgreich ausgeführt. Die anderen 29 Szenarien waren bereits grün. Es wird damit kein einzelner abschließender 35/35-Lauf behauptet.

Der Browsernachweis umfasst den tatsächlichen Textdownload mit eingegebenen Antworten, leere Pflichtfelder, explizit offene Aufgaben, Wiederaufnahme nach Reload, bestätigten/abgebrochenen Personenwechsel, Review-Invalidierung, sicheren Login-Rückweg, gesperrten Browserspeicher und die mobile Tastaturbedienung. Der öffentliche Weg löst dabei keine `/api/`-Anfrage aus.

Die unabhängige Codeprüfung fand drei Probleme, die vor Abnahme korrigiert wurden: Fokus sprang beim Auswählen einer Vorlage weg; native Pflichtfeldprüfung umging die englische Meldung; optionale Leerwerte wurden irreführend als offen bezeichnet. Zusätzlich wurde der globale Tastatur-Sprunglink sprachabhängig gemacht: Consumer Englisch, KIS Deutsch. Visuelle Prüfung von 30 Zuständen bei 1440, 390 und 320 px bestätigte erreichbare Navigation und Hauptaktionen ohne horizontale Überbreite; aufgezeichnete Browser-/Konsolenfehler: keine. Die Screenshots liegen als lokale, ignorierte Prüfarbeitsdateien unter `test-results/planning-visual/` und sind kein gepushter Bestandteil des Produkts.

Die abschließende Nachkontrolle bestätigte den vollständig lesbaren, scrollbar erreichbaren Hinweis im 320-px-Übergabedialog sowie je genau einen sprachlich passenden Sprunglink in Consumer und KIS. Tab/Enter setzt den Fokus jeweils auf den Hauptinhalt. Vier ergänzende Screenshots und die beiden Beobachtungsdateien `final-observations.json` und `kis-skip-observation.json` liegen im gleichen lokalen Prüfverzeichnis. Es bleiben keine bekannten Defekte aus diesem Review offen.

Offene nächste Nachweise: Nutzertest mit drei unvorbereiteten Personen (Produktteam); vollständiges, fachlich geprüftes Formular-/Signaturmodell und neuer Draft-Backend-Vertrag, wenn diese Ausbaustufe beauftragt wird; Supabase-Auth/RLS und physischer Kartentest im eingerichteten Zielsystem. Diese Grenzen werden durch die lokale Demo nicht als erledigt dargestellt. Zum Abschluss dieser UI-Iteration lag der Ausbau noch lokal vor; der Veröffentlichungsstand ist über die Git-Historie nachvollziehbar.

## Überarbeitung mit den lokalen UI-Skills

Auftrag: die vorhandenen Consumer-Features verbessern, ausdrücklich ohne Änderungen an KIS, gemeinsamem PDF-Viewer oder Backend. Eingesetzte Originale: `C:/Hackathon/Hackathon_repo/.agents/skills/{frontend-design-direction,design-system,frontend-patterns,frontend-a11y}/SKILL.md`; Herkunft laut dortiger README: ECC, Commit `b38be6a7f6350964d59328b52f0624e1d1d552d1`. Diese Skills sind im Haupt-Checkout vorhanden, nicht im Feature-Worktree oder auf den geprüften Upstream-Branches. Sie werden per Pfad gelesen und nicht als zusätzliche Kopien eingecheckt.

### Prüfbarer Gestaltungsauftrag

- **Oberfläche und Aufgabe:** `/vorsorge`, bestehende Dokument-/Sharing-Ansichten und die Consumer-Anmeldung. Nutzer sollen mit einer echten Auswahl beginnen, ihre Dokumentauswahl über Rückwege verstehen und eine offene Aufgabe gezielt fortsetzen können.
- **Primäre Aktion und Hierarchie:** zuerst „Who are you planning for?“, danach Anliegen und Vorlagen; kein zusätzlicher Start-Klick vor derselben Auswahl. Gewählte Vorlagen bleiben sichtbar, auch wenn sich das Anliegen ändert. Kleine Aufgaben und Review behalten eine klare nächste Aktion.
- **Ton und Wiedererkennung:** ruhige, persönliche Arbeitsfläche; die bestehende schmale Sidebar und der Aufgabenbaum bleiben. Pine für Aktionen, warme Hinweise für offene Punkte, zurückhaltende Informationsfarbe. Keine Marketingsektionen, dekorativen Animationen oder neue Markenwelt.
- **Lokale Referenz:** die geprüften Screenshots der ersten Iteration unter `test-results/planning-visual/`. Sie zeigen den zusätzlichen Startbildschirm, die zusammengeklappten Alternativvorlagen und die vorhandene mobile Sidebar. Der Code-/Browserreview bestätigte außerdem verlorenen Fokus nach Reset und Review sowie fehlende OTP-Fokusführung. Externe Referenzübermittlung ist dafür nicht nötig.
- **Zielgrößen:** `1440x960`, `390x844`, `320x740`; zusätzlich lange eigene Antworten, Tastatur, reduzierte Bewegung und lesbare Bedienelemente. Hauptaktionen und eigenständige interaktive Bedienelemente erhalten ausreichend große Ziele; keine horizontale Überbreite.
- **Grenzen:** vorhandene lokale Draft-Struktur, Quellen, Exportinhalt, API-Verträge und Auth-Berechtigungen bleiben erhalten. Keine neuen Dienste, Abhängigkeiten oder echten Gesundheitsdaten. Die Arbeit ersetzt weder Formularvollständigkeit noch echte Auth-/Hardwareabnahme.

### Feature-Änderungen und Abnahme

| Betroffene Features | Änderung und Nutzen | Backend | Nachweis |
|---|---|---|---|
| 1–2 Einstieg/Person | Erste Auswahl direkt auf der öffentlichen Seite; ein Schritt weniger, ohne Registrierung. | Keiner | Erster Bildschirm enthält beide Personenoptionen; keine private API-Anfrage. |
| 3–5 Vorlagen/Aufgaben | Gewählte Vorlagen bleiben beim Wechsel des Anliegens sichtbar; Auswahl- und Aufgabenanzahl aus tatsächlichem Zustand. | Keiner | Eine früher gewählte Vorlage bleibt sichtbar und abwählbar, auch wenn neue Vorschläge anders ausfallen. |
| 6–7 Bearbeitung | Pflicht-/optionale Angaben vor Eingabe erkennbar; veraltete Fehlermeldungen verschwinden bei Aufgabenwechsel. | Keiner | Validierung, Überspringen, Rückweg und Fokus auf erstes fehlerhaftes Feld. |
| 2, 10, 12 Kontext/Review/Reset | Passende Bestätigungsdialoge und klares Fokusziel nach einer Aktion. | Keiner | Abbrechen/Escape erhält Antworten; Tab bleibt im Dialog; Reset führt zum Einstieg, Review zum Download. |
| 13 Anmeldung | Nach E-Mail-Code-Anforderung direkt zum Codefeld; Prüfungsfehler dem Feld zugeordnet. | Vorhandener Auth-Vertrag | UI-Verhalten mit explizit simulierten Auth-Antworten; kein Nachweis realer Mailzustellung. |
| 8, 25 Hilfe und Bedienung | Kontextbezogene Hilfe und konsistente Fokus-/Touchzustände. | Keiner zusätzlich | Tastatur, Dialog-Rückkehr, lange Inhalte und drei Bildschirmgrößen. |

### Relevante Inhaltszustände

| Zustand | Auslöser und sichtbares Feedback | Sicherer nächster Schritt |
|---|---|---|
| Loading | Planungszustand wird aus dem Tab geladen; Anmeldung wartet auf Antwort. | Warten auf aktivierte Auswahl; keine zweite Anmeldung während einer Anfrage. |
| Empty | Noch kein Personenkontext, keine Ziele oder keine Vorlage gewählt. | Auswahl treffen; Weiter-Aktion erst mit notwendiger Auswahl verfügbar. |
| Error | Pflichtangabe fehlt, Speicher gesperrt oder Codeprüfung fehlgeschlagen. | Verbundenes Fehlerfeld korrigieren, Aufgabe offen lassen oder lokal weiterarbeiten und exportieren. |
| Partial | Einige Aufgaben beantwortet, andere offen. | Sichtbare offene Aufgabe gezielt öffnen; Teilentwurf als solchen prüfen. |
| Success | Aktuelle Entwurfsrevision geprüft beziehungsweise Download ausgelöst. | Fokus auf Download, danach bearbeitbarer Entwurf; keine Behauptung einer Rechtswirksamkeit. |
| Permission | Geschützte Dokumentansicht ohne Sitzung. | Zur Anmeldung mit internem Rückweg; öffentlicher Plan bleibt erreichbar. |

Status dieser zweiten Iteration: umgesetzt und funktional/visuell geprüft. Direkte Personenauswahl, dauerhaft sichtbare Vorlagenauswahl mit tatsächlicher Aufgabenanzahl, lokale Bestätigungsdialoge, eindeutige Pflicht-/optionale Angaben, bereinigte Fehlermeldungen und die OTP-Fokusführung sind implementiert. Der Entwurfs-/Backend-Vertrag bleibt unverändert.

### Tatsächliche Prüfung dieser Iteration

- `npm run build`: erfolgreich einschließlich TypeScript, nach den letzten CSS-Korrekturen.
- `npm run lint -- --ignore-pattern 'test-results/**'`: erfolgreich. Der unbeschränkte Lauf findet neun `require`-Importmeldungen in drei vorhandenen, ignorierten lokalen Screenshot-Hilfsskripten. Diese Prüfartefakte werden nicht ausgeliefert; Anwendungsdateien wurden nicht aus dem Lint entfernt.
- `playwright test tests/planning-ui.spec.ts tests/care-ui.spec.ts --output=test-results/consumer-skill-functional`: zehn Consumer-Szenarien bestanden; zwei bestehende Übergabeszenarien überschritten das gesamte 45-s-Zeitlimit bei langsamer Host-Ausführung. Bei einem erfolgte der Abbruch erst in `browserContext.close` nach den fachlichen Assertions.
- Gezielter Nachlauf nur der zwei Übergabetests mit `--timeout=120000`: beide bestanden (42,1 s und 30,9 s). Inhaltliche Assertions und deren Zeitlimits blieben unverändert; keine Behauptung eines Performance-Benchmarks.
- Alle zwölf Screenshots bei drei Zielgrößen und mit langen Antworten wurden unabhängig geprüft. Keine offenen Funktions-/Layoutbefunde. Live gemessen: kein horizontaler Überlauf bei 320 px, 44×44-px-Schrittaktionen, 46-px-Eingabefeld, 228×88-px-klickbare Auswahl, sichtbare Pflichtangaben und korrekte Fokusführung/Dialogsperre.
- Die korrigierten Textfarben erreichen 5,67:1 auf Weiß; Feldumrandungen 3,36:1, Hauptaktionen 6,61:1. Reduzierte Bewegung wurde geprüft. Dies ist keine vollständige Screenreader-/WCAG-Zertifizierung.
- 43 vorab erfasste KIS-, Backend-, Modell- und gemeinsam genutzte Dateien blieben per SHA256 unverändert. Während dieser UI-Iteration wurden keine neuen Abhängigkeiten eingeführt und kein Commit, Push oder Deployment ausgeführt.

Der lokale Nachweis nach `frontend-design-direction` liegt unter `test-results/consumer-skills/evidence.json`, die unabhängigen Browserbeobachtungen unter `independent-observations.json`. Diese ignorierten Artefakte enthalten synthetische UI-Belege. Die Auth-Fehler-/Ladezustände wurden ausdrücklich mit simulierten Antworten geprüft; echte Supabase-Konfiguration und Mailzustellung bleiben außerhalb dieses Nachweises.

### Design-System-Audit

Subjektive Bewertung des gerenderten Ergebnisses durch einen getrennten Reviewer (0–10), keine gemessene Usability oder wissenschaftliche Qualitätskennzahl:

| Dimension | Wert | Konkrete Beobachtung |
|---|---|---|
| Farbkonsistenz | 8 | Pine für Aktionen, Blau für Information, warme Farbe für offene Punkte; geprüfte Kontraste. |
| Typografie | 8 | Klare Frage-/Aufgaben-/Reviewhierarchie, tatsächlich gerendertes Geist; Metadaten auf Mobil klein. |
| Abstände | 8 | Einheitliche Formulare und Aktionsreihen; lange Inhalte scrollen auf Mobil. |
| Komponenten | 7 | Bedienelemente konsistent. Das bestehende Login-Schild und die Pflanzenmarke der Planung unterscheiden sich noch; kein Funktionsfehler und kein neuer Branding-Auftrag. |
| Responsive | 9 | Drei Einstiegsgrößen und langer 320-px-Review ohne horizontalen Überlauf. |
| Dark Mode | Nicht anwendbar | Diese Oberfläche ist ausdrücklich hell gestaltet; kein Dark-Mode-Feature versprochen. |
| Bewegung | 9 | Keine dekorative Animation, reduzierte Bewegung berücksichtigt. |
| Barrierefreiheit | 8 | Semantische Labels, ausreichende geprüfte Ziele, Dialog-Fokus und Fehlerbezüge; keine vollständige Screenreaderabnahme. |
| Informationsdichte | 9 | Direkter Ablauf, Details bei Bedarf, klare nächste Aktion. |
| Ausarbeitung | 8 | Eindeutige Zustände, Fokus zum Download, abbrechbare und nachvollziehbare Bestätigungen. |

Die Produkt-/Usabilityprüfung mit unvorbereiteten Personen bleibt der nächste Nachweis für das Produktteam. Der aktuelle Auftrag ist die lokale Überarbeitung der Consumer-Features; der KIS-Arbeitsplatz wurde nicht verändert.
