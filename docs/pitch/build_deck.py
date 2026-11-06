"""Build the editable Vorsorge pitch with the installed Microsoft PowerPoint.

Usage:
  python docs/pitch/build_deck.py
  python docs/pitch/build_deck.py --render

The builder uses an existing Microsoft PowerPoint installation. The second
command also exports the PDF backup and PNG previews. It opens only this generated presentation and
closes only that presentation. It does not quit the user's PowerPoint instance.
All text remains editable in the PPTX. Private render output lives in .build.

Source snapshot: 6ec45fe. Presentation date: 2026-11-06.
The supported presentation artifact runtime was unavailable in this environment.
This native PowerPoint builder is the documented local fallback.
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

HERE = Path(__file__).resolve().parent
OUT = HERE / "Vorsorge-pitch.pptx"
PDF = HERE / "Vorsorge-pitch.pdf"
BUILD = HERE / ".build"
W, H = 12192000, 6858000
EMU = 914400
NAVY, TEAL, INK, GRAY, LIGHT = "102F40", "087F83", "163746", "526976", "B8E3DC"
SOURCE_DEAS = "https://www.bpb.de/system/files/dokument_pdf/2.7.pdf"
SOURCE_ZVR = "https://www.bnotk.de/aufgaben-und-taetigkeiten/rundschreiben/details/aenderungen-im-zentralen-vorsorgeregister-der-bundesnotarkammer-zvr-zum-1-oktober-2026"
SOURCE_HOSPITALS = "https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Gesundheit/Krankenhauser/Tabellen/eckzahlen-krankenhaeuser.html"


def text(x, y, w, h, content, size=24, color=INK, bold=False):
    return dict(x=x, y=y, w=w, h=h, content=content, size=size, color=color, bold=bold)


def standard(title, body, note, source="", appendix=False):
    return dict(bg="FFFFFF", boxes=[text(.65, .47, 12.05, .82, title, 34, NAVY, True), *body], note=note, source=source, appendix=appendix)


SLIDES = [
    dict(bg=NAVY, boxes=[
        text(.72, .53, 11.8, .5, "VORA", 25, LIGHT, True),
        text(.72, 1.5, 11.8, 3.2, "Care planning\nfor you and your family", 54, "FFFFFF", True),
        text(.76, 5.35, 11.4, .75, "Our vision: one calm place to prepare and stay in control", 24, "FFFFFF"),
        text(.76, 6.35, 11.7, .55, "Product vision. Live demonstration uses synthetic people and documents.", 17, LIGHT),
    ], note="[0:00–0:25, 25 seconds]\nWhat does planning ahead look like for your family today? Perhaps an unfinished power of attorney, or a folder at home that nobody knows how to find. Then a health concern makes it feel urgent. VORA aims to make the next step clearer before that moment arrives.", source="Henri's product narrative, 6 November 2026, preserved in docs/pitch/README.md. Illustrative situation and product goal, not a measured prevalence or medical claim. VORA is the current repository product name.", appendix=False),
    standard("The preparation gap", [
        text(.7, 1.75, 11.8, 1.3, "About 1 in 2", 69, TEAL, True),
        text(.75, 3.05, 11.45, 1.3, "adults aged 45–90 reported none of three\nadvance-care documents.", 30, INK),
        text(.75, 4.78, 11.7, 1.02, "The preparation gap is real.\nWhat makes the next step easier?", 25, INK),
        text(.75, 6.4, 11.7, .58, "DEAS 2023, ages 45–90, self-report. Advance directive, power of attorney, guardianship directive.\nSource: Sozialbericht 2024, chapter 2.7, pp. 100–101.", 14, GRAY),
    ], "[0:25–0:45, 20 seconds]\nIn Germany's 2023 Ageing Survey, around half of people aged 45 to 90 reported none of these three documents. That shows a preparation gap. We want to test whether a calmer, guided process helps people take the next step.", SOURCE_DEAS + " The survey does not measure procrastination, stress reduction or why physicians retrieve documents.",),
    standard("The product vision", [
        text(.75, 1.65, 5.5, .45, "PLAN AHEAD", 18, TEAL, True),
        text(.75, 2.33, 5.5, .7, "Understand and prepare", 31, NAVY, True),
        text(.75, 3.35, 5.25, 1.65, "Guided questions, documents\nand next steps in one place.", 26, INK),
        text(7.0, 1.65, 5.5, .45, "STAY IN CONTROL", 18, TEAL, True),
        text(7.0, 2.33, 5.5, .7, "Choose who sees what", 31, NAVY, True),
        text(7.0, 3.35, 5.45, 2.25, "A relative could view a power\nof attorney while vaccination\nrecords stay private.", 25, INK),
        text(.75, 6.12, 11.75, .88, "The full vision includes updates, reminders and relevant appointments.\nA card would connect approved information to care systems.", 18, GRAY),
    ], "[0:45–1:15, 30 seconds]\nOur vision is one calm place for you and your family to understand, prepare and organise care. You choose which person may see which document: a power of attorney, for example, without sharing a vaccination record. Updates, reminders and relevant appointments belong to that journey. A card should make approved information accessible in care. Today we will demonstrate one part: handing an existing document to a simulated clinic.", "Henri's product vision, 6 November 2026. Family recipient permissions, reminders and actual KIS/ePA connections are not established by the pinned demo. Card means an access trigger, not documents stored on the chip. Later VORA planning is a separate development snapshot; see EVIDENCE_QA.md."),
    standard("Live demo: the hospital handoff", [
        text(.75, 1.65, 6.1, 2.85, "One chosen version.\nOne confirmed case.\nThe original source.", 35, NAVY, True),
        text(7.5, 1.83, 5.1, 2.8, "1. Share version 2\n2. Receive and confirm\n3. Open the original PDF\n4. Check the receipt", 25, INK),
        text(.75, 5.45, 11.75, .8, "2 minutes 30 seconds\nErika Berger, synthetic demonstration", 22, TEAL, True),
        text(.75, 6.55, 11.75, .4, "Existing document to a configured clinic. Family sharing remains a separate product goal.", 17, GRAY),
    ], "[1:15–3:45, 150 seconds, includes clicks and pauses]\nErika shares a specific existing version with the clinical destination. We inspect what she is sharing. The receiving person checks the patient and case before confirming the transfer. Now we open the original passage on page four. Erika wishes her daughter Jana to join discussions where possible. This addition grants no extra representation authority. Finally, the personal receipt shows which version reached the record. This is one working section of our broader journey, using synthetic information in a simulated clinic.\n\nExact six beats and fallback: RUN_OF_SHOW.md. Keep the 2m30 limit, then return to slide 5.", "Pinned demo 6ec45fe: docs/pitch/RUN_OF_SHOW.md and lib/demo-care-revision.json. A newly prepared planning draft does not automatically enter this handoff. The clinic is simulated; prepared links are not runtime AI extraction."),
    standard("What works, and what comes next", [
        text(.75, 1.65, 3.1, .65, "THIS LIVE DEMO", 18, TEAL, True),
        text(4.1, 1.58, 8.5, 1.0, "Document handoff, case confirmation\nand prepared links to PDF passages", 26, INK),
        text(.75, 3.1, 3.1, .65, "NEWER VORA", 18, TEAL, True),
        text(4.1, 3.03, 8.5, 1.05, "Guided planning, appointment preparation\nand an AI model connector", 26, INK),
        text(.75, 4.65, 3.1, .65, "FULL PRODUCT", 18, TEAL, True),
        text(4.1, 4.58, 8.5, 1.1, "Family permissions, reminders\nand real KIS/ePA connections", 26, INK),
        text(.75, 6.32, 11.7, .65, "The pinned demo uses deterministic assistance. Newer AI needs a live check before presentation.", 17, GRAY),
    ], "[3:45–4:30, 45 seconds]\nThe pinned demonstration shows the existing-document handoff and prepared source links. Its assistant uses rules. Newer VORA code already adds guided preparation, appointment planning and an OpenAI model connector. A later local extension adds ChatGPT sign-in, but a completed live-model exchange still needs confirmation for the presentation. Those later features are outside this pinned build. Family permissions, active reminders and real KIS or ePA integration remain work to connect the full journey. Clinical and legal applicability still require qualified review.", "Demo snapshot 6ec45fe. Later repository: published ac306cf, local HEAD 258338b plus uncommitted changes reviewed 6 November 2026; docs/VORA-AI.md and docs/VORA-DESIGN.md. Do not generalize the old assistant's no-model limitation to current VORA. Code inspection is not live service verification."),
    standard("Value for families and care teams", [
        text(.75, 1.65, 11.8, 1.6, "A clearer next step.\nControl over what others can see.", 35, NAVY, True),
        text(.75, 3.78, 3.0, .45, "FIRST USERS", 18, TEAL, True),
        text(4.1, 3.72, 8.3, .85, "People planning for themselves and their family", 24, INK),
        text(.75, 5.0, 3.0, .45, "PAYER TO TEST", 18, TEAL, True),
        text(4.1, 4.92, 8.4, .85, "Family-paid or institution-funded access", 24, INK),
        text(.75, 6.4, 11.7, .6, "Proposed value and business options. Stress reduction, demand and savings are unmeasured.", 17, GRAY),
    ], "[4:30–5:15, 45 seconds]\nOur primary users are people planning for themselves or supporting their family. The intended value is a clearer next step and control over what others can see. For care teams, the linked handoff should make the right version and source easier to review. We have not measured stress reduction or savings. We would test understanding, correct sharing choices and retrieval effort. Whether families pay directly or an institution funds access remains an open business question.", "User-provided family-first product direction, 6 November 2026. Family-paid and institution-funded access are options for validation, not confirmed prices, buyers or an accepted commercial model. No outcome claims."),
    standard("What this submission includes", [
        text(.75, 1.6, 5.6, .5, "BUILT DURING THE EVENT", 18, TEAL, True),
        text(.75, 2.45, 5.55, 2.3, "Synthetic personal and clinical flows\nDocument version and receipt trail\nPDF source passage view", 25, INK),
        text(7.0, 1.6, 5.6, .5, "PRE-EXISTING INPUTS", 18, TEAL, True),
        text(7.0, 2.45, 5.55, 2.3, "General preparation and prompts\nOfficial templates and published research\nDevelopment tools and libraries", 25, INK),
        text(.75, 5.72, 11.7, .75, "AI supported development. Later VORA features are outside this pinned demo.", 21, TEAL, True),
        text(.75, 6.6, 11.7, .35, "Live-demo snapshot: 6ec45fe. Team contributions must match the submitted version.", 15, GRAY),
    ], "[5:15–5:40, 25 seconds]\nDuring the event, we built the synthetic clinical flow, document handoff and source passage view. General preparation and prompts existed beforehand. Official templates, published research and software libraries are external inputs. AI supported development. We distinguish later VORA work from this pinned demonstration and disclose each person's actual contribution.", "Baseline 6ec45fe. Preparation provenance and editable team contribution fields: docs/pitch/README.md. Preserve original external attribution. Later VORA commits are separately identified, not silently included in this demo snapshot."),
    dict(bg=NAVY, boxes=[
        text(.75, .65, 11.8, 1.85, "Planning ahead,\nwith people you trust", 47, "FFFFFF", True),
        text(.78, 2.85, 11.65, 1.4, "Can people take the next step\nand keep control of their information?", 30, "FFFFFF"),
        text(.78, 4.78, 11.5, 1.15, "Families to test the journey\nClinical and integration partners", 25, LIGHT),
        text(.78, 6.45, 11.5, .55, "Talk to our team after the pitch", 23, LIGHT, True),
    ], note="[5:40–6:00, 20 seconds]\nWe want to test this journey with families, and develop the connection with clinical and integration partners. Can people understand the next step, choose what to share and find the right information when needed? Please talk to our team after the pitch.", source="Proposed evaluation and partner ask. No users, measured benefit or partnerships are claimed. Three-minute jury Q&A follows the six-minute pitch.", appendix=False),
    standard("Sources and existing infrastructure", [
        text(.75, 1.5, 11.6, .5, "Advance-care preparation", 22, TEAL, True),
        text(.75, 2.03, 11.6, .95, "DEAS 2023: roughly half of people aged 45–90 reported none of three\nadvance-care documents. This does not measure delay or stress.", 21, INK),
        text(.75, 3.28, 11.6, .5, "Existing infrastructure", 22, TEAL, True),
        text(.75, 3.81, 11.6, 1.0, "ZVR supports document copies through approved institutions.\nePA already supports document exchange. Our integrations are planned.", 21, INK),
        text(.75, 5.12, 11.6, .5, "Institutional context", 22, TEAL, True),
        text(.75, 5.65, 11.6, .9, "Germany had 1,841 hospitals in 2024. This describes the landscape,\nnot our buyer count, revenue opportunity or chosen business model.", 21, INK),
    ], "Appendix A. Sources checked on 6 November 2026. Keep the DEAS age range and self-report basis. The research does not establish why people postpone planning or why physicians retrieve records. ZVR has supported copies since 1 October 2026. ePA already supports document sharing. Our proposed added value is the family preparation journey and its connection to care workflows.", f"DZA: {SOURCE_DEAS}\nBundesnotarkammer: {SOURCE_ZVR}\nDestatis: {SOURCE_HOSPITALS}\nePA: https://www.bundesgesundheitsministerium.de/epa-na-sicher and https://www.gematik.de/anwendungen/epa-fuer-alle/faq", appendix=True),
    standard("Prototype boundaries", [
        text(.75, 1.55, 5.6, .5, "PINNED DEMO 6ec45fe", 18, TEAL, True),
        text(.75, 2.25, 5.6, 3.35, "Synthetic document handoff\nPatient and case confirmation\nPrepared PDF source links\nDocument version and receipt trail", 24, INK),
        text(7.0, 1.55, 5.55, .5, "END-TO-END VISION", 18, TEAL, True),
        text(7.0, 2.25, 5.55, 3.35, "Per-relative document permissions\nFamily overview and reminders\nReal bookings and KIS/ePA links\nNew drafts reaching the clinic\nClinical and legal validation", 24, INK),
        text(.75, 6.2, 11.65, .85, "Newer VORA adds planning, appointment preparation and AI integration code.\nA live check remains necessary before presenting that separate build.", 17, GRAY),
    ], "Appendix B. Existing clinic sharing permits selected document versions to one configured clinic. It does not provide arbitrary family recipients or family-wide health management. Later VORA offers local preparation and appointment planning. Its model connector exists, but the latest live model exchange and combined acceptance remain open. The card is an access trigger. Data do not all reside on the chip, and a scan does not grant access by itself.", "Code baseline 6ec45fe; newer VORA ac306cf and local 258338b plus working changes, inspected 6 November 2026. EVIDENCE_QA.md separates these scopes. Historic 20-scenario result applies only to the older documented iteration; no new app test ran for this pitch revision.", appendix=True),
    standard("Questions for the next test", [
        text(.75, 1.52, 3.35, .5, "Who pays?", 23, TEAL, True),
        text(4.35, 1.49, 8.1, .8, "Family-paid or institution-funded access is still open.", 22, INK),
        text(.75, 2.67, 3.35, .9, "Who sees\nwhich document?", 23, TEAL, True),
        text(4.35, 2.64, 8.1, 1.1, "Goal: a chosen relative sees the proxy, not every record.\nToday: selected versions go to one configured clinic.", 22, INK),
        text(.75, 4.06, 3.35, .6, "What is success?", 23, TEAL, True),
        text(4.35, 4.03, 8.1, 1.1, "Understanding the next step, correct sharing choices\nand finding the right version and source.", 22, INK),
        text(.75, 5.53, 3.35, .9, "What does AI\ndo today?", 23, TEAL, True),
        text(4.35, 5.5, 8.1, 1.1, "Older demo: rules. Newer VORA: a model connector.\nLive model operation needs a separate check.", 22, INK),
    ], "Appendix C. Explain the complete product goal without presenting every part as implemented. A relative reading a power of attorney does not itself gain legal representation authority. Family permissions and reminders remain future scope. Real appointment booking, notarisation, clinical use and integration require their own valid processes. Refer to EVIDENCE_QA.md for precise English answers.", "Henri's 6 November product narrative; code and document scope check; docs/pitch/EVIDENCE_QA.md. Business and outcome statements remain hypotheses.", appendix=True),
]



def build(render=False):
    HERE.mkdir(parents=True, exist_ok=True)
    BUILD.mkdir(exist_ok=True)
    for i, slide in enumerate(SLIDES, 1):
        if slide['appendix']:
            slide['boxes'].append(text(11.6,.57,1.0,.4,f"A{i-8}",16,GRAY,True))
        for box in slide['boxes']:
            assert (box['x']+box['w'])*EMU <= W+10
            assert (box['y']+box['h'])*EMU <= H+10
    spec = BUILD/'deck-spec.json'
    spec.write_text(json.dumps(SLIDES, ensure_ascii=False, indent=2), encoding='utf-8')
    def psq(p):
        return "'" + str(p).replace("'", "''") + "'"
    ps = r"""$ErrorActionPreference = 'Stop'
