# Zweite UI: Vorsorge, die nachvollziehbar ankommt

## Aktueller Umsetzungsauftrag

Am 05.11.2026 hat Henri den reduzierten Plan zur Umsetzung freigegeben. Seine Präzisierung: Der Chip soll eine UI-Benachrichtigung auslösen; die Anwendung ruft zugehörige Vorsorgedokumente aus Supabase ab und macht sie im Kliniksystem sichtbar. Die angenommene Beschränkung des Chips auf „eine Funktion“ bleibt eine offene Hardwarefrage.

Persönliche Oberfläche, Anmeldung, Scan-Eingang, gemeinsame Übergabezustände und lokale quellenbasierte Hilfe sind implementiert. Produktionsbuild, Typecheck, Lint und alle 20 lokalen Browser-/API-Prüfungen sind bestanden; Cloud-Anbindung und physische Hardware bleiben unbestätigt. Voraussetzungen, Betriebsarten, Scan-Kompatibilitätsänderung und noch fehlende Cloud-/Hardwareprüfung stehen in [CARE-SETUP.md](CARE-SETUP.md). Der vorhandene Upstream-Scan aus Issue #32 wurde berücksichtigt; es wurde keine zweite inkompatible Kartenidentität erfunden.

Die optionale externe Modellanbindung wurde von der automatischen Freigabeprüfung wegen einer möglichen Datenübermittlung abgelehnt und ist nicht implementiert. Die lokale Hilfe arbeitet ohne externen Dienst.

## Historische Entscheidungsanalyse

Die folgende Analyse dokumentiert den vorausgehenden Planungsstand und seine Gegenargumente. Ihre damaligen Angaben „noch nicht gebaut“ und offenen Freigabefelder sind durch den obigen Bauauftrag überholt; sie werden als Entscheidungsgeschichte erhalten.


Stand: 05.11.2026. Status: **gechallengtes Konzept und Bauvorschlag, noch nicht als Umsetzung beschlossen**.
Grundlage: KIS-Demo auf `feat/notfallkarten-ui`, Commit `9ab8d59`; aktueller Auftrag ist eine klare Produkt-, UI-, Auth- und Kartenanalyse.
Diese Fassung verdichtet den vorherigen Erweiterungsentwurf. Die zweite UI, Auth, NFC und der Agent sind noch nicht gebaut.

## 1. Empfehlung und Herkunft der Entscheidung

**Zwei Kernfunktionen: Vorsorge verstehen und gezielt übergeben. Dazu ein begrenztes Assistenzexperiment.**

Die vorgeschlagene Positionierung lautet: **„Vorsorge, die ankommt: die richtige Dokumentfassung in der richtigen Patientenakte, mit nachvollziehbarem Status und dem Original als Beleg.“** Das ist eine zu prüfende Differenzierung, keine nachgewiesene Marktalleinstellung.

| Stimme | Tatsächlicher Input und Status |
|---|---|
| Input Henri | Wenige gute Funktionen statt einer breiten Sammlung; klar verkaufbarer Nutzen; zweite UI mit Auth; Verbindung von Karte und Handy prüfen; Unterstützung durch einen In-App-Agenten. Frühere Vorgaben: synthetische Daten, realistische KIS-Ansicht, verschiedene Vollmachten, relevante Angaben mit Originalbeleg. |
| Input Codex | Zwei durchgängige Kernfunktionen, drei Navigationsbereiche, verwaltete Auth und kleiner quellenbezogener Agent. Stärkster Einwand: Eine schöne Übergabebestätigung schafft keinen Nutzen, wenn die Klinik keinen verbindlichen Empfangs- und Zuordnungsprozess betreibt. |
| Input Claude | **Ausstehend.** Es liegt keine eigenständige Claude-Stellungnahme vor. Die drei unabhängigen Teilprüfungen dieses Durchlaufs sind Codex-Prüfungen, keine Claude-Stimmen. |

**Expliziter Widerspruch zum früheren Entwurf:** Fünf Hauptbereiche einschließlich Dokumentenerstellung, Beratungsmarkt und Partnerprozessen sind für den ersten Ausbau zu breit. Sie erhöhen Aufwand und Erklärungsbedarf, ohne den wichtigsten Nutzen zu beweisen. Auch eine verpflichtende Karte als pauschales Sicherheitsargument überzeugt technisch nicht: Ein kopierbarer Kartenlink ist kein Identitätsnachweis.

Akzeptiert ist der Analyseauftrag. Die folgenden Produkt- und Technikentscheidungen sind Empfehlungen, keine erfundenen Nutzerfreigaben. Die spätere Umsetzung bleibt ein eigener Schritt.

## 2. Was wir verkaufen können – und was noch zu belegen ist

Die kurze Primärquellenrecherche korrigiert mögliche Neuheitsbehauptungen:

