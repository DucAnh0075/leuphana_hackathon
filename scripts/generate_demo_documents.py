"""Create the synthetic KIS document set from canonical patient data and official sources.
Developer dependencies: pip install reportlab pymupdf pypdf
Run: python scripts/generate_demo_documents.py
Official forms stay editable and unsigned. Every page is visibly synthetic.
"""
from pathlib import Path
from io import BytesIO
import hashlib, html, json, re
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pypdf import PdfReader, PdfWriter
from pypdf.generic import NameObject, TextStringObject, NumberObject
import pymupdf as fitz

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / "lib/demo-patients.json").read_text(encoding="utf-8"))
OUT = ROOT / "public/demo-documents"
RENDERS = ROOT / "test-results/pdf-review"
POWER_SOURCE = ROOT / "public/pdfs/Vorsorgevollmacht.pdf"
DIRECTIVE_SOURCE = ROOT / "public/templates/patientenverfuegung-textbausteine.pdf"
SOURCE_MANIFEST = ROOT / "public/templates/sources.json"
OUT.mkdir(parents=True, exist_ok=True)
RENDERS.mkdir(parents=True, exist_ok=True)
for source in [POWER_SOURCE, DIRECTIVE_SOURCE]:
    assert source.exists(), f"Required versioned template missing: {source}"
manifest = json.loads(SOURCE_MANIFEST.read_text(encoding="utf-8"))
for source in manifest["sources"]:
    actual = ROOT / "public" / source["url"].lstrip("/")
    assert hashlib.sha256(actual.read_bytes()).hexdigest() == source["sha256"], "Template changed; review field/section mapping before regeneration."

font = Path("C:/Windows/Fonts/arial.ttf")
bold = Path("C:/Windows/Fonts/arialbd.ttf")
if font.exists():
    pdfmetrics.registerFont(TTFont("DemoSans", str(font)))
    pdfmetrics.registerFont(TTFont("DemoBold", str(bold)))
    regular, strong = "DemoSans", "DemoBold"
else:
    regular, strong = "Helvetica", "Helvetica-Bold"
W, H = 595.28, 841.89
style = ParagraphStyle("body", fontName=regular, fontSize=10.5, leading=15, textColor=HexColor("#263b4b"))
source_style = ParagraphStyle("source", parent=style, fontSize=8.5, leading=11, textColor=HexColor("#227568"))
heading_style = ParagraphStyle("heading", parent=style, fontName=strong, fontSize=11.5, leading=16)
norm = lambda text: re.sub(r"\s+", " ", text.replace("\u00ad", "").replace("\b", "")).strip()

def block(c, text, y, kind="body"):
    st = heading_style if kind == "heading" else source_style if kind == "source" else style
    p = Paragraph(html.escape(text), st)
    _, height = p.wrap(W-100, H)
    assert y-height > 100, ("Content would overlap footer", text[:70])
    p.drawOn(c, 50, y-height)
    return y-height-(8 if kind == "source" else 11)

def generate_composed(patient, doc):
    c = canvas.Canvas(str(OUT / (doc["id"]+".pdf")), pagesize=(W,H), invariant=1)
    c.setTitle(doc["title"]+" - "+patient["first"]+" "+patient["name"]+" - Synthetische Demo")
    c.setAuthor("KIS-Demonstrator / synthetischer Datensatz")
    official = doc["provenance"]["kind"] == "adapted-blocks"
    for number, page in enumerate(doc["pages"], 1):
        c.setFillColor(HexColor("#146b62" if official else "#294e68"))
        c.rect(0,H-38,W,38,fill=1,stroke=0)
        c.setFillColor(HexColor("#ffffff")); c.setFont(strong,9)
        c.drawString(50,H-24,"SYNTHETISCHE DEMO / KEIN RECHTSWIRKSAMES DOKUMENT")
        c.setFillColor(HexColor("#203b4f")); c.setFont(strong,18)
        c.drawString(50,H-74,doc["title"].replace("–","-"))
        c.setFont(regular,10)
        c.drawString(50,H-95,patient["first"]+" "+patient["name"]+" | geb. "+patient["birth"])
        c.drawString(50,H-111,"Fall "+patient["id"]+" | Dokumentdatum "+doc["date"])
        c.setFont(regular,8.5)
        c.drawString(50,H-128,"Auswahl aus BMJ-Textbausteinen (2023); persönliche Angaben und Auswahl erfunden." if official else "Eigenständig verfasster synthetischer Demotext.")
        c.setStrokeColor(HexColor("#b8c9d4")); c.line(50,H-139,W-50,H-139)
        y = block(c,page["heading"],H-157,"heading")
        for section in page["sections"]:
            y = block(c,section["title"],y-4,"heading")
            y = block(c,section["text"],y)
            if "templatePage" in section:
                y = block(c,f"Vorlage: BMJ-Textbausteine, S. {section['templatePage']}, Abschnitt {section['templateSection']}.",y,"source")
        c.setFillColor(HexColor("#536775")); c.setFont(regular,8.5)
        c.drawString(50,72,"Synthetisch erstellt, nicht unterschrieben. Keine ärztliche oder rechtliche Freigabe.")
        c.drawString(50,58,"Vorlagenquelle: bereitgestellte BMJ-Textbausteine, Fassung Januar 2023." if official else "Alle Personen, Erklärungen und Kontaktdaten sind erfunden.")
        c.drawString(50,44,"Nur zur Vorführung der Informationsverknüpfung im Krankenhausinformationssystem.")
        c.drawRightString(W-50,27,f"Seite {number} von {len(doc['pages'])}")
        c.showPage()
    c.save()

