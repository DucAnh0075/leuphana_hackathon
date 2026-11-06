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
        text(.72, .53, 11.8, .5, "Vorsorge", 25, LIGHT, True),
        text(.72, 1.5, 11.8, 3.2, "Her wishes exist.\nCan the care team\nuse them?", 56, "FFFFFF", True),
        text(.76, 5.35, 11.4, .75, "Advance-care planning and document handoff", 25, "FFFFFF"),
        text(.76, 6.35, 11.7, .55, "Erika Berger is a synthetic case. All demo patient data are synthetic.", 17, LIGHT),
    ], note="[0:00–0:25, 25 seconds]\nErika has written down her wishes. In a care situation, the next question is whether the team can find the relevant version and understand the original passage. Erika is a synthetic case. Vorsorge explores how to prepare those wishes and make an explicit document handoff easier.", source="Synthetic case and handoff implementation: code snapshot 6ec45fe, docs/CARE-SETUP.md. Newer planning preview: separate local uncommitted work, outside the pinned demo.", appendix=False),
    standard("The preparation gap", [
        text(.7, 1.75, 11.8, 1.3, "About 1 in 2", 69, TEAL, True),
        text(.75, 3.05, 11.45, 1.3, "adults aged 45–90 reported none of three\nadvance-care documents.", 30, INK),
        text(.75, 4.78, 11.7, 1.02, "Our question: once wishes exist, can a care team\nlocate the relevant version and passage?", 25, INK),
        text(.75, 6.4, 11.7, .58, "DEAS 2023, ages 45–90, self-report. Advance directive, power of attorney, guardianship directive.\nSource: Sozialbericht 2024, chapter 2.7, pp. 100–101.", 14, GRAY),
    ], "[0:25–0:45, 20 seconds]\nIn the German Ageing Survey, roughly half of people aged 45 to 90 reported none of three advance-care documents in 2023. Our product question continues beyond preparation: how can a clinical team work with the right document when it arrives?", SOURCE_DEAS),
    standard("Two connected jobs", [
        text(.75, 1.65, 5.5, .45, "SEPARATE LOCAL PREVIEW", 18, TEAL, True),
        text(.75, 2.33, 5.5, .7, "Prepare wishes", 34, NAVY, True),
        text(.75, 3.35, 5.25, 1.65, "Guided steps help a person\nstart and review a draft.", 27, INK),
        text(7.0, 1.65, 5.5, .45, "AT THE POINT OF CARE", 18, TEAL, True),
        text(7.0, 2.33, 5.5, .7, "Use the source", 34, NAVY, True),
        text(7.0, 3.35, 5.45, 2.25, "Share an existing version.\nConfirm the case and receipt.\nOpen the original passage.", 25, INK),
        text(.75, 6.25, 11.75, .8, "Current scope: preparation and existing-document handoff remain separate flows.\nToday’s live demo follows the existing-document handoff.", 17, GRAY),
    ], "[0:45–1:15, 30 seconds]\nWe separate two jobs. A person prepares their wishes through guided steps in a separate local preview. The receiving team needs an explicit handoff and a source it can inspect. We will demonstrate the second job with an existing synthetic document. The newer planning preview is outside this demo build, and a newly written draft does not yet reach the clinic.", "Code 6ec45fe. Existing-document flow: /anmelden and clinical application. Latest local /vorsorge guided planning work remains a separate, uncommitted preview and is not part of this pinned demo."),
    standard("Live demo", [
        text(.75, 1.65, 6.1, 2.85, "One version.\nOne confirmed case.\nOne source passage.", 37, NAVY, True),
        text(7.5, 1.83, 5.1, 2.8, "1. Share version 2\n2. Receive and confirm\n3. Open the original PDF\n4. Check the receipt", 25, INK),
        text(.75, 5.45, 11.75, .8, "2 minutes 30 seconds\nErika Berger, synthetic demonstration", 22, TEAL, True),
        text(.75, 6.55, 11.75, .4, "The source supports review. A clinical professional remains responsible for interpretation.", 17, GRAY),
    ], "[1:15–3:45, 150 seconds, includes clicks and pauses]\nErika shares a specific existing version with the clinical destination. We can inspect what she is sharing. In the clinical inbox, the receiving person checks the patient and case before confirming the transfer. Now we open the relevant source passage in the original PDF. That makes the claim inspectable. Finally, the receipt shows which version reached the receiving workflow. Every case here is synthetic. This demonstrates the prototype workflow. We are not connecting a real hospital system or claiming clinical validation.\n\nClick sequence and fallback: RUN_OF_SHOW.md. Keep the 2m30 limit, then return to slide 5.", "Code 6ec45fe. Follow docs/pitch/RUN_OF_SHOW.md for exact routes, labels, case identifiers and fallback. Prepared source links do not demonstrate runtime AI extraction."),
    standard("AI and technical scope", [
        text(.75, 1.6, 3.1, .5, "IMPLEMENTED NOW", 18, TEAL, True),
        text(4.1, 1.58, 8.5, 1.3, "Guided rules and explicit handoff\nPrepared links to source passages", 28, INK),
        text(.75, 3.8, 3.1, .5, "NEXT HYPOTHESIS", 18, TEAL, True),
        text(4.1, 3.72, 8.5, 1.45, "AI proposes extracted passages.\nA person checks the source.", 28, INK),
        text(.75, 6.15, 11.7, .8, "No runtime AI model in this prototype.\nNo live hospital-system integration.", 19, GRAY),
    ], "[3:45–4:30, 45 seconds]\nThe implementation uses guided rules, an explicit handoff, and prepared links into source documents. There is no runtime AI model in this prototype. AI assisted our development. Our next product hypothesis is that a model can propose relevant passages while keeping the original source visible. That would need extraction testing and clinical review before use. We have not demonstrated live hospital integration, physical NFC, or complete production access controls.", "Code 6ec45fe: lib/care-assistant.ts and source-document metadata. Repository source and docs/CARE-SETUP.md. Runtime AI extraction is proposed future work, not a current capability."),
    standard("Commercial hypothesis", [
        text(.75, 1.65, 11.8, 1.6, "Hospitals fund workflow integration\nand ongoing service.", 35, NAVY, True),
        text(.75, 3.78, 3.0, .45, "FIRST USER", 18, TEAL, True),
        text(4.1, 3.72, 8.3, .85, "Clinical teams handling incoming directives", 24, INK),
        text(.75, 5.0, 3.0, .45, "VALIDATION", 18, TEAL, True),
        text(4.1, 4.92, 8.4, .85, "Buyer interviews and a measured workflow pilot", 24, INK),
        text(.75, 6.4, 11.7, .6, "Hypothesis only. We make no validated customer, pricing or cost-savings claim.", 17, GRAY),
    ], "[4:30–5:15, 45 seconds]\nOur commercial starting hypothesis is that hospitals pay for integration and ongoing service. Clinical teams handling incoming directives are the first workflow users to study. We have not validated a buyer, price, or savings estimate. The next step is a partner interview and a small comparative workflow pilot. That would tell us whether the problem is valuable enough to support a purchase.", "Commercial hypothesis proposed for this pitch. No validated customer or pricing evidence in the reviewed repository. Hospital context, if requested, is in appendix A."),
    standard("What this submission includes", [
        text(.75, 1.6, 5.6, .5, "BUILT DURING THE EVENT", 18, TEAL, True),
        text(.75, 2.45, 5.55, 2.3, "Synthetic personal and clinical flows\nDocument version and receipt trail\nPDF source passage view", 25, INK),
        text(7.0, 1.6, 5.6, .5, "PRE-EXISTING INPUTS", 18, TEAL, True),
        text(7.0, 2.45, 5.55, 2.3, "General preparation and prompts\nOfficial templates and published research\nDevelopment tools and libraries", 25, INK),
        text(.75, 5.72, 11.7, .75, "Development used AI assistance. The prototype uses synthetic cases.", 21, TEAL, True),
        text(.75, 6.6, 11.7, .35, "Demo code snapshot: 6ec45fe", 15, GRAY),
    ], "[5:15–5:40, 25 seconds]\nOur event work includes the version handoff, receipt trail, and source passage view. Pre-existing inputs include general preparation, prompts, official templates, published research, libraries, and AI development tools. We disclose those separately. The demo uses synthetic cases. The newer local preparation preview remains separate from this pinned demo.", "Baseline 6ec45fe. Preparation provenance: C:/Hackathon/Vorbereitung. Repository document templates and research retain their original rights and attribution. Team and individual contributions: complete the corresponding submission fields in docs/pitch/README.md before upload."),
    dict(bg=NAVY, boxes=[
        text(.75, .65, 11.8, 1.85, "A clinical partner\nfor the next test", 47, "FFFFFF", True),
        text(.78, 2.85, 11.65, 1.4, "Can staff find the correct passage\nand keep the right version and recipient?", 30, "FFFFFF"),
        text(.78, 4.78, 11.5, 1.15, "One clinical workflow partner\nOne integration partner", 25, LIGHT),
        text(.78, 6.45, 11.5, .55, "Talk to our team after the pitch", 23, LIGHT, True),
    ], note="[5:40–6:00, 20 seconds]\nWe seek a clinical workflow partner and an integration partner. Together, we would compare passage-finding time and version and recipient accuracy against current practice. We do not have those results yet. Talk to our team after the pitch. Thank you.", source="Proposed next validation, not an achieved result or signed partnership. Target measures: passage-finding time, correct version and recipient. Three-minute jury Q&A follows the six-minute pitch.", appendix=False),
    standard("Sources and market context", [
        text(.75, 1.5, 11.6, .5, "Advance-care preparation", 22, TEAL, True),
        text(.75, 2.03, 11.6, .95, "DEAS 2023: roughly half of people aged 45–90 reported none of three\nadvance-care documents. The population and self-report basis matter.", 21, INK),
        text(.75, 3.28, 11.6, .5, "Existing infrastructure", 22, TEAL, True),
        text(.75, 3.81, 11.6, 1.0, "ZVR supports electronic document storage through approved institutions\nfrom 1 October 2026. Our proposed role is the clinical workflow.", 21, INK),
        text(.75, 5.12, 11.6, .5, "Institutional context", 22, TEAL, True),
        text(.75, 5.65, 11.6, .9, "Germany had 1,841 hospitals in 2024. This is an institutional count,\nnot a market-size estimate or a count of buyers.", 21, INK),
    ], "Appendix A. Sources checked on 6 November 2026. The DEAS statistic must retain its age range and survey basis. Do not multiply hospital count by invented prices. ZVR changed on 1 October 2026, so describing it as a metadata-only register would now be incorrect.", f"DZA, Sozialbericht 2024, chapter 2.7, pp.100–101: {SOURCE_DEAS}\nBundesnotarkammer: {SOURCE_ZVR}\nDestatis, hospitals 2024: {SOURCE_HOSPITALS}", appendix=True),
    standard("Prototype boundaries", [
        text(.75, 1.55, 5.6, .5, "REPOSITORY CAPABILITIES", 18, TEAL, True),
        text(.75, 2.25, 5.6, 3.35, "Synthetic document handoff\nExplicit patient and case confirmation\nPrepared PDF source links\nDocument version and receipt trail", 24, INK),
        text(7.0, 1.55, 5.55, .5, "STILL TO VALIDATE", 18, TEAL, True),
        text(7.0, 2.25, 5.55, 3.35, "Runtime AI extraction\nLive NFC and hospital integration\nProduction access controls\nNew planning draft in the clinic\nClinical and legal suitability", 24, INK),
        text(.75, 6.2, 11.65, .85, "Historical repository report at 6ec45fe: 20 scenario tests passed.\nThat report does not establish clinical effectiveness or deployment readiness.", 17, GRAY),
    ], "Appendix B. Historical tests describe software scenarios, not clinical outcomes. The 20-test result is a repository report, not a new result from this presentation task. No clinical, legal, safety, cloud authorization or live integration claim follows from it. Current launch conditions and exact limitations are in CARE-SETUP.md and RUN_OF_SHOW.md.", "Code 6ec45fe, docs/CARE-SETUP.md. Read the launch runbook before presenting. Historical test evidence remains qualified; local newer consumer work is outside this pinned demo.", appendix=True),
    standard("Questions we are ready to test", [
        text(.75, 1.52, 3.35, .5, "Who pays?", 23, TEAL, True),
        text(4.35, 1.49, 8.1, .8, "Hospital or provider group, subject to buyer interviews.", 22, INK),
        text(.75, 2.67, 3.35, .9, "Why alongside\nePA and ZVR?", 23, TEAL, True),
        text(4.35, 2.64, 8.1, 1.1, "Case confirmation and access to the original source.\nIntegration remains unproven.", 22, INK),
        text(.75, 4.06, 3.35, .6, "What is success?", 23, TEAL, True),
        text(4.35, 4.03, 8.1, 1.1, "Compare time to find a passage, version accuracy\nand recipient accuracy with current practice.", 22, INK),
        text(.75, 5.53, 3.35, .9, "What does AI\ndo today?", 23, TEAL, True),
        text(4.35, 5.5, 8.1, 1.1, "The app uses rules. AI assisted development.\nRuntime extraction is future work.", 22, INK),
    ], "Appendix C. These answers distinguish implementation from hypotheses. Expand only with evidence available to the team. Follow the Q&A document for further questions about privacy, legal suitability, integration and product boundaries.", "Repository snapshot 6ec45fe and docs/pitch/EVIDENCE_QA.md. Business and pilot statements are proposed hypotheses, not validated findings.", appendix=True),
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