- Afilio bietet bereits hinterlegte Vorsorgedokumente und eine Notfallkarte mit Abrufcode. Karte plus Dokumentablage allein ist daher keine belastbare Differenzierung. [Afilio](https://www.afilio.de/ratgeber/vorsorgedokumente-hinterlegen)
- MyDirectives beschreibt eine klinische Integration bei Ochsner in Epic; Ochsner führt das Angebot selbst als Ressource. Eine Integration von Vorsorge in klinische Systeme ist ebenfalls kein neues Prinzip. [MyDirectives](https://www.mydirectives.com/press-releases/ochsner-health-live-with-mydirectives-for-clinicians), [Ochsner](https://www.ochsnerhealthnetwork.org/resources)
- Dedalus beschreibt Patientenportale und die strukturierte Übernahme von Patientenformularen in ORBIS. Ein allgemeines Patientenportal wäre ein sehr breiter Wettbewerbseinstieg. [Dedalus-Whitepaper](https://www.dedalus.com/dach/wp-content/uploads/sites/24/2025/01/2025Dedalus_Whitepaper_FTB2_Patient-XCare-Suite-und-Care-Bridge.pdf)

Das sind konkrete Funktionsbelege, keine vollständige Wettbewerbsanalyse. Daraus folgt insbesondere nicht, dass Wettbewerber die unten vorgeschlagenen Details nicht besitzen.

| Verkaufsargument | Sichtbarer Beweis in unserer Demo | Aussagegrenze |
|---|---|---|
| **Ich weiß, welche Fassung angekommen ist.** | Dieselbe Dokument-ID und Fassung erscheinen nach bestätigter Übernahme in beiden Ansichten. | Empfang ist weder ärztliches Lesen noch medizinische Bewertung. |
| **Das Team findet Umfang und Einschränkungen schneller.** | Relevanter Hinweis führt zur exakten Passage, Seite und Fassung des Originals. | „Schneller“ bleibt eine Testhypothese, bis wir es vergleichen; die Zusammenfassung bestätigt keine rechtliche Wirksamkeit. |
| **Offene Übergaben bleiben sichtbar.** | Fehlende Zuordnung oder Rückfrage erzeugt einen konkreten nächsten Schritt. | Kein automatischer Anschluss an jede Klinik; nur vereinbarte Empfängerprozesse. |

Pitch für die aktuelle Entwicklungsstufe: **„Wir zeigen, wie vorhandene Vorsorge vom Handy in eine simulierte Krankenhausakte gelangt – mit Dokumentversion, Originalbelegen und Rückmeldung.“**

Zielbild für tatsächlich angeschlossene Einrichtungen: **„Du siehst, welche Fassung deiner Vorsorge in der Klinik angekommen ist und ob noch etwas fehlt.“**

**Nutzerhypothese:** Menschen mit bereits vorhandenen Vorsorgeunterlagen, zunächst vor einer geplanten Aufnahme; unterstützende Angehörige folgen mit gezieltem Zugang. Dies ist ein kontrollierbarer Einstieg, nicht die Aufgabe des ursprünglichen Notfallszenarios. Der klinische Kartenabruf wird als eigener Ablauf ausdrücklich mitgeführt.

**Käuferhypothese:** Zuerst ein Klinik- oder Vorsorgepartner mit wiederkehrenden Übergabeproblemen. Dessen Nutzen wären weniger Nachfragen, eindeutigere Fassungen und besser sichtbare offene Vorgänge. Integrationsaufwand und lange Beschaffung sind der stärkste Gegeneinwand. Ein B2C-Abo, Zahlungsbereitschaft und konkrete Einsparungen sind bislang unbelegt.

## 3. Zwei Kernfunktionen und eine gezielte Assistenz

| Priorität | Funktion | Erster prüfbarer Umfang |
|---|---|---|
| Kern A | **Vorsorge verstehen** | Vorbereitete synthetische Unterlagen übernehmen; Dokumentart, Fassung, Datum, benannte Person und dokumentierte Einschränkungen sehen; jede fachliche Kurzangabe öffnet ihre Originalstelle. Fehlende Informationen bleiben als fehlend erkennbar. |
| Kern B | **Gezielt übergeben und Abschluss nachvollziehen** | Person, Empfänger und Fassungen auswählen; ausdrücklich freigeben; klinisch zuordnen und bestätigen; Rückmeldung auf dem Handy sehen; eine Rückfrage bearbeiten. |
| Experiment C | **Kontextbezogene Unterstützung** | Drei Einstiege: „Wo steht das?“, „Was fehlt noch?“ und „Welche Fassung ist angekommen?“. Antworten beziehen sich auf erlaubte Dokumente beziehungsweise tatsächliche Vorgangsdaten. |

Import-first bedeutet für den ersten Beweis vorbereitete synthetische Dateien mit geprüften Belegstellen. Beliebige PDF-Uploads, OCR und automatische Extraktion sind eine gesonderte Erweiterung. Falls schon ein Upload angeboten wird, ist ein nicht ausgewertetes Dokument als solches sichtbar; es entstehen keine erfundenen Kurzangaben.

**Später:** vollständiger Dokumentgenerator, Beratungs-/Terminmarktplatz, Partnerarbeitsplatz, umfangreiche Angehörigenverwaltung, Notariatsabläufe, native App und viele Klinikadapter. Dokumentierte benannte Personen bleiben schon jetzt sichtbar; daraus folgt kein automatisch erteilter App-Zugang.

### Die UI konkret

Drei Hauptbereiche reichen: **Übersicht · Dokumente · Übergaben**. Konto, Zugänge und Karte liegen in den Einstellungen; Hilfe öffnet sich an der jeweiligen Aufgabe.

- **Übersicht:** sichtbare Person, eine nächste Aufgabe, Dokumentstand und letzte Rückmeldung. Beispiel: „Klinikum Nord: Fassung 2 noch nicht zugeordnet.“ Keine pauschale Ampel „Vorsorge gültig“.
- **Dokumentdetail:** Original und verständliche belegte Angaben nebeneinander beziehungsweise mobil untereinander. Titel, Version, Datum, benannte Person, Umfang, Bedingungen und Herkunft sind erreichbar.
- **Übergabe:** eine überschaubare Vorschau mit Person, Empfänger und Dokumentfassungen; danach Verlauf mit tatsächlicher Bestätigungsquelle. Eine offene Zuordnung bleibt offen.
- **Assistenz:** kleines kontextbezogenes Panel mit drei Startfragen und klickbaren Quellen. Kein leeres Chatfenster als erste Hauptaufgabe.
- **KIS:** bleibt dicht und klinisch. Neue Inhalte erscheinen in der richtigen Akte, mit Versionshinweis und belegtem Geltungsbereich. Ein zusätzlicher Karten-Shop oder allgemeiner KI-Bereich verbessert diesen Arbeitsablauf nicht.

Die bestehende Belegnavigation ist eine gute wiederverwendbare Grundlage. Ihre Zuordnungsprüfung ist bisher allerdings eine Datenkonsistenzprüfung innerhalb einer öffentlichen Demo, keine Berechtigungsprüfung.

Farbe hat eine feste Bedeutung: Petrol/Blau für Navigation und Auswahl, Grün ausschließlich für einen belegten Abschluss, Bernstein für Klärungsbedarf, Rot für Fehler. Text und Symbole tragen dieselbe Information. Kurze Bewegung darf einen echten Zustandswechsel begleiten. Klinische Pulsanimationen bleiben als synthetische Darstellung erkennbar; zusätzliche Vitalanimationen in der persönlichen Vorsorgeansicht erklären keinen Produktnutzen. Tastatur, schmale Ansichten und reduzierte Bewegung gehören zur Abnahme.

Diese Bewertung beruht auf Repository, vorhandenem Produktkontext und gezielter Recherche. Sie ersetzt weder einen neuen visuellen Browserdurchlauf noch beobachtete Nutzertests.

## 4. Auth-Ebene: sichtbare Anmeldung und tatsächlicher Datenzugriff

**Empfehlung: Supabase Auth mit E-Mail-Code, Next.js-Serverprüfung, Postgres-RLS und privatem Dateispeicher.** Supabase ist bereits als Bibliothek vorhanden. Ob Projekt, Policies und Mailversand tatsächlich eingerichtet sind, wurde nicht geprüft.

Die aktuelle SSR-Anleitung beschreibt getrennte Browser-/Serverclients, Cookies und Token-Erneuerung über einen Proxy. Ein vom Client gelieferter Rollenwert oder das unvalidierte Benutzerobjekt einer Sitzung genügt nicht als Berechtigungsnachweis. [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs)

### Vorgeschlagene Seiten und Zustände

| Ansicht | Nutzeraufgabe | Erforderliches Verhalten |
|---|---|---|
| Anmeldung | E-Mail eingeben | Verständliche Rückmeldung; keine öffentliche Liste existierender Konten |
| Code bestätigen | Code eingeben, erneut senden | Ablauf, Fehlversuch und Wartezeit verständlich; Rückkehr zum vorherigen Karten-/Dokumentvorgang |
| Persönliche Ansicht | Erlaubte eigene Unterlagen sehen | Berechtigung wird serverseitig geprüft; ein fremder Link eröffnet keinen Zugriff |
| Klinik-Demozugang | Als vorab eingerichteter Empfänger arbeiten | Keine Selbstvergabe von Klinikrechten durch eine Rollenwahl |
| Sitzung beendet / kein Zugriff | Wieder anmelden oder zurückgehen | Keine Vorschau privater Namen/PDFs; nachvollziehbarer Ausweg |
| Konto und Karte | Abmelden, Kartenverweis sperren | Sitzungsende und Sperrung wirken auf neue geschützte Anfragen |

Die Produktrollen sind: Kontoinhaber und vorab eingerichteter klinischer Empfänger. Einladungen für unterstützende Personen folgen später. Schon jetzt bleiben **Anmeldung, App-Zugriff und im Dokument genannte Befugnis** getrennte Angaben. Ein Konto bestätigt weder amtliche Identität noch automatisch eine Vertretungsbefugnis.

E-Mail-OTP ist die bevorzugte mobile Variante; dieselbe Supabase-Methode verschickt ohne passende Mailvorlage standardmäßig einen Magic Link. Der integrierte Maildienst ist für externe Tester ungeeignet: derzeit Team-Adressen, zwei Nachrichten pro Stunde und keine Zustellgarantie. Für echte Testanmeldungen ist Custom SMTP nötig. Bühnenfallback: vorab eingerichtete synthetische Demokonten mit regulärer Passwortanmeldung, nicht ein Login-Bypass. [Passwordless](https://supabase.com/docs/guides/auth/auth-email-passwordless), [SMTP](https://supabase.com/docs/guides/auth/auth-smtp)

Clerk ist eine Alternative für fertige Anmeldekomponenten, würde aber einen weiteren Anbieter hinzufügen und die fachliche Autorisierung nicht ersetzen. Deshalb für diesen Stand kein bevorzugter Wechsel. [Clerk Next.js](https://clerk.com/docs/nextjs/getting-started/quickstart)

### Was im Repository dafür fehlt

| Beobachtung am aktuellen Stand | Konsequenz |
|---|---|
| `app/page.tsx` reicht Patienten-/Dokument-/Beleg-IDs aus URLs weiter; keine Auth-Routen oder Session-Schicht vorhanden | Direkte URLs brauchen dieselbe Zugriffsprüfung wie Klicks |
| `components/KisWorkspace.tsx` importiert den vollständigen synthetischen Patientenbestand in den Client | Private Daten künftig serverseitig nach erlaubtem Personenkontext auswählen |
| PDF-Viewer und Download nutzen öffentliche Datei-URLs | Private Dateien separat schützen; Login um eine Seite genügt nicht |
| `lib/documents.ts` verwendet `getPublicUrl`; der ältere Adapter hat derzeit keinen aktiven Aufrufer in den UI-Routen | Kein Nachweis eines bereits geschützten Dokumentdienstes |
| Tests prüfen bisher öffentliche synthetische PDFs und Zuordnung | Neue Prüfungen für fremde Konten, direkte URLs, Sitzungsende und entzogene Freigaben nötig |

Dies ist **kein festgestellter Datenvorfall**: Der aktuelle Bestand ist bewusst synthetisch. Öffentliche Demoartefakte und Vorlagen dürfen als solche öffentlich bleiben; private Inhalte und die Zustandsänderungen der neuen authentifizierten Übergabe erhalten einen getrennten Zugriffspfad.

RLS regelt die erlaubten Datensätze; private Buckets schützen Dateien. Für strikten Entzug bei jedem neuen Abruf ist ein authentifizierter Dokumentendpunkt mit erneuter Prüfung vorzuziehen. Bereits ausgegebene signierte URLs bleiben grundsätzlich bis zu ihrem Ablauf verwendbar; vorhandene Downloads lassen sich nicht zurückholen. [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Storage-Grundlagen](https://supabase.com/docs/guides/storage/buckets/fundamentals), [Signierte Downloads](https://supabase.com/docs/guides/storage/serving/downloads)

## 5. Karte und Handy – einschließlich des ursprünglichen Notfallszenarios

**Empfehlung für das Experiment:** beschreibbarer NFC-Tag mit NDEF-HTTPS-Link plus aufgedrucktem QR-Code. Das Telefon öffnet einen normalen Weblink. Eine native App und JavaScript-Web-NFC sind dafür nicht erforderlich.

Apple dokumentiert Hintergrundlesen ab iPhone XS mit Systemhinweis und anschließendem Öffnen des Links. Android verarbeitet NFC-Weblinks auf Betriebssystemebene. Chrome-Web-NFC ist dagegen eine Android-Funktion mit eigenen Berechtigungen und keine gemeinsame iPhone-/Android-Grundlage. Konkrete Geräte und Tags müssen physisch getestet werden. [Apple](https://developer.apple.com/documentation/corenfc/adding-support-for-background-tag-reading), [Android](https://developer.android.com/develop/connectivity/nfc/nfc), [Chrome](https://developer.chrome.com/docs/capabilities/nfc)

**Wichtige Änderung gegenüber einer möglichen ursprünglichen Interpretation:** Dieser Vorschlag speichert einen Verweis auf der Karte, nicht die vollständigen PDFs. Er braucht eine erreichbare Plattform und liefert keinen Offline-Dokumentenspeicher. Falls „Dokumente auf der Karte“ wörtlich erforderlich ist, ändern sich Hardware, Speicherkapazität, Schlüsselverwaltung und Ablauf. Diese Entscheidung ist offen und wird nicht stillschweigend umgedeutet.

| Ablauf | Konkreter Vorschlag | Grenze |
|---|---|---|
| Eigene Karte am eigenen Handy | Antippen → HTTPS-Seite → Anmeldung → berechtigter persönlicher Bestand → Übergabe auswählen | Karte allein gibt keinen Zugriff |
| Karte bei einer geplanten Aufnahme | Patient gibt ein definiertes Paket frei; vorab eingerichteter Kliniknutzer erhält es und ordnet es dem Fall zu | Nur definierte Empfänger, nicht beliebige Kliniken |
| Karte bei nicht ansprechbarer Person | In der Demo separater bereits autorisierter Klinikzugang mit vorab eingerichteter synthetischer Freigabe; konkreter Fallbezug und Abrufprotokoll | Keine neue Patienteneinwilligung im Notfall erfinden; produktive Zugangsgrundlage und institutionelle Prüfung sind noch zu klären |
| Handy/Karte fehlt oder NFC geht nicht | Konto direkt öffnen beziehungsweise denselben Link als QR scannen | Kein Offline-Versprechen |
| Karte verloren | Kartenverweis deaktivieren und Ersatzverweis erzeugen | Sperrt neue Nutzung dieses Verweises, löscht keine bereits übernommenen Dokumente |

Die Karte trägt eine zufällige öffentliche Kennung, zum Beispiel `/karte/<opaque-id>`. Vor Zugriffskontrolle zeigt diese Route keine Patientendaten. Der Verweis ist **kein dauerhaft gültiger Zugangsschlüssel**: Er kann kopiert werden. Kartenzuordnung benötigt bereits berechtigten Zugang; „erster Scan gewinnt“ ist ausgeschlossen.

Kartenkennung, Person, Dokumentfreigabe und Übergabevorgang sind getrennte Objekte. Ein gegebenenfalls kurzlebiger Übergabecode ersetzt nicht die serverseitige Empfängerprüfung. Eine Sperrung darf auch nicht durch einen zuvor geöffneten noch unberechtigten Browserzustand umgangen werden.

## 6. Der In-App-Agent: belegte Hilfe statt zusätzlicher Produktoberfläche

**Nutzen:** Die Person versteht, was hinterlegt wurde, welche Stelle eine Kurzangabe belegt und welcher organisatorische Schritt noch fehlt. Klinische Entscheidungen, rechtsverbindliche Bewertungen und automatische Vertretung sind kein Agentenauftrag.

Drei kleine serverseitige Werkzeuge reichen als Vorschlag:

| Werkzeug | Eingabe und Ergebnis | Berechtigung / Nebenwirkung |
|---|---|---|
| `read_care_status` | Erlaubter Personenkontext; liefert Fassungen, fehlende Angaben und Übergabestand | Sitzung und Personenbezug aus kontrolliertem Serverkontext; nur lesen |
| `find_document_evidence` | Frage plus erlaubte Dokumentauswahl; liefert Version, Seite, exakten Text und interne Beleg-ID | Nur erlaubte Dokumente; zitierte Passage muss tatsächlich existieren |
| `prepare_handoff` | Gewünschter Empfänger und Fassungen; liefert eine prüfbare Vorschau | Kein Versand, keine neue Berechtigung; nach Nutzerbestätigung führt eine normale Serveraktion den erneut geprüften Vorgang aus |

Die tatsächliche Karten-/PDF-Navigation erfolgt über die bestehende App. Der Agent besitzt keine Sonderrechte, darf keine klinische Rolle vergeben und keine Übergabe als erfolgreich melden, die nicht im Vorgangsdienst bestätigt ist.

Beispiel einer sinnvollen Antwort: „In der hinterlegten Fassung wird Jana Berger für diesen Bereich genannt. Die Einschränkung steht auf Seite 2.“ Daneben stehen die exakte Quelle und „Original öffnen“. Ohne Beleg lautet die Antwort entsprechend „Dazu finde ich in den freigegebenen Unterlagen keine eindeutige Angabe.“

**Technischer Vorschlag für das Experiment:** ein serverseitiger Aufruf über die OpenAI Responses API mit wenigen schemafesten Function Tools. Die Anwendung führt die Werkzeuge aus; Modellvorschläge sind keine Zugriffsentscheidung. Ein zusätzliches Agentenframework oder eine Vektordatenbank ist für die kleinen vorbereiteten Dokumentbestände nicht begründet. Provider und Modell bleiben austauschbar. [OpenAI Function Calling](https://developers.openai.com/api/docs/guides/function-calling)

PDF-Inhalte werden als Daten behandelt, auch wenn sie Anweisungen enthalten. Werkzeugparameter und Befugnisse werden außerhalb des Modells geprüft; externe Übermittlung erfolgt erst nach ausdrücklicher Nutzeraktion. Nur benötigte synthetische Auszüge gehen in den Demo-Modellaufruf, keine vollständige Stationsliste. Antworten und Quellen werden validiert, Geheimnisse bleiben serverseitig, Protokolle vermeiden Dokumentvolltexte. Bei Fehler oder Zeitlimit bleiben normale Bedienelemente nutzbar. [OWASP Prompt Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html)

Der Agent wird gegen die einfachere Variante aus festen Hilfetexten und nächsten Schritten verglichen. Bietet er keinen erkennbaren Vorteil bei Verständnis oder Abschluss, bleibt die einfache Variante. Es gibt kein sinnvolles Verkaufsversprechen „KI ist dabei“ ohne diesen Nutzennachweis.

## 7. Stack, Zuständigkeiten und gemeinsame Zustandsquelle

| Baustein | Ziel und vorgeschlagener Besitzer | Lebenszyklus / Nachweis | Einfachere Alternative |
|---|---|---|---|
| Bestehendes Next.js, React, TypeScript | Zwei Oberflächen im selben Repo; getrennte Navigation und begrenzte Styles | Bestehender KIS-Bereich bleibt nutzbar; Consumer-Bereich etwa `/vorsorge` | Kein zweites Repository oder zweites Frontendframework |
| Supabase Auth + `@supabase/ssr` | Serverseitiger Zugriffsbereich besitzt Sitzungen und kontrollierte Mitgliedschaften | Login, Ablauf, Logout, Rechteentzug; direkte Fremdzugriffe werden abgewiesen | Vorab angelegte Demoidentitäten statt kompletter Einladungsverwaltung |
| Postgres + private Storage | Dokument-/Übergabedienst besitzt Versionen, Freigaben und Bestätigungen | Ein gemeinsamer Zustand für Handy und Klinik; Historie bleibt erhalten | Vorbereitete Dateien statt beliebiger Upload-/OCR-Pipeline |
| Vorhandener PDF-Viewer | Dokumentdienst liefert zulässige Datei und Belegmetadaten | Quelle gehört zur selben Person und Fassung | Vorhandene Komponente weiterverwenden |
| NFC-/QR-Kartenverweis | Kartenservice im selben Serverbereich besitzt Zuordnung und Sperrstatus | Aktivieren, sperren, ersetzen; physischer Scanversuch und Sperrtest | QR und direkter Kontoaufruf |
| Assistenz-Endpunkt | App-Server besitzt Tool-Freigabe und begrenzten Modellaufruf | Sitzungsgebundener Kontext, geprüfte Quellen, Timeout und abschaltbares Experiment | Geführte Hilfen ohne Modell |
| Bestehendes Playwright | Anwendungstests belegen UI- und Zugriffsverhalten | Zwei angemeldete Kontexte, Fremdzugriffe und Fehlerszenarien | Kein weiteres Testframework |

„Besitzer“ bezeichnet hier die geplante fachliche Code-Zuständigkeit, nicht einen bereits gebauten neuen Dienst. Diese Bausteine können im selben Next.js-Projekt leben. Neue Accounts, kostenpflichtige Dienste und externe Anschlüsse werden durch dieses Konzept nicht eingerichtet.

Das gemeinsame Modell braucht mindestens: Person, kontrollierten Zugang, Dokumentversion, Belegstelle, Kartenverweis, Empfänger, Freigabe, Übergabe und Bestätigungsereignis. Der bestehende synthetische Datenbestand liefert IDs und Quellen, wird aber nicht als kompletter privater Clientbestand wiederverwendet.

Status eines Übergabevorgangs:

**Vorbereitet → freigegeben → technisch empfangen → zugeordnet → in der Akte bestätigt.**

Klärungsbedarf und fehlgeschlagene Übermittlung sind ausdrückliche Abzweige. Eine Animation, ein PDF-Abruf oder ein Kartenkontakt erzeugt keine Aktenbestätigung. Der bestätigte Zustand erfordert persistierte Zuordnung der konkreten Fassung und die passende Rückmeldung des Demo-Empfängers.

Die Bestätigung enthält Person/Fall, Empfänger, Dokument-ID/Fassung, Vorgangskennung, Zeitpunkt und bestätigende Quelle. Wiederholungen sind idempotent. Neue Fassungen überschreiben weder die alte Aktenfassung noch frühere Bestätigungen. Widerruf einer App-Freigabe und Änderung eines bereits übergebenen Dokuments sind unterschiedliche Vorgänge.

## 8. Vorführablauf und Abnahme für einen späteren Bauauftrag

**Hauptdemo, vorgeschlagen:**

1. Handy: Erika Berger öffnet ihre Karte per NFC oder QR und meldet sich an.
2. Sie sieht die neue synthetische Fassung 2; die Klinik kennt bislang Fassung 1.
3. „Wo steht, wer genannt ist?“ öffnet eine konkrete Originalpassage mit Einschränkung.
4. Erika prüft Person, Klinikum Nord und Dokumentauswahl und gibt Fassung 2 frei.
5. Zweites Fenster: Ein bereits berechtigter Kliniknutzer sieht den Eingang, ordnet ihn dem passenden Fall zu und bestätigt die Übernahme.
6. Handy: Die echte Änderung im gemeinsamen Demozustand erscheint als Bestätigung derselben Fassung; die KIS-Ansicht öffnet das zugehörige PDF.
7. Zweiter Versuch: Unklare Zuordnung erzeugt eine Rückfrage und bleibt offen.

**Zusätzlicher Kartenbeweis:** Ein vorab berechtigter Kliniknutzer kann das synthetisch freigegebene Paket ohne Patientenlogin am Klinikgerät finden. Ein unberechtigtes Konto erhält mit derselben Karte keine Daten. So geht der ursprüngliche Notfallgedanke im Consumer-Einstieg nicht verloren.

| Prüfung | Erwartetes beobachtbares Ergebnis |
|---|---|
| Richtige Person und Fassung | Beide Oberflächen zeigen nach Bestätigung dasselbe Dokument im richtigen Fall; Fassung 1 bleibt historisch nachvollziehbar |
| Fehlende / falsche Zuordnung | Keine automatische Übernahme in einen anderen Fall, keine grüne Abschlussanzeige |
| Wiederholung / Seitenneuladen | Kein Doppelimport; Zustand bleibt aus gemeinsamer Quelle nachvollziehbar |
| Auth und Dateien | Anonymer Aufruf, fremde IDs, manipulierte Rolle und direkte private PDF-URL geben keine fremden Inhalte aus |
| Karten-/Freigabesperre | Neue Abrufe über den gesperrten Verweis beziehungsweise entzogenen Zugang scheitern; Grenzen bereits heruntergeladener Dateien sind verständlich |
| Telefon | NFC und QR auf den tatsächlichen Vorführgeräten getestet; kein Browser-Web-NFC vorausgesetzt |
| Assistenz | Quellen stimmen mit Person/Fassung/Text überein; fehlende Belege und unzulässige Aktionen werden erkannt; Dokumentanweisungen erweitern keine Rechte |
| Ausfälle | Mail-, Modell- oder Zuordnungsfehler haben einen bedienbaren nächsten Schritt |
| UI | Tastatur, Mobilansicht, Fokus und reduzierte Bewegung funktionieren |
| Demoaussage | Alle Personen/Unterlagen synthetisch; klinische Integration als simuliert ausgewiesen; Empfang wird nicht als ärztliche Bewertung verkauft |

Für die Produktprüfung zunächst wenige beobachtete Durchläufe mit Vorsorgenden/Angehörigen und klinischen Mitarbeitenden: Können sie Fassung und Empfänger erkennen, die Bestätigung richtig erklären und den nächsten Schritt ohne Hilfe finden? Agent und feste Hilfe werden an denselben Aufgaben verglichen. Gemessene Bearbeitungszeit, Fehler und Rückfragen sind Ergebnisse des Tests, keine vorab behauptete Zeitersparnis. Kein Fremdzugriff, keine falsche Patientenzuordnung und keine erfundene Bestätigung sind notwendige technische Kriterien.

## 9. Entscheidungsprüfung

Alle Urteile sind **Codex-Empfehlungen**, noch keine Annahme durch Henri.

| Entscheidung / Urteil | Warum jetzt | Stärkster Einwand | Einfachere Alternative | Welche Evidenz das Urteil ändert |
|---|---|---|---|---|
| Zwei Kernfunktionen statt Vorsorgeplattform – **Ja** | Macht Nutzen und Demo verständlich | Erstellung könnte der eigentliche Einstieg sein | Vorhandene Unterlagen und eine Übergabe | Interviews zeigen, dass ohne Erstellung kein relevanter Nutzerfall entsteht |
| Übergabe mit bestätigtem Abschluss – **Experiment**, höchste Priorität | Beweist mehr als Dokumentablage | Klinikprozess und Rückkanal sind schwer zu etablieren | Ein Empfänger, manuelle Bestätigung | Pilotpartner braucht den Rückkanal nicht oder vorhandenes Portal löst den Bedarf |
| Vollständiger Generator/Marktplatz – **Spaeter** | Vermeidet mehrere Produkte zugleich | Früher Kundenzugang könnte über Beratung laufen | Auf vorhandene Unterlagen aufbauen | Ein konkreter Partnerprozess braucht zwingend Erstellung/Beratung |
| Supabase-Auth und private Daten – **Ja** | Vorhandener Stack, notwendige Zugriffsgrenze | Projekt/SMTP/Policies brauchen echte Einrichtung | Vorgefertigte Demoidentitäten | Vorhandene institutionelle Identität oder konkrete Hostinganforderung passt nicht |
| Zweiter Authanbieter / eigener JWT-Unterbau – **Nein** für diesen Stand | Kein zusätzlicher Produktnutzen nachgewiesen | Fertige Clerk-Oberfläche kann schneller sein | Supabase-Anmeldeformular | Nachweislich geringerer Gesamtaufwand einschließlich Datenregeln |
| NFC-Weblink plus QR – **Experiment** | Einfache Verbindung mit dem Handy | Kein Offlinezugriff, Karte kopierbar | QR allein | Reale Hardware oder zwingender Offlinebedarf verlangt anderes Protokoll |
| Karte als alleinige Zugangsberechtigung – **Nein** | Unberechtigte Scans dürfen keine Dokumente öffnen | Zusätzliche Anmeldung kann den Notfallzugriff behindern | Vorab berechtigter Klinikempfänger | Ein konkret geprüfter institutioneller Zugangsprozess begründet andere Regeln |
| Quellenbezogener Agent – **Experiment** | Kann Erklärungs- und Suchaufwand senken | Kann verwirren oder unbelegte Antworten liefern | Feste kontextbezogene Hilfen | Vergleichstest zeigt klaren Vorteil oder keinen Nutzen |
| Produktiven Notfallzugriff versprechen – **Nein** zum jetzigen Stand | Authentifizierte Demo beweist keinen institutionellen Anschluss | Notfall ist Kern des Produktimpulses | Separater synthetischer Ablauf mit vorausgesetzter Freigabe | Verantwortlicher Pilotpartner, geprüfte Zugangsgrundlage und tatsächlicher Anschluss liegen vor |

## 10. Einordnung des früheren Anforderungskatalogs

Die historischen IDs 2.1–2.18 bleiben erhalten. Ihre folgende Priorisierung ersetzt die frühere Annahme, alle Punkte im ersten Ausbau umzusetzen. Quellen und Nutzerbeiträge im Originalgespräch bleiben unverändert.

| ID | Bisheriger Gegenstand | Neuer Vorschlag |
|---|---|---|
| 2.1 | Eigene Person / Unterstützung unterscheiden | Eigene Person jetzt; Mehrpersonenbedienung später, Rollenbegriff getrennt halten |
| 2.2 | Aufgabenorientierter Einstieg | Kern A/B |
| 2.3 | Erstellung und Import | Vorbereitete Dokumentübernahme jetzt; vollständige Erstellung später |
| 2.4 | Dokumentart und Fassung | Kern A/B |
| 2.5 | Entwurf, Rückfrage und bereitgestellte Fassung | Kern A; keine erfundenen Unterschriften oder Gültigkeitsangaben |
| 2.6 | Unterstützung an einem konkreten Vorgang | Kleine Assistenz als Experiment; Fachberatung später |
| 2.7 | Fachpartnerprozess | Später |
| 2.8 | Vertrauenspersonen und getrennte Rollen | Benannte Personen jetzt; Einladungsverwaltung später |
| 2.9 | Helfer ersetzt keine persönliche Erklärung | Bleibende Grenze, auch ohne Helferfunktion |
| 2.10 | Karte und App zum selben Bestand | Kern B plus NFC-/QR-Experiment; Kartenpflicht offen |
| 2.11 | Empfänger, Person/Fall, Fassung vor Übergabe | Kern B |
| 2.12 | Abruf, Annahme, Zuordnung, Aktenbestätigung | Kern B |
| 2.13 | Bestätigung an echte Demo-Zustandsänderung binden | Kern B |
| 2.14 | Fehler, Rückfragen, unbekannte Empfänger | Kern B |
| 2.15 | Änderungen und alte Fassungen | Kern A/B |
| 2.16 | Klinische Kurzangaben mit Dokument verbinden | Kern A/B, bestehende Belegnavigation nutzen |
| 2.17 | Synthetische Daten und simulierte Außenwirkung | Bleibende Demoanforderung |
| 2.18 | Tastatur, Mobilansicht, reduzierte Bewegung | Bleibende UI-Anforderung |

## 11. Offene Antworten und Entscheidungsstand

| Offener Punkt | Arbeitsannahme für den Vorschlag | Editierbare Antwort |
|---|---|---|
| Mit „hier alle Infos zu Auth“ gemeinte Quelle | In den aktuellen Anhängen liegt keine neue Auth-Anleitung vor; offizielle technische Dokumentation wurde recherchiert | **Antwort:** … |
| Kartenhardware und Vorführhandy | NDEF-fähiger Tag; iPhone und Android berücksichtigen; QR-Fallback | **Antwort:** … |
| Verweis oder Dokumente physisch auf der Karte? | Online-Verweis als Experiment, kein Offlineversprechen | **Antwort:** … |
| Physische Karte verpflichtend? | Konto bleibt auch ohne Karte erreichbar; Pflichtmodell nicht entschieden | **Antwort:** … |
| Erster Pilot / Käufer / Empfänger | Eine fiktiv angeschlossene Klinik in der Demo; realer Pilot noch offen | **Antwort:** … |
| Auth-Projekt und Mailanbieter | Bestehendes Supabase-Projekt zuerst prüfen; kein neuer Anbieter eingerichtet | **Antwort:** … |
| Visuelle Referenz „DrLip“ | Wörtlicher Nutzerbegriff erhalten; Deutung als Doctolib ist unbestätigt | **Antwort:** … |
| Zustimmung zum reduzierten Bauumfang | Noch nicht erteilt; dieser Durchlauf liefert die Entscheidungsgrundlage | **Entscheidung:** … |

**Entscheidungsledger:**

- **Akzeptiert / beauftragt:** kritische Analyse, klare Nutzenargumente, wenige Funktionen, Auth-/Handy-/Agentenkonzept; bestehende KIS-Demo als Kontext; Ablage der Erweiterung unter `docs`.
- **Empfohlen, nicht angenommen:** Kern A/B, drei Navigationsbereiche, gemeinsame Zustandsquelle, Supabase-Zugriffsschicht.
- **Zur Ablehnung empfohlen:** Karte als pauschaler Berechtigungsnachweis, eigener Auth-Unterbau, unbewiesene Alleinstellungs-/Integrations-/Gültigkeitsversprechen.
- **Zurückstellung empfohlen:** Generator, Marktplatz, Partnerarbeitsplatz, große Angehörigenverwaltung, native App.
- **Experimente empfohlen, noch nicht ausgeführt:** bestätigte Übergabe in die KIS-Demo, NFC-/QR-Handyablauf, begrenzte Assistenz.
- **Offen:** obige Antworten und Annahme des Bauumfangs. Input Claude bleibt ausstehend; er wird nicht durch Codex-Konsens ersetzt.

**Ausführungskonsequenz:** Dokumentations- und Analyseauftrag erfüllt; kein UI-/Auth-Code, Konto, externer Anschluss oder Agent wurde in diesem Schritt angelegt. Nächster sinnvoller Bauumfang nach Entscheidung: zuerst Auth und gemeinsamer Übergabeprozess mit zwei Ansichten, dann Kartenanbindung und das begrenzte Assistenzexperiment.

## 12. Quellen und Erhalt des ursprünglichen Kontexts

- [CONSUMER-UI-KONTEXT.txt](CONSUMER-UI-KONTEXT.txt): unverändertes Originalgespräch, 371 Zeilen. Ursprungsdatei `pasted-text-371-lines.txt`, Kepler-Anhang `file:040390ec-1e72-4145-92b4-de8802ad8535`.
- SHA-256 des Originals: `9cf3f752db52c84e6700f1ab841e9c80c0fa10f013c0437eabd9ab07bcaa94cd`.
- Z. 172–180: erkennbare Nutzerwünsche zur einfachen Consumer-UI, Erstellung/Upload, Unterstützung, App/Karte und Klinikbereitstellung. Z. 200–371: Assistentenvorschläge, keine pauschal akzeptierten Entscheidungen. Z. 1–158: weitergehende strategische Ideen und Marktbehauptungen.
- Die aktuelle Recherche verifiziert nur die oben einzeln verlinkten Funktions- und Technikbehauptungen. Sie bestätigt nicht sämtliche alten Aussagen zu ZVR, EHDS, ePA, EUDI-Wallet, Rechtsformen, Marktprognosen oder Partnerschaften. Monatliches Monitoring bleibt unbeauftragt.
- [UI-REQUIREMENTS.md](UI-REQUIREMENTS.md): Anforderungen der bestehenden KIS-Oberfläche. [README.md](../README.md): Projektzugang und bisherige Demo. [PLAN.md](../PLAN.md): historischer Teamplan, dessen frühere Kiosk-/Karteninterpretation nicht die aktuelle UI-Spezifikation ist.
- Recherche-/Prüfdatum: 05.11.2026. Drei unabhängige Codex-Teilprüfungen: Produkt/USP, Auth/NFC und Repository-Zugriffsgrenzen. Keine produktiven Konten, echten Patientendaten oder Geheimnisse untersucht.
