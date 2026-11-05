"""Generate the versioned, synthetic care-handoff PDF from one canonical amendment.
The three existing directive pages remain unchanged; one clearly labelled addition
is appended. Run: python scripts/generate_care_revision.py
Uses the PDF tooling already needed by generate_demo_documents.py.
"""
from pathlib import Path
from io import BytesIO
import hashlib
import html
import json
import re

import pymupdf as fitz
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT = Path(__file__).resolve().parents[1]
revision = json.loads((ROOT / "lib/demo-care-revision.json").read_text(encoding="utf-8"))
dataset = json.loads((ROOT / "lib/demo-patients.json").read_text(encoding="utf-8"))
patient = next(p for p in dataset["patients"] if p["id"] == revision["personId"])
original = next(d for d in patient["documents"] if d["id"] == revision["sourceId"])
source = ROOT / "public" / original["url"].lstrip("/")
target = ROOT / "public" / revision["fileUrl"].lstrip("/")
before = hashlib.sha256(source.read_bytes()).hexdigest()
reader = PdfReader(source)
assert len(reader.pages) + 1 == revision["pageCount"]
for name, filename in [("Care", "arial.ttf"), ("CareBold", "arialbd.ttf")]:
    font = Path("C:/Windows/Fonts") / filename
    if font.exists():
        pdfmetrics.registerFont(TTFont(name, str(font)))
regular = "Care" if "Care" in pdfmetrics.getRegisteredFontNames() else "Helvetica"
bold = "CareBold" if "CareBold" in pdfmetrics.getRegisteredFontNames() else "Helvetica-Bold"
buffer = BytesIO()
c = canvas.Canvas(buffer, pagesize=(595.28, 841.89), invariant=1)
c.setFillColor(HexColor("#173c46"))
c.rect(0, 797, 595.28, 45, fill=1, stroke=0)
c.setFont(bold, 9)
c.setFillColor(HexColor("#ffffff"))
c.drawString(48, 815, "SYNTHETISCHE DEMO / NICHT UNTERSCHRIEBEN")
body = ParagraphStyle("body", fontName=regular, fontSize=11, leading=17, textColor=HexColor("#173c46"))
heading = ParagraphStyle("heading", parent=body, fontName=bold, fontSize=20, leading=25)
small = ParagraphStyle("small", parent=body, fontSize=9, leading=14, textColor=HexColor("#526773"))

def block(text, y, style=body):
    paragraph = Paragraph(html.escape(text), style)
    _, height = paragraph.wrap(499, 700)
    assert y-height > 100, "Amendment exceeds content area"
    paragraph.drawOn(c, 48, y-height)
    return y-height-18

y = block("Ergänzung zur Patientenverfügung", 756, heading)
y = block(f"{patient['first']} {patient['name']} | geb. {patient['birth']}", y)
y = block(f"Fassung {revision['version']} | Ergänzungsdatum {revision['date']} | Fall {patient['id']}", y, small)
c.setStrokeColor(HexColor("#b7c9d0"))
c.line(48, y+2, 547, y+2)
y = block(revision["evidence"]["section"], y-22, ParagraphStyle("subheading", parent=body, fontName=bold, fontSize=14, leading=19))
y = block(revision["evidence"]["quote"], y)
y = block(revision["evidence"]["condition"], y)
for exclusion in revision["evidence"]["exclusions"]:
    y = block(exclusion, y)
y = block("Die drei vorausgehenden Seiten werden unverändert aus der bisherigen synthetischen Fassung übernommen. Diese Ergänzung verändert keine dort dargestellten Behandlungswünsche.", y-12, small)
y = block("Diese Seite wurde für den Demonstrator verfasst. Sie ist kein Textbaustein der BMJ-Vorlage. Alle Personen und Erklärungen sind erfunden.", y, small)
c.setStrokeColor(HexColor("#b7c9d0"))
c.line(48, 98, 547, 98)
c.setFillColor(HexColor("#526773"))
c.setFont(regular, 8.5)
c.drawString(48, 78, "Keine rechtswirksame Erklärung; keine ärztliche oder rechtliche Freigabe.")
c.drawString(48, 62, "Die vorherige Fassung bleibt für den Versionsvergleich erhalten.")
c.drawRightString(547, 39, "Ergänzungsseite 4 von 4")
c.save()
buffer.seek(0)
writer = PdfWriter()
writer.append(reader)
writer.append(PdfReader(buffer))
writer.add_metadata({"/Title": "Patientenverfügung - Erika Berger - Fassung 2 - Synthetische Demo", "/Author": "Vorsorge-Demonstrator"})
with target.open("wb") as output:
    writer.write(output)
assert hashlib.sha256(source.read_bytes()).hexdigest() == before
result = PdfReader(target)
normalize = lambda value: re.sub(r"\s+", " ", value).strip()
assert len(result.pages) == revision["pageCount"]
assert normalize(revision["evidence"]["quote"]) in normalize(result.pages[3].extract_text())
for index in range(3):
    assert normalize(reader.pages[index].extract_text()) == normalize(result.pages[index].extract_text())
renders = ROOT / "test-results" / "care-pdf-review"
renders.mkdir(parents=True, exist_ok=True)
document = fitz.open(target)
for number in range(len(document)):
    document[number].get_pixmap(matrix=fitz.Matrix(1.4, 1.4)).save(renders / f"directive-v2-page-{number+1}.png")
print(json.dumps({"pages": len(result.pages), "originalUnchanged": True, "evidenceMatched": True, "file": str(target)}, ensure_ascii=False))