function Get-Rgb([string]$hex) {
    return [Convert]::ToInt32($hex.Substring(0,2),16) + 256*[Convert]::ToInt32($hex.Substring(2,2),16) + 65536*[Convert]::ToInt32($hex.Substring(4,2),16)
}
$ppt = New-Object -ComObject PowerPoint.Application
$ppt.DisplayAlerts = 1
$deck = $null
try {
    $deck = $ppt.Presentations.Add($false)
    $deck.PageSetup.SlideWidth = 960
    $deck.PageSetup.SlideHeight = 540
    $spec = [IO.File]::ReadAllText(__SPEC__) | ConvertFrom-Json
    $i = 0
    foreach ($item in $spec) {
        $i += 1
        $slide = $deck.Slides.Add($i, 12)
        $slide.SlideShowTransition.Hidden = $item.appendix
        $slide.FollowMasterBackground = $false
        $slide.Background.Fill.Solid()
        $slide.Background.Fill.ForeColor.RGB = Get-Rgb $item.bg
        foreach ($b in $item.boxes) {
            $shape = $slide.Shapes.AddTextbox(1, $b.x*72, $b.y*72, $b.w*72, $b.h*72)
            $shape.TextFrame.MarginLeft = 0
            $shape.TextFrame.MarginRight = 0
            $shape.TextFrame.MarginTop = 0
            $shape.TextFrame.MarginBottom = 0
            $shape.TextFrame.WordWrap = $true
            $shape.TextFrame.AutoSize = 0
            $shape.TextFrame.TextRange.Text = $b.content.Replace("`n", "`r")
            $shape.TextFrame.TextRange.Font.Name = 'Arial'
            $shape.TextFrame.TextRange.Font.Size = $b.size
            $shape.TextFrame.TextRange.Font.Color.RGB = Get-Rgb $b.color
            $shape.TextFrame.TextRange.Font.Bold = $b.bold
            $shape.TextFrame.TextRange.ParagraphFormat.SpaceWithin = 1.12
            $shape.TextFrame.TextRange.ParagraphFormat.SpaceBefore = 0
            $shape.TextFrame.TextRange.ParagraphFormat.SpaceAfter = 0
            $shape.Width = [single]($b.w*72)
            $shape.Height = [single]($b.h*72)
        }
        $slide.NotesPage.Shapes.Placeholders.Item(2).TextFrame.TextRange.Text = $item.note + "`r`rSources and scope`r" + $item.source
    }
    $deck.SaveAs(__PPTX__, 24)
    if (__RENDER__) {
        foreach ($slide in $deck.Slides) { $slide.SlideShowTransition.Hidden = $false }
        $deck.SaveAs(__PDF__, 32)
        $deck.Export(__PNG__, 'PNG', 1600, 900)
        foreach ($slide in $deck.Slides) { $slide.SlideShowTransition.Hidden = $slide.SlideIndex -gt 8 }
        $deck.SaveAs(__PPTX__, 24)
    }
    $checks = @()
    foreach ($slide in $deck.Slides) {
        foreach ($shape in $slide.Shapes) {
            if ($shape.HasTextFrame -and $shape.TextFrame.HasText) {
                $tr = $shape.TextFrame.TextRange
                $checks += [pscustomobject]@{slide=$slide.SlideIndex; name=$shape.Name; text=$tr.Text; shapeWidth=$shape.Width; shapeHeight=$shape.Height; textWidth=$tr.BoundWidth; textHeight=$tr.BoundHeight}
            }
        }
    }
    [IO.File]::WriteAllText(__BOUNDS__, ($checks | ConvertTo-Json -Depth 4), (New-Object Text.UTF8Encoding($false)))
    Write-Output ('PowerPoint authored ' + $deck.Slides.Count + ' slides')
} finally {
    if ($null -ne $deck) { $deck.Close(); [void][Runtime.InteropServices.Marshal]::ReleaseComObject($deck) }
    if ($null -ne $ppt) { [void][Runtime.InteropServices.Marshal]::ReleaseComObject($ppt) }
}
"""
    for key, value in {'__SPEC__':psq(spec), '__PPTX__':psq(OUT), '__PDF__':psq(PDF), '__PNG__':psq(BUILD/'slides'), '__BOUNDS__':psq(BUILD/'powerpoint-text-bounds.json'), '__RENDER__':'$true' if render else '$false'}.items():
        ps = ps.replace(key, value)
    script = BUILD/'build-and-render.ps1'
    script.write_text(ps, encoding='utf-8')
    subprocess.run(['powershell.exe', '-NoProfile', '-File', str(script)], check=True)
    with zipfile.ZipFile(OUT) as package:
        for name in package.namelist():
            if name.endswith('.xml') or name.endswith('.rels'):
                ET.fromstring(package.read(name))
        slides = [name for name in package.namelist() if re.fullmatch(r'ppt/slides/slide\d+\.xml', name)]
        notes = [name for name in package.namelist() if re.fullmatch(r'ppt/notesSlides/notesSlide\d+\.xml', name)]
        assert len(slides) == len(notes) == 11
    report = dict(slides=11, main_slides=8, appendix_slides=3, font_policy=dict(basis='design', families=['Arial']), native_powerpoint_saved=True, editable_native_text=True, speaker_notes=True, source_snapshot='6ec45fe', output_bytes=OUT.stat().st_size, pdf_bytes=PDF.stat().st_size if render else None)
    (BUILD/'package-check.json').write_text(json.dumps(report, indent=2)+'\n', encoding='utf-8')
    print(json.dumps(report))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--render', action='store_true', help='Also export PDF and PNG previews')
    args = parser.parse_args()
    build(args.render)