def power_values(patient, doc):
    values = {}
    source_fields = PdfReader(POWER_SOURCE).get_fields()
    for name, field in source_fields.items():
        if field.get("/FT") == "/Tx":
            values[name] = ""
    # Every separate yes/no pair has exactly one selection. Healthcare, high-risk
    # healthcare and a non-binding care nominee are selected; all other grants are not.
    affirmative = {1, 3, 43}
    for first in range(1,47,2):
        yes = first in affirmative
        values[f"Kontrollkästchen {first}"] = "/Ja" if yes else "/Off"
        values[f"Kontrollkästchen {first+1}"] = "/Off" if yes else "/Ja"
    fd = doc["formData"]
    values.update({
        "Textfeld 37":patient["first"]+" "+patient["name"],
        "Textfeld 38":patient["birth"],
        "Textfeld 39":"Demostadt (synthetisch)",
        "Textfeld 48":fd["address"],
        "Textfeld 41":"+49 (0)000 100 "+patient["id"][-2:]+" (Demorufnummer)",
        "Textfeld 42":patient["contact"]["name"],
        "Textfeld 43":fd["representativeBirth"],
        "Textfeld 44":"Beispielstadt (synthetisch)",
        "Textfeld 45":fd["representativeAddress"],
        "Textfeld 46":patient["contact"]["phone"]+" (Demorufnummer)",
        "Textfeld 1":"Benannte Person: "+patient["contact"]["name"]+". Befugnisse gemäß gesetzter Auswahl.",
        "Textfeld 2":"Auskunft und Akteneinsicht nur zum aktuellen stationären Aufenthalt.",
        "Textfeld 3":"Bis 31.12.2026; keine Weitergabe an Dritte. Weitere Bedingungen auf Seite 4.",
        "Textfeld 5":"Vermögensangelegenheiten vollständig ausgeschlossen.",
        "Textfeld 8":fd["condition"]+"\n"+fd["restriction"]+"\nDie Originalurkunde müsste im Besitz der bevollmächtigten Person sein und vorgelegt werden.\nSynthetische Demo: nicht unterschrieben; keine rechtswirksame Bevollmächtigung.",
        "Textfeld 9":"Demostadt, "+doc["date"],
        "Textfeld 11":"Demostadt, "+doc["date"],
    })
    return values

def generate_power(patient, doc):
    reader = PdfReader(POWER_SOURCE)
    source_fields = reader.get_fields()
    canonical = {ref.idnum for ref in reader.trailer["/Root"]["/AcroForm"]["/Fields"]}
    assert len(source_fields)==69
    for page in reader.pages:
        for ref in page.get("/Annots", []):
            field = ref.get_object()
            if field.get("/Subtype") == "/Widget":
                assert ref.idnum in canonical and not field.get("/Parent"), "Ambiguous or orphaned source widget."
    writer = PdfWriter()
    writer.clone_document_from_reader(reader)
    for page in writer.pages:
        for ref in page.get("/Annots", []):
            field = ref.get_object()
            if field.get("/FT") == "/Tx":
                field[NameObject("/DA")] = TextStringObject("/Helv 9 Tf 0 0.26 0.34 rg")
                if field.get("/T") == "Textfeld 8":
                    field[NameObject("/Ff")] = NumberObject(int(field.get("/Ff",0)) | 4096)
    values = power_values(patient,doc)
    assert not (set(values)-set(source_fields))
    writer.update_page_form_field_values(None,values,auto_regenerate=False)
    for number, page in enumerate(writer.pages,1):
        # Top 23pt are blank except a decorative bar in the source. No source text
        # or fields are hidden. Context remains visible on every individual page.
        overlay = BytesIO()
        c = canvas.Canvas(overlay,pagesize=(float(page.mediabox.width),float(page.mediabox.height)),invariant=1)
        h = float(page.mediabox.height)
        c.setFillColor(HexColor("#e9f3ef")); c.rect(0,h-25,float(page.mediabox.width),25,fill=1,stroke=0)
        c.setFillColor(HexColor("#17685e")); c.setFont(strong,7.4)
        c.drawString(44,h-10,"SYNTHETISCHE DEMO - NICHT RECHTSWIRKSAM - OHNE UNTERSCHRIFT")
        c.setFont(regular,7.4)
        c.drawString(44,h-21,f"{patient['first']} {patient['name']} | Fall {patient['id']} | Benannte Person: {patient['contact']['name']}")
        c.save(); overlay.seek(0)
        page.merge_page(PdfReader(overlay).pages[0])
    writer.add_metadata({"/Title":doc["title"]+" - "+patient["first"]+" "+patient["name"]+" - Synthetische Demo","/Author":"BMJ-Formular 2023 / synthetisch ausgefüllt für KIS-Demo"})
    # Deterministic identifiers also make reviewable regenerated diffs possible.
    seed = hashlib.sha256(json.dumps(values,sort_keys=True,ensure_ascii=False).encode()).digest()[:16]
    from pypdf.generic import ArrayObject, ByteStringObject
    writer._ID = ArrayObject([ByteStringObject(seed),ByteStringObject(seed)])
    with (OUT/(doc["id"]+".pdf")).open("wb") as stream:
        writer.write(stream)
    return values

