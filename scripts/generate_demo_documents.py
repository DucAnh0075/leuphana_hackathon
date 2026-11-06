"""Generate original synthetic KIS demo PDFs from the shared UI dataset.
Dependencies: pip install reportlab pymupdf
Run from repository root: python scripts/generate_demo_documents.py
All pages are fictional, unsigned demonstration material, never legal forms.
"""
from pathlib import Path
import json, re, html
from urllib.parse import unquote
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import pymupdf as fitz

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / "lib/demo-patients.json").read_text(encoding="utf-8"))
OUT = ROOT / "public/demo-documents"
OUT.mkdir(parents=True, exist_ok=True)
RENDERS = ROOT / "test-results/pdf-review"
RENDERS.mkdir(parents=True, exist_ok=True)
font = next((p for p in [Path("C:/Windows/Fonts/arial.ttf"), Path("/mnt/c/Windows/Fonts/arial.ttf")] if p.exists()), None)
bold = next((p for p in [Path("C:/Windows/Fonts/arialbd.ttf"), Path("/mnt/c/Windows/Fonts/arialbd.ttf")] if p.exists()), None)
if font and bold:
    pdfmetrics.registerFont(TTFont("DemoSans", str(font)))
    pdfmetrics.registerFont(TTFont("DemoBold", str(bold)))
    regular, strong = "DemoSans", "DemoBold"
else:
    regular, strong = "Helvetica", "Helvetica-Bold"
W, H = 595.28, 841.89
style = ParagraphStyle("body", fontName=regular, fontSize=11, leading=17, textColor=HexColor("#263b4b"))
def text_block(c, text, y, heading=False):
    st = ParagraphStyle("heading", parent=style, fontName=strong, fontSize=12, leading=17) if heading else style
    p = Paragraph(html.escape(text), st)
    _, height = p.wrap(W-100, H)
    assert y-height > 90, "Page content would overlap footer"
    p.drawOn(c, 50, y-height)
    return y-height-13

count = 0
for patient in DATA["patients"]:
    for doc in patient["documents"]:
        if not doc["url"].startswith("/demo-documents/"):
            continue
        target = OUT / (doc["id"] + ".pdf")
        c = canvas.Canvas(str(target), pagesize=(W,H), invariant=1)
        c.setTitle(doc["title"] + " - " + patient["first"] + " " + patient["name"] + " - Synthetische Demo")
        c.setAuthor("KIS-Demonstrator / synthetischer Datensatz")
        for number, page in enumerate(doc["pages"], 1):
            c.setFillColor(HexColor("#294e68"))
            c.rect(0,H-48,W,48,fill=1,stroke=0)
            c.setFillColor(HexColor("#ffffff")); c.setFont(strong,10)
            c.drawString(50,H-29,"SYNTHETISCHE DEMO / KEIN RECHTSWIRKSAMES DOKUMENT")
            c.setFillColor(HexColor("#203b4f")); c.setFont(strong,19)
            c.drawString(50,H-88,doc["title"].replace("–","-"))
            c.setFont(regular,10)
            c.drawString(50,H-110,patient["first"]+" "+patient["name"]+" | geb. "+patient["birth"])
            c.drawString(50,H-127,"Fall "+patient["id"]+" | Dokumentdatum "+doc["date"]+" | "+doc["id"])
            c.setStrokeColor(HexColor("#b8c9d4")); c.line(50,H-143,W-50,H-143)
            y = text_block(c,page["heading"],H-165,True)
            for section in page["sections"]:
                y = text_block(c,section["title"],y-10,True)
                y = text_block(c,section["text"],y)
            c.setFillColor(HexColor("#536775")); c.setFont(regular,9)
            c.drawString(50,64,"Alle Personen, Erklärungen und Kontaktdaten sind erfunden. Keine Unterschrift.")
            c.drawString(50,49,"Nur zur Vorführung der Informationsverknüpfung im Krankenhausinformationssystem.")
            c.drawRightString(W-50,30,f"Seite {number} von {len(doc['pages'])}")
            c.showPage()
        c.save()
        count += 1

# Validate every source link against the actual generated PDF page, not just JSON.
norm = lambda s: re.sub(r"\s+", " ", s.replace("­", "")).strip()
checked = 0
pages_checked = 0
for patient in DATA["patients"]:
    docs = {doc["id"]: doc for doc in patient["documents"]}
    for doc in patient["documents"]:
        pdf = fitz.open(ROOT / "public" / unquote(doc["url"].lstrip("/")))
        assert len(pdf) == len(doc["pages"])
        for page in pdf:
            pages_checked += 1
            for word in page.get_text("words") if doc["url"].startswith("/demo-documents/") else []:
                assert word[0] >= 0 and word[2] <= W+1 and word[1] >= 0 and word[3] <= H+1, (doc["id"],word)
        if patient["id"] == "26004182":
            for n, page in enumerate(pdf):
                page.get_pixmap(matrix=fitz.Matrix(1.2,1.2)).save(RENDERS / f"{doc['id']}-page-{n+1}.png")
        pdf.close()
    for fact in patient["facts"]:
        assert fact["documentId"] in docs
        pdf = fitz.open(ROOT / "public" / unquote(docs[fact["documentId"]]["url"].lstrip("/")))
        page_text = norm(pdf[fact["page"]-1].get_text())
        assert norm(fact["quote"]) in page_text, (patient["id"],fact["id"],"Quote missing")
        assert norm(fact["section"]) in page_text, (patient["id"],fact["id"],"Section missing")
        pdf.close()
        checked += 1
print(json.dumps({"documents":count,"pages":pages_checked,"verifiedSourceLinks":checked,"reviewImages":str(RENDERS)},ensure_ascii=False))
