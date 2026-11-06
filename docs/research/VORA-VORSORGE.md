# VORA: Quellen und fachliche Inhaltsstruktur

Stand und Abruf: **06.11.2026**. Geltungsbereich: Consumer-Produkt für Erwachsene in Deutschland; Vorsorgedokumente, Prävention, Impfunterlagen und Reisevorbereitung. Auftrag: fachlich nachvollziehbare Grundlage für die VORA-Überarbeitung. Owner dieses Dokuments: Consumer-Research; Implementierung und Abnahme liegen beim Consumer-Integrator.

Dieses Dokument hält gelesene Originalquellen, daraus abgeleitete Produktentscheidungen und Grenzen getrennt. Es ist weder eine individuelle medizinische Empfehlung noch eine juristische Freigabe. Die tatsächliche Implementierung ist im [Consumer-Featurekatalog](../CONSUMER-FEATURES.md) nachzuweisen; der [KI-Vertrag](../VORA-AI.md) beschreibt die technische Assistenz. Die ältere Consumer-Priorisierung zugunsten statischer Hilfe wird durch den aktuellen Auftrag zu einer KI-gestützten VORA-Erfahrung korrigiert, ohne historische Beiträge umzuschreiben.

## 1. Inhaltsstruktur für die Oberfläche

| Arbeitsbereich | Aufgabe und greifbares Ergebnis | Tatsächlicher Abschluss |
|---|---|---|
| Meine Vorsorge | Persönliche Themen, nächste Aufgaben und offene Fragen zusammenhalten | Bearbeitete Aufgaben, kein medizinischer Vorsorge-Score |
| Dokumentwerkstatt | Amtliche Vorlage verstehen, einzelne Entscheidungen bearbeiten, eigenen Entwurf prüfen, Original herunterladen | Entwurf, Unterzeichnung, Formklärung und Aufbewahrung bleiben eigene Schritte |
| Impfpass | Impfungen und ihre Nachweise geordnet erfassen; Unsicherheiten und ärztlich genannte Folgetermine behalten | Eigene Erfassung wird nicht zur ärztlich bestätigten Impfdokumentation |
| Früherkennung | Gesetzliche Angebote und persönliche Terminplanung auseinanderhalten | Geplant, wahrgenommen und Ergebnis besprochen sind unterschiedliche Zustände |
| Reisevorsorge | Reiseziel, Zeitraum, Route und offene reisemedizinische Aufgaben vorbereiten | Externe Länderinformation gelesen oder Beratung erfolgt; keine pauschale Reisefreigabe |
| VORA-Assistent | Die aktuelle Frage erklären, vorhandene Angaben zusammenführen und nächste Schritte anbieten | Vorschläge benötigen Übernahme; Quellen und fehlende Informationen bleiben sichtbar |

**Prozessvorschlag:** Anlass → passende Themen → kleine Bausteine → offene Fragen → persönliche Prüfung → Dokument bzw. Terminvorbereitung → echte Folgeschritte. Ein heruntergeladenes Dokument ist nicht automatisch unterschrieben, registriert oder einer Einrichtung zugegangen.

## 2. Amtliche Vorlagen: tatsächlich geprüft

Die BMJV-Adressen ohne Query-Parameter liefern bei diesem Abruf **HTML-Landingpages mit HTTP 200**. Für einen wirklichen PDF-Download sind die untenstehenden, aus den amtlichen Seiten extrahierten Links erforderlich. Alle drei direkten Links wurden abgerufen: HTTP 200, `application/pdf`, `%PDF`-Dateikennung; Inhalte und AcroForm-Felder wurden mit `pypdf` gelesen.