field_checks = 0
def validate_power(patient,doc,expected):
    global field_checks
    reader = PdfReader(OUT/(doc["id"]+".pdf"))
    fields = reader.get_fields()
    assert len(fields)==69 and len(reader.pages)==4
    for name,value in expected.items():
        assert str(fields[name].get("/V",""))==value, (doc["id"],name,"Canonical value mismatch")
    signatures = [f for f in fields.values() if f.get("/FT")=="/Sig"]
    assert len(signatures)==2 and all(not f.get("/V") for f in signatures)
    for first in range(1,47,2):
        pair = [str(fields[f"Kontrollkästchen {i}"].get("/V")) for i in [first,first+1]]
        assert pair.count("/Ja")==1 and pair.count("/Off")==1, ("Contradictory selection",doc["id"],first)
    for page in reader.pages:
        for ref in page["/Annots"]:
            field=ref.get_object(); name=field.get("/T")
            if name not in expected: continue
            assert str(field.get("/V",""))==expected[name],(doc["id"],name,"Widget value mismatch")
            ap=field.get("/AP",{}).get("/N")
            assert ap is not None,(doc["id"],name,"Missing appearance")
            if field.get("/FT")=="/Btn":
                state=field.get("/AS")
                assert str(state)==expected[name]
                assert state in ap
                assert len(ap[state].get_object().get_data())>0
            else:
                assert len(ap.get_object().get_data())>0
            field_checks += 1
    assert fields["Textfeld 37"]["/V"]==patient["first"]+" "+patient["name"]
    assert fields["Textfeld 42"]["/V"]==patient["contact"]["name"]

count = 0
for patient in DATA["patients"]:
    for doc in patient["documents"]:
        if doc["provenance"]["kind"]=="original-form":
            values=generate_power(patient,doc)
            validate_power(patient,doc,values)
        else:
            generate_composed(patient,doc)
        count+=1

checked=0; pages_checked=0; template_refs=0
template=fitz.open(DIRECTIVE_SOURCE)
for patient in DATA["patients"]:
    docs={d["id"]:d for d in patient["documents"]}
    for doc in patient["documents"]:
        with fitz.open(OUT/(doc["id"]+".pdf")) as pdf:
            assert len(pdf)==len(doc["pages"])
            for page in pdf:
                pages_checked+=1
                page_text=norm(page.get_text())
                assert "SYNTHETISCHE DEMO" in page_text
                assert patient["first"]+" "+patient["name"] in page_text
                for word in page.get_text("words"):
                    assert word[0]>=-1 and word[2]<=page.rect.width+1 and word[1]>=-1 and word[3]<=page.rect.height+1,(doc["id"],word)
            if patient["id"] in ("26004182","26004179"):
                for n,page in enumerate(pdf):
                    page.get_pixmap(matrix=fitz.Matrix(1.2,1.2)).save(RENDERS/f"{doc['id']}-page-{n+1}.png")
    for fact in patient["facts"]+patient["carePreferences"]:
        assert fact["documentId"] in docs
        with fitz.open(OUT/(fact["documentId"]+".pdf")) as pdf:
            page_text=norm(pdf[fact["page"]-1].get_text())
            assert norm(fact["quote"]) in page_text,(patient["id"],fact["id"],"Quote missing")
            assert norm(fact["section"]) in page_text,(patient["id"],fact["id"],"Section missing")
        if "templatePage" in fact:
            source_text=norm(template[fact["templatePage"]-1].get_text())
            assert norm(fact["templateSection"]) in source_text,("Source section missing",fact["id"])
            template_refs+=1
        checked+=1
template.close()
print(json.dumps({"documents":count,"pages":pages_checked,"verifiedSourceLinks":checked,"verifiedTemplateSections":template_refs,"verifiedFieldWidgets":field_checks,"reviewImages":str(RENDERS)},ensure_ascii=False))