| Original | Echter Download | Stand, technischer Befund und lokaler Abgleich |
|---|---|---|
| Vorsorgevollmacht | [BMJV, PDF](https://www.bmjv.de/SharedDocs/Downloads/DE/Formular/Vorsorgevollmacht.pdf?__blob=publicationFile&v=8) | Januar 2023; 4 Seiten; 69 AcroForm-Felder; keine vorbelegten Personenwerte. Byteidentisch mit [lokalem Original](../../public/pdfs/Vorsorgevollmacht.pdf). |
| Betreuungsverfügung | [BMJV, PDF](https://www.bmjv.de/SharedDocs/Downloads/DE/Formular/Betreuungsverfuegung.pdf?__blob=publicationFile&v=5) | Januar 2023; 1 Seite; 26 AcroForm-Felder; keine vorbelegten Personenwerte. Amtliches Formular, nicht die vorhandene synthetische Patienten-Beispieldatei. |
| Textbausteine Patientenverfügung | [BMJV, PDF](https://www.bmjv.de/SharedDocs/Downloads/DE/Formular/Patientenverfuegung_Textbausteine_pdf.pdf?__blob=publicationFile&v=7) | 7 Seiten; keine AcroForm-Felder. Auswahl-/Formulierungshilfe, kein Formular mit fertig zuordenbaren Eingabefeldern. Byteidentisch mit [lokaler Vorlage](../../public/templates/patientenverfuegung-textbausteine.pdf). Der bisherige [Quellennachweis](../../public/templates/sources.json) führt Januar 2023 und die Bereitstellung durch den Nutzer auf. |

SHA256 des tatsächlich abgerufenen Inhalts:

- Vorsorgevollmacht: `88c2c5fad413c4c9046ac3f171ac71ded98b421effdca7e4dabb33afe520d176`.
- Betreuungsverfügung: `939ada0c6a7f28d5122f72ff083addd8e19c1dad02c2c1665b8e2f8935af26a0`.
- Patientenverfügung: `059c18c92dcaf8477aea95e3b8cb85c80b040602870703e1989d087a6687d524`.

**Implementierungsfolge:** `Original form` muss das wirkliche amtliche Dokument öffnen. `My draft` bezeichnet einen aus tatsächlichen Angaben erstellten Entwurf. Eine synthetische Demoakte darf nicht als Blankovorlage ausgegeben werden. Eine technisch befüllbare PDF ist noch kein vollständiges Feldmapping. Bei einer PDF-Befüllung müssen auch die gespeicherten Feldwerte und die gerenderten Werte übereinstimmen; Feldanzahl und erfolgreicher Download allein belegen das nicht.

### 2.1 Vorsorgevollmacht: vollständige Abschnittskarte

Das Original bevollmächtigt ausdrücklich nur im angekreuzten oder angegebenen Umfang. Die vorhandene Reduktion auf Person und allgemeinen Gesundheitsumfang bildet die gesamte Vorlage nicht ab.

| Baustein | Amtlicher Abschnitt / Seite | Inhalt, der getrennt bearbeitbar bleiben muss |
|---|---|---|
| Beteiligte | Seite 1 | Vollmachtgeber und bevollmächtigte Person mit Personendaten; Umfang und Originalurkunde |
| Gesundheit und Pflege | 1 / Seite 2 | Gesundheitssorge und Pflege; Durchsetzung des Patientenwillens |
| Besondere medizinische Befugnisse | 1 / Seite 2 | Einwilligung/Ablehnung/Widerruf auch bei Gefahr schwerer Schäden; keine stillschweigende Übernahme einer allgemeinen Ja-Antwort |
| Unterlagen und Schweigepflicht | 1 / Seite 2 | Einsicht/Herausgabe, Schweigepflichtentbindung und Weitergabe an Dritte |
| Freiheit und Zwangsmaßnahmen | 1 / Seite 2 | Unterbringung, freiheitsentziehende Maßnahmen, ärztliche Zwangsmaßnahmen und Verbringung jeweils getrennt |
| Aufenthalt und Wohnen | 2 / Seite 2 | Aufenthaltsbestimmung, bestehende/neue Mietverträge, Haushaltsauflösung, Wohn- und Betreuungsvertrag |
| Behörden | 3 / Seite 3 | Behörden, Versicherungen, Renten-/Sozialleistungsträger und datenschutzrechtliche Einwilligung |
| Vermögen | 4 / Seite 3 | Verfügung, Zahlungen, Verbindlichkeiten, Bank/Depot/Safe, begrenzte Schenkungen, ausdrücklich ausgeschlossene Geschäfte |
| Post und Kommunikation | 5 / Seite 4 | Post einschließlich elektronischer Kommunikation, zugehörige Rechtsgeschäfte |
| Gerichte | 6 / Seite 4 | Vertretung und Prozesshandlungen |
| Untervollmacht | 7 / Seite 4 | Weiterbevollmächtigung ausdrücklich entscheiden |
| Betreuung als Auffanglösung | 8 / Seite 4 | Wunsch an das Gericht, falls trotz Vollmacht Betreuung erforderlich wird |
| Nach dem Tod | 9 / Seite 4 | Geltung über den Tod hinaus ausdrücklich entscheiden |
| Eigene Regeln und Abschluss | 10 / Seite 4 | Weitere Regelungen; Ort, Datum und Unterschriftsfelder beider Beteiligter |

**Keine persönliche Entscheidung vorwählen.** Pro Befugnis sind mindestens `Not decided`, `Yes`, `No` und eine offene Klärungsfrage unterscheidbar. Nicht jede Frage muss in einer Sitzung entschieden werden. Die fachliche Bedeutung bleibt im vollständigen Original erreichbar.

Die [BMJV-Erläuterung zur Vorsorgevollmacht](https://www.bmjv.de/DE/themen/vorsorge_betreuungsrecht/vorsorgevollmacht/vorsorgevollmacht_node.html), veröffentlicht 01.01.2023, bestätigt: Erteilung durch volljährige geschäftsfähige Person; Schriftform wird empfohlen; bestimmte Fälle erfordern Beglaubigung oder notarielle Beurkundung. Im Außenverhältnis wirkt eine Vollmacht grundsätzlich bereits ab Ausstellung; eine interne Abrede zur späteren Nutzung ist davon verschieden. Deshalb darf VORA keinen universellen Schalter „wird automatisch bei Krankheit aktiviert“ behaupten.

Das Original selbst verweist bei Immobilien, Handelsgewerbe und Verbraucherdarlehen auf besondere Formanforderungen; für Bankangelegenheiten auf die bankeigene Konto-/Depotvollmacht. Die UI sollte daraus konkrete Prüfaufgaben ableiten. Die Vollmachtsurkunde soll im Bedarfsfall zugänglich sein und ihr Ort der bevollmächtigten Person bekannt sein; das konkrete Formular enthält eine Originalvorlageklausel. Eine App-Kopie darf nicht pauschal das Original ersetzen.

### 2.2 Patientenverfügung: Situationen mit Maßnahmen verbinden

Die [BMJV-Erläuterung](https://www.bmjv.de/DE/themen/vorsorge_betreuungsrecht/patientenverfuegung/patientenverfuegung_node.html), veröffentlicht 01.06.2023, und die sieben PDF-Seiten wurden gelesen. Die PDF ist kein Satz fertiger Empfehlungen: Sie enthält Alternativen und erläuternde Fußnoten.

| Baustein | Originalstelle | Konsequenz für den Prozess |
|---|---|---|
| Person und Geltungsfall | Eingangsformel, Seite 1 | Für den Fall, dass eigener Wille nicht mehr gebildet oder verständlich geäußert werden kann |
| Konkrete Situationen | 2.2, Seiten 1–2 | Situationen ausdrücklich auswählen/beschreiben; keine Diagnose durch den Agenten |
| Maßnahmen je Situation | 2.3.1–2.3.8, Seiten 2–4 | Lebenserhaltung, Schmerz/Symptome, Ernährung/Flüssigkeit, Wiederbelebung, Beatmung, Dialyse, Antibiotika, Blut/Blutbestandteile |
| Behandlung und Beistand | 2.4, Seite 4 | Gewünschter Ort und unterstützende Personen/Organisationen |
| Informationen und Umsetzung | 2.5–2.6, Seite 5 | Schweigepflicht, Verbindlichkeit, Auslegung, Durchsetzung, Widerruf |
| Andere Dokumente | 2.7–2.8, Seite 6 | Vollmacht/Betreuungsverfügung und beigefügte Wertvorstellungen nachvollziehbar verknüpfen |
| Organspende | 2.9, Seite 6 | Mögliche Spannung mit Behandlungsausschlüssen ausdrücklich besprechen, keine automatische Vorrangwahl |
| Abschluss und Beratung | 2.10–2.13, Seite 7 | Schlussformel, eigene Verantwortung, Beratung, gegebenenfalls ärztliche Aufklärung/Bestätigung |
| Überprüfung | 2.14, Seite 7 | Bestätigung, Änderung oder bewusst gewählte zeitliche Geltung; kein erfundenes pauschales Ablaufdatum |

**Zentrale Quellenanforderung:** Konkrete Behandlungssituationen und darauf bezogene Behandlungswünsche müssen zusammenstehen. Die isolierte Formulierung „keine lebenserhaltenden Maßnahmen“ reicht nach der Erläuterung auf Seite 1 und Fußnote 7 nicht als hinreichend konkrete Festlegung. Ein KI-Entwurf darf weder persönliche Werte in Behandlungsablehnungen umdeuten noch eine Maßnahmenwahl ohne Situationsbezug ausgeben.

[§ 1827 BGB](https://www.gesetze-im-internet.de/bgb/__1827.html) setzt eine schriftliche Festlegung eines einwilligungsfähigen Volljährigen voraus; Widerruf ist jederzeit formlos möglich, die Errichtung freiwillig. Die [BMG-Information](https://www.bundesgesundheitsministerium.de/patientenverfuegung.html), Stand 06.01.2026, empfiehlt fachkundige Beratung und betont den Bezug zur konkreten Situation. [§ 126 BGB](https://www.gesetze-im-internet.de/bgb/__126.html) beschreibt die eigenhändige Unterschrift für gesetzliche Schriftform und nennt mögliche Ersatzformen; ein eingegebener Name oder eine Bestätigung in VORA ist kein Nachweis einer formgerechten Unterzeichnung.

### 2.3 Betreuungsverfügung: Wünsche an ein Gericht

Das amtliche einseitige Formular enthält eigene Person, gewünschte Betreuungsperson, Ersatzperson, ausdrücklich ausgeschlossene Person, vier persönliche Wunschfelder sowie Ort/Datum/Unterschrift. Das ist eine eigene Struktur; weder eine bloße Kurzfassung der Vollmacht noch bereits eine Bestellung.

[§ 1816 Absatz 2 BGB](https://www.gesetze-im-internet.de/bgb/__1816.html) regelt die Berücksichtigung von Wünschen und Ablehnungen bei der Auswahl und ihre Grenzen. Wer bei Kenntnis eines laufenden Bestellungsverfahrens eine Betreuungsverfügung besitzt, hat sie dem Betreuungsgericht zu übermitteln. Daraus folgt als Produktaufgabe: Original auffindbar halten, vorgesehene Person über Ablage informieren und den Übermittlungsweg im tatsächlichen Bedarfsfall kennen. VORA behauptet weder eine gerichtliche Bestellung noch eine Übermittlung.

### 2.4 Dokumentbezogene Folgeaufgaben

`Bausteine bearbeitet` → `persönlich geprüft` → `Formfragen geklärt` → `unterzeichnet` → `Original aufbewahrt` → `gezielt zugänglich gemacht` sind eigenständige Zustände. Fremde Angaben und KI-Vorschläge dürfen nicht als bestätigter Wille erscheinen. Änderungen erzeugen neuen Prüfbedarf und ändern keine bereits ausgegebenen unterschriebenen Fassungen.

Für Registerfunktionen wird hier keine aktuelle Integrations- oder Speicherzusage abgeleitet: Die BMJV-Vollmachtsseite von 2023 enthält Aussagen zur Registeraufbewahrung, die für den veränderten Registerstand 2026 separat gegen die verantwortliche Registerquelle geprüft werden müssen. Ohne diese Prüfung keine Behauptung „Registrierung abgeschlossen“, „Original dort hinterlegt“ oder „Register speichert nie Dokumentkopien“.

## 3. Früherkennung: Anspruch, Entscheidung und Termin trennen

Die folgende Auswahl sind **allgemeine GKV-Angebote**, keine persönlichen Muss-Termine. Ob sie für eine konkrete Person passen, hängt unter anderem von tatsächlicher Untersuchungsgeschichte, Anatomie, Befunden und Risiken ab. Im Interface können Nutzer relevante Angebote selbst aufnehmen; keine starre Geschlechtszuordnung soll eine notwendige Abklärung verdecken. Beschwerden gehören in die passende medizinische Abklärung und nicht in eine Warteschlange für Routine-Screening.

| Angebot | Verifizierter allgemeiner Rahmen | Quelle und Detailgrenze |
|---|---|---|
| Check-up | 18–34 Jahre einmalig; ab 35 alle drei Jahre | [G-BA Gesundheitsuntersuchungen](https://www.g-ba.de/themen/methodenbewertung/erwachsene/gesundheitsuntersuchungen/); individuelle Risikoberatung und Impfstatus gehören dazu |
| Hepatitis-B/-C-Screening | Einmalig ab 35 als Bestandteil des Check-ups | Gleiche G-BA-Quelle; nicht wiederholt als alle drei Jahre fällig ausgeben |
| Brust, klinische Untersuchung | Zusätzlich ab 30, grundsätzlich jährlich | KFE-RL §§ 1, 2, 6; siehe Quellenkonflikt unten |
| Mammographie | Quellenwortlaut: Frauen 50–75; grundsätzlich alle 24 Monate, frühestens 22 Monate nach voriger Teilnahme; weitere Bedingungen beachten | KFE-RL § 10 und [G-BA Programmseite](https://www.g-ba.de/themen/methodenbewertung/erwachsene/krebsfrueherkennung/mammographie-screening/). Die Zentrale Stelle prüft den konkreten Anspruch. Keine automatisch garantierte Buchbarkeit. |
| Darmkrebs | Ab 50: zwei Koloskopien im Abstand von zehn Jahren oder alternativ Stuhltest alle zwei Jahre | [G-BA Darmkrebsprogramm](https://www.g-ba.de/themen/methodenbewertung/erwachsene/krebsfrueherkennung/darmkrebs-screening/); nicht beide Untersuchungswege als gleichzeitig fällige Standardpflichten darstellen |
| Hautkrebs | Ab 35 jedes zweite Jahr | KFE-RL § 29: erneute Untersuchung nach Ablauf des auf die Voruntersuchung folgenden Kalenderjahres; nicht starr 730 Tage berechnen |
| Gebärmutterhalskrebs | 20–34 jährlich Zytologie; ab 35 HPV-Test plus Zytologie alle drei Jahre; keine obere Altersgrenze des Angebots | [G-BA Gebärmutterhalskrebsprogramm](https://www.g-ba.de/themen/methodenbewertung/erwachsene/krebsfrueherkennung/gebaermutterhalskrebs-screening/), am Abruf gelesen. Klinische gynäkologische Untersuchung bleibt grundsätzlich jährlich möglich, ohne Doppelabrechnung desselben Programmbestandteils. |
| Prostata / äußeres Genitale | Ab 45, grundsätzlich jährlich, klinische Untersuchung | KFE-RL §§ 1, 2, 25; kein pauschaler PSA-Test-Anspruch aus dieser Quelle |
| Bauchaortenaneurysma | Männer ab 65 einmaliges Ultraschallscreening | [G-BA Erwachsenenübersicht](https://www.g-ba.de/themen/methodenbewertung/erwachsene/) und Check-up-Seite |
| Lungenkrebs | 50 bis vor Vollendung des 76. Lebensjahres, zusätzlich definierter starker gegenwärtiger/früherer Zigarettenkonsum und Eignungsprüfung; grundsätzlich alle zwölf Monate | KFE-RL §§ 38–39. Kein reiner Altersautomat und kein Anspruch jedes Rauchers. |

Normative Grundlage für die Krebsangaben außer den gesondert geregelten organisierten Darm-/Gebärmutterhalsprogrammen ist die am Abruf veröffentlichte [KFE-RL, geändert 18.12.2025, in Kraft seit 12.03.2026](https://www.g-ba.de/downloads/62-492-4074/KFE-RL_2025-12-18_iK-2026-03-12.pdf), relevante Seiten 4–7, 19–21, 26 und 58. Die Richtlinie wurde als PDF gelesen. Die allgemeine Erwachsenenübersicht weist zusätzlich auf Chlamydien hin; ein vollständiger fachlich geprüfter Regelkatalog für alle Lebensphasen wird damit nicht behauptet.

### Relevante Aktualität und Widersprüche

- **45–49 Jahre, Mammographie:** [Beschluss vom 15.10.2026](https://www.g-ba.de/beschluesse/8061/) steht am Abruf ausdrücklich auf **„noch nicht in Kraft“**. Die [Pressemitteilung](https://www.g-ba.de/presse/pressemitteilungen-meldungen/1356/) nennt voraussichtlich 01.08.2027 für Selbstanmeldung und Januar 2028 für Einladungen, vorbehaltlich der rechtlichen Nichtbeanstandung. VORA darf dies am 06.11.2026 nicht als bereits verfügbaren Regelanspruch zeigen.
- **Brusttasten:** Die G-BA-Mammographie-Webseite nennt in einem Absatz 20 Jahre. Die geltende KFE-RL § 6 unterscheidet klinische gynäkologische Untersuchung ab 20 und zusätzlich Brusttasten ab 30. Für die Inhaltsregel gilt hier die Richtlinie mit **30**, die widersprechende Webseite wird nicht still als gleichwertige Wahrheit übernommen.
- **Oberer Mammographie-Altersrand:** Die gelesenen aktuellen Originale formulieren „50–75“ bzw. „höchstens bis zum Alter von 75 Jahren“. Für den Prototyp wird dieser Quellwortlaut verwendet und kein genauerer automatischer Geburtstags-Cutoff behauptet. Die vorläufige Research-Mitteilung „unter 75“ wurde entsprechend korrigiert.
- **Kalenderjahre und Monatsabstände:** „jährlich“, „jedes zweite Kalenderjahr“ und „24 Monate“ sind keine austauschbaren Rechenregeln. Eigene Erinnerungen werden als persönliche Planung gekennzeichnet.

## 4. Impfpass: Nachweis und Empfehlung

### 4.1 Erfassbare Daten und Herkunft

[§ 22 IfSG](https://www.gesetze-im-internet.de/ifsg/__22.html), am Abruf gelesen, nennt: Impfdatum, Impfstoff und Charge, Krankheit, Name/Geburtsdatum der geimpften Person, Name/Anschrift der verantwortlichen Person und deren Bestätigung in vorgeschriebener Form. Die zur Durchführung berechtigte Person dokumentiert die Impfung; Angaben zu Folge-/Auffrischimpfungen gehören ebenfalls zur Dokumentation.

**Produktmodell:** Datum, Krankheit(en), Impfstoff, Dosis/Serie soweit bekannt, Charge soweit vorhanden, Praxis, Herkunft (`Self-reported`, `Transcribed from record`, `Clinician-confirmed` nur mit tatsächlichem Nachweis), optional nächster ärztlich genannter Termin. Unbekannte Werte bleiben unbekannt. Eine handschriftlich übertragene Notiz oder hochgeladene Kopie wird nicht allein durch das Speichern ärztlich bestätigt; VORA stellt keine Impfzertifikate aus.

Eine einzige Impfstoffgabe kann mehrere Krankheiten betreffen. Kombinationen wie Td/Tdap sind deshalb nicht mehrere separat applizierte Dosen. Fehlende Einträge beweisen keinen fehlenden Impfschutz. Korrekturen müssen als solche verständlich sein und dürfen ältere Nachweise nicht unbemerkt ersetzen.

### 4.2 STIKO, GKV-Leistung und gesetzlicher Nachweis

| Begriff | Was er tatsächlich bedeutet | UI-Konsequenz |
|---|---|---|
| STIKO-Empfehlung | Medizinisch-wissenschaftliche Empfehlung, gegebenenfalls nach Alter, Risiko oder Anlass | `Recommended` nur mit benannter Quelle und Bedingungen; keine allgemeine Pflichtkennzeichnung |
| Leistung der GKV | G-BA bestimmt auf Basis von STIKO-Empfehlungen Details in der Schutzimpfungs-Richtlinie und kann begründet abweichen | Kostenübernahme nicht allein aus einer beliebigen Empfehlung folgern |
| Gesetzlicher Nachweis | Konkrete gesetzliche Bedingung für bestimmte Personen/Situationen | Nur mit benanntem Rechtsgrund und Geltungsbereich; beispielsweise Masernnachweis |
| Dokumentierte Gabe | Ein Ereignis mit nachvollziehbarer Herkunft | Nicht automatisch gleichbedeutend mit vollständig vorhandenem Schutz |

Die [G-BA-Erläuterung](https://www.g-ba.de/themen/arzneimittel/schutzimpfungen/) sowie die [Schutzimpfungs-Richtlinie, Fassung 03.09.2026, in Kraft seit 29.10.2026](https://www.g-ba.de/downloads/62-492-4246/SI-RL_2026-09-03_iK-2026-10-29_AT-28-10-2026-B6.pdf) wurden gelesen. § 11 und Anlage 1 bestimmen die Leistungsdetails. Beispiel aus Anlage 1, Seiten 41–42: Tetanus-Auffrischungen bei Erwachsenen grundsätzlich zehn Jahre nach letzter Dosis; fehlende/unvollständige Grundimmunisierung und Kombinationsimpfstoffe benötigen eigene Beachtung. VORA soll aus einem einzelnen Datum keine vollständige persönliche Impfentscheidung errechnen.

### 4.3 Kleines allgemeines Kalenderraster

Die folgenden vier Gruppen wurden gegen die konkreten Tabellenzeilen der genannten SI-RL geprüft. Sie sind allgemeine Informationen über Standardimpfungen und Leistungsregeln, **keine individuelle Impfempfehlung und keine gesetzliche Impfpflicht**. Ein Bezug zu gespeicherten Personendaten, automatische Fälligkeit oder eine Schutzbestätigung wird daraus nicht abgeleitet. Die Kinder-/Jugendinformation zu HPV ergänzt den ansonsten erwachsenenbezogenen Überblick ausdrücklich.

| Gruppe für die Anzeige | Allgemeiner Rahmen | Gelesener Originalbeleg / Grenze |
|---|---|---|
| Erwachsene ab 18: Tetanus/Diphtherie | Auffrischung grundsätzlich alle zehn Jahre nach der letzten Dosis | Anlage 1, Seiten 12 und 41–42. Fehlende/unvollständige Grundimmunisierung ist ein eigener Fall. Kombination mit Pertussis/weiteren Komponenten nicht aus einer einzelnen Jahreszahl entscheiden. |
| HPV: 9–14 Jahre | Standardimpfung; in der Regel zwei Dosen unter Beachtung der Impfstoff-Fachinformation; fehlende Impfungen können bis vor dem 18. Geburtstag nachgeholt werden | Anlage 1, Seite 22 nennt 9–14 und produktspezifische Abstände; § 11 Absatz 2, Seite 5 regelt Nachholen/Vervollständigen bis zum vollendeten 18. Lebensjahr, soweit Anlage 1 nichts anderes bestimmt. Das Zwei-Dosen-Schema nicht pauschal auf jeden späteren Beginn übertragen. |
| Influenza: ab 60 | Einmal pro Saison, Herbst/Winter | Anlage 1, Seite 22. Daneben bestehen gesonderte Indikationen unter 60; die Auswahl des passenden Impfstoffs und individueller Ausnahmen bleibt ärztliche Aufgabe. Keine Aussage zur aktuellen Produktverfügbarkeit. |
| Herpes zoster: ab 60 | Zwei Dosen im Abstand von zwei bis sechs Monaten | Anlage 1, Seite 20. Die Quelle trifft noch keine Aussage zur Notwendigkeit von Wiederholungsimpfungen. Gesonderte Risikoindikationen unter 60 nicht allein aus dem Alter ableiten. |

Vorschlag für die englische Kennzeichnung: `General vaccination schedule · G-BA benefit rules based on STIKO · checked 6 November 2026`. Unmittelbar daneben: `General information, not a personal recommendation or legal requirement. A practice can check your records and circumstances.` Der Masern-Nachweis erhält einen **getrennten** Abschnitt mit seinem tatsächlichen Geltungsbereich.

[§ 20 Absätze 8–9 IfSG](https://www.gesetze-im-internet.de/ifsg/__20.html) verlangt Masernschutz bzw. Immunität für definierte, nach dem 31.12.1970 geborene Personengruppen in bestimmten Einrichtungen. Medizinische Kontraindikationen und verschiedene zulässige Nachweise sind ausdrücklich geregelt. **Kein pauschales „alle Erwachsenen müssen alle STIKO-Impfungen haben“.** Die [BMG-Masernschutzinformation](https://www.bundesgesundheitsministerium.de/impfpflicht.html), Stand 23.06.2025, wurde ergänzend gelesen; für die genaue Reichweite wird das Gesetz herangezogen.

**Zugriffsgrenze:** Die RKI-Originalseiten zu [STIKO-Empfehlungen](https://www.rki.de/DE/Themen/Infektionskrankheiten/Impfen/Staendige-Impfkommission/Empfehlungen-der-STIKO/empfehlungen-node.html) und [Impfkalender](https://www.rki.de/DE/Themen/Infektionskrankheiten/Impfen/Impfkalender/impfkalender-node.html) lieferten HTTP 403. Ein eigenständiger Vollabgleich mit dem aktuellen RKI-Kalender wurde daher nicht erfolgreich durchgeführt. Die G-BA-Richtlinie ist als gelesene Originalquelle für ihre Leistungsregeln belegt; sie wird nicht als vollständiger Ersatz jeder STIKO-Empfehlung ausgegeben.

## 5. Reisevorsorge

Die [Reisemedizinische Vorsorge des Auswärtigen Amts](https://www.auswaertiges-amt.de/de/reiseundsicherheit/reise-gesundheit/03-vorsorge), Artikelstand 12.10.2023, wurde am 06.11.2026 gelesen. Sie nennt Reiseziel, Jahreszeit, Dauer, Reisestil, persönliche Bedürfnisse und besondere Aktivitäten als relevante Faktoren. Empfohlen wird rechtzeitige individuelle Beratung bei qualifizierten Reise-/Tropenmedizinern. Auch kurze Reisen können relevante Risiken haben.

**Sinnvolle VORA-Bausteine:** Ziel und Transit, Reisezeitraum, Aktivitäten, Beratungsbedarf, vorhandene Impfunterlagen, wichtige Medikamente/Einfuhrfragen, Kranken-/Rückholversicherung und Link zu den aktuellen Länderhinweisen. Der Status `Reviewed on [date]` beschreibt nur die tatsächliche Durchsicht. Die allgemeine Quelle belegt keinen länderspezifischen Impfplan und keine unveränderlichen Einreisevoraussetzungen.

Eine Reiseimpfung kann medizinisch empfohlen, bei bestimmten Einreisen gefordert oder von der Versicherung erstattet sein; das sind drei getrennte Aussagen. Nach § 11 Absatz 3 der gelesenen Schutzimpfungs-Richtlinie ist der dortige Anspruch für auslandsbedingte Impfungen an Bedingungen wie Beruf/Ausbildung oder besondere öffentliche Gesundheitsinteressen geknüpft. Zusätzliche freiwillige Kassenleistungen sind gesondert zu prüfen; keine pauschale Kostenübernahme für Urlaub behaupten.

### Zielbezogene amtliche Navigation und Einreisebedingungen

Die folgenden vier AA-Länderseiten wurden am 06.11.2026 geöffnet und ihr Abschnitt **Gesundheit / Impfschutz / Pflichtimpfungen** gelesen. Die Tabelle gibt nur die dort benannten Einreisebedingungen wieder, keine individuellen Impfempfehlungen. Die Seiten enthalten zusätzlich Sicherheits- und weitere Reisehinweise, die nicht durch diese Tabelle ersetzt werden.

| Ziel und direkter Original-Link | Ausgewiesener Quellenstand | Belegter Hinweis zu vorgeschriebenen Impfungen |
|---|---|---|
| [Ghana](https://www.auswaertiges-amt.de/de/reiseundsicherheit/ghanasicherheit-203372) | Stand 06.11.2026; unverändert gültig seit 05.11.2026 | Gelbfieberimpfung ist zur Einreise für Personen ab neun Monaten vorgeschrieben. Die Seite belegt keine pauschale individuelle Impfeignung oder durch VORA bestätigte Zertifikatsgültigkeit. |
| [Thailand](https://www.auswaertiges-amt.de/de/reiseundsicherheit/thailandsicherheit-201558) | Stand 06.11.2026; unverändert gültig seit 26.10.2026 | Bei direkter Einreise aus Deutschland keine Pflichtimpfungen. Bei Einreise aus einem Gelbfiebergebiet oder mehr als zwölf Stunden Transit in einem solchen Gebiet ist für Personen ab neun Monaten ein Gelbfieberimpfnachweis erforderlich. |
| [Japan](https://www.auswaertiges-amt.de/de/service/laender/japan-node/japansicherheit/213032) | Stand 05.11.2026; unverändert gültig seit 07.07.2026 | Die gelesene Seite nennt keine vorgeschriebenen Einreiseimpfungen. Daraus folgt weder eine allgemeine gesundheitliche Freigabe noch eine Aussage über andere Länder einer Reise. |
| [Brasilien](https://www.auswaertiges-amt.de/de/reiseundsicherheit/brasiliensicherheit-201092) | Stand 06.11.2026; unverändert gültig seit 05.11.2026 | Für direkte Einreise aus Deutschland keine Pflichtimpfungen. Bei Weiterreise aus Brasilien in bestimmte Drittstaaten kann Gelbfiebernachweis verlangt werden; die Folgeziele und deren aktuelle Regeln sind gesondert zu prüfen. |

**Umsetzungsvorschlag:** Bekannte Zielnamen einschließlich eindeutiger englischer/deutscher Aliasse führen zur konkreten amtlichen Seite und zur datierten Kurzinfo. Unbekannte Ziele behalten den funktionierenden AA-Ländereinstieg; keine geschätzte Länderregel aus dem Namen erzeugen. Bei mehreren Zielen, Transit oder unbekannter Route keinen einzelnen Hinweis als Reisegesamturteil zeigen. Ein Zielwechsel setzt eigene Prüfbestätigungen zurück. Ein Status `No entry vaccination listed for direct travel from Germany` ist präziser als `No vaccines needed`. Für Thailand muss die Transitbedingung bereits auf der Karte sichtbar sein und darf nicht nur hinter einem Link stehen.

Die zugrunde liegenden Einreiseregeln können sich kurzfristig ändern. Das Datum bezeichnet den tatsächlichen Quellenabruf, keine automatisch laufende Überwachung. Vor konkreter Reise den vollständigen aktuellen Hinweis und erforderlichenfalls die zuständige Vertretung prüfen. Es wurde keine direkte Anbindung an ausländische Grenz-/Gesundheitssysteme eingerichtet.

## 6. ePA und andere Integrationen

Die [gematik-Übersicht zur ePA für alle](https://www.gematik.de/anwendungen/epa-fuer-alle) und die [Versicherteninformationen](https://www.gematik.de/versicherte) wurden am 06.11.2026 gelesen. Die ePA besitzt eigene Zugriffsrechte, Widerspruchsmöglichkeiten und berechtigte Akteure; Behandlungskontext, Versichertenverwaltung und technische Integration sind Voraussetzungen, keine Folge eines VORA-Buttons.

**Für diesen Ausbau:** `Open ePA information` kann ein echter externer Link sein. `Connected`, `Synced`, `Imported from ePA` oder `Verified by insurer` setzen einen tatsächlich implementierten und getesteten Anschluss voraus. Lokaler Impfpass, exportierter Entwurf, Supabase-Login und vorhandene Klinik-Demo belegen keinen ePA-Zugang. Diese Recherche prüft keine gematik-Zulassung, keine technischen Spezifikationen eines künftigen Anschlusses und keine verfügbare ePA-Impfpass-Schnittstelle. Sie empfiehlt deshalb auch keine erfundene Integration.

### 6.1 Doctolib: tiefe Buchungsintegration statt Portal-Link

**Nutzerkorrektur, 06.11.2026:** Gewünscht ist die visuelle und funktionale Einbindung von Arztauswahl, Verfügbarkeit und Buchung in VORA. Ein Schnelllink zum Portal erfüllt das nicht. Supabase-Einrichtung bleibt auf ausdrücklichen Nutzerwunsch außerhalb dieses Arbeitsschritts.

Die [offizielle ADAC-Mitteilung vom 25.01.2024](https://media.doctolib.com/image/upload/mkg/file/doctolib_adac.pdf) belegt Arztsuche und Terminbuchung innerhalb einer ausgewählten Partner-App sowie Integration im individuellen Erscheinungsbild. Sie veröffentlicht weder einen API-Vertrag noch eine allgemeine Freigabe für VORA. Die [aktuelle Website-Button-Anleitung](https://doctolib.zendesk.com/hc/de/articles/35806670336660-Kostenfreies-Marketing-f%C3%BCr-eine-bestm%C3%B6gliche-Online-Buchungsquote-Sichtbarkeit) verwendet dagegen normale Links mit `target="_blank"`; ihre CSS-Bezeichnung `doctolib-widget` ist kein Nachweis für eingebettete Buchung.

Öffentliche Leseprüfung am 06.11.2026: Die deutsche Startseite antwortete mit HTTP 200 und `X-Frame-Options: SAMEORIGIN`; diese konkrete Seite lässt sich nicht in einer fremden VORA-Origin einbetten. Das ist keine Aussage über freigegebene Partner-URLs. Das [Entwicklerportal](https://developers.doctolib.com/) antwortete mit HTTP 401 und verlangt Dokumentationszugang. Es wurden keine Zugangsdaten eingesetzt, keine privaten Endpunkte ausgewertet und keine Partnerschaftsanfrage versendet.

**Benötigter Partnervertrag:** freigegebene patientenseitige Suche/Buchung in Deutschland, Sandbox und technische Dokumentation; unterstützter Embed-/SDK-/API-Weg; Rechte für Verzeichnis, echte Verfügbarkeiten und verbindliche Buchung; Authentifizierung und zugelassene Domains; dokumentierte Ereignisse für Bestätigung, Abbruch, Ablauf und Fehler. Ein normales Patientenkonto oder eine Praxis-API ist dafür nicht automatisch ausreichend.

**VORA-UX:** Anlass und Ort vorbereiten → Praxis und echte Verfügbarkeit auswählen → Patient prüft und bestätigt → bestätigte Buchung anzeigen. Der lokale erste Schritt kann umgesetzt werden; die nachfolgenden Schritte bleiben ohne Partnerzugang sichtbar unverfügbar. Arztprofile, Zeiten oder Erfolgsbestätigungen werden nicht erfunden. Eine reservierte Zeit ist erst nach der dokumentierten Anbieterbestätigung eine Buchung. Die [offizielle Patientenhilfe](https://doctolibpatient.zendesk.com/hc/de/articles/360025316194-Wie-buche-ich-einen-Termin-auf-Doctolib) beschreibt zusätzliche Bedingungen wie Terminart, Standort und Bestandspatientenstatus.

## 7. Abnahme aus den Quellen

1. **Originaldownload:** Die drei Dokumenttypen führen zu echten PDF-Inhalten; der Betreuungslink liefert das amtliche leere Formular. Der lokale Vollmacht-/PV-Originalstand bleibt nachvollziehbar.
2. **Vollmacht:** Gesundheit, Wohnen, Behörden, Vermögen, Kommunikation und weitere Befugnisse sind sichtbar getrennt. Ein offener oder abgelehnter Baustein wird nicht als Zustimmung ausgegeben.
3. **Patientenverfügung:** Persönliche Werte allein erscheinen nicht als konkrete Behandlungseinwilligung; Situation und Maßnahme bleiben verbunden, Widersprüche/offene Punkte sichtbar.
4. **Abschluss:** Persönliche Review-Aktion, Dateidownload, Unterschrift und Aufbewahrung erzeugen getrennte Status. Eine KI-Antwort schließt keine fachliche Prüfung selbstständig.
5. **Prävention:** Testfälle prüfen Check-up 34/35, Brusttasten 29/30, Mammographie 45/49 am 06.11.2026, einmalige Hepatitis-/AAA-Leistungen und alternative Darmkrebswege. Der künftige Mammographie-Beschluss wird nicht als in Kraft behandelt.
6. **Impfpass:** Freitexteintrag bleibt selbst berichtet, unbekanntes Datum erzeugt kein falsches Fälligkeitsdatum, Kombinationsimpfungen werden nicht mehrfach als durchgeführte Injektion gezählt. Masernnachweis ist keine allgemeine Impfpflicht.
7. **Reise/ePA:** Nutzer können relevante Quellen tatsächlich öffnen. Kein Klick erzeugt einen behaupteten Versicherungs-/Einreise-/ePA-Nachweis.
8. **KI:** Antworten nennen nur die tatsächlich bereitgestellten Quellen; erklären Wissenslücken, erhalten Originalangaben und übernehmen persönliche Entscheidungen erst nach ausdrücklicher Nutzeraktion.

## 8. Offene Grenzen und Pflege

- Medizinische und rechtliche Fachabnahme, echter Nutzertest und vollständiges Formularmapping sind durch diese Quellenrecherche nicht erbracht. Produktteam/Fachreview verantworten diese nächsten Nachweise.
- RKI-Kalender war technisch gesperrt; ein vollständiger alters-/risikobezogener Impfalgorithmus ist nicht freigegeben. Nächster Schritt: aktuelles RKI-Original zugänglich beschaffen und mit der Implementierung abgleichen, bevor daraus individuelle Automatismen entstehen.
- Oberer Mammographie-Geburtstagsrand wird im Prototyp nicht genauer automatisiert als die gelesene Quelle; verbindliche Auskunft/Terminprüfung durch die Zentrale Stelle. Die 45+-Erweiterung muss vor dem genannten künftigen Start erneut auf Inkrafttreten geprüft werden.
- Die Linkversionen dienen der Reproduzierbarkeit dieses Abrufs. Vor Austausch einer Vorlage Hash, inhaltliche Änderungen und davon betroffene Bausteine prüfen; ein neuer Download darf bestehende unterschriebene Fassungen nicht ändern.
- Geprüft wurden externe Originaltexte und PDF-Inhalte/Feldbestand, keine echte Klinik-/Register-/ePA-Übermittlung und keine rechtliche Wirksamkeit eines individuellen Dokuments. Es wurden keine echten Personen- oder Gesundheitsdaten übermittelt.
