"""Fill official templates with fictional demo data using PyMuPDF only."""
import argparse
from pathlib import Path
import pymupdf

ROOT = Path(__file__).resolve().parents[1]
FORMS = [
    ("public/pdfs/Vorsorgevollmacht.pdf", "Vorsorgevollmacht.pdf", {
        "Textfeld 37": "Becker, Henri", "Textfeld 38": "22.08.1952",
        "Textfeld 39": "Lüneburg", "Textfeld 48": "Am Sande 1, 21335 Lüneburg (fiktive Adresse)",
        "Textfeld 41": "+49 (0)000 201 00 (Demonummer)", "Textfeld 42": "Becker, Martin (Sohn)",
        "Textfeld 43": "14.03.1979", "Textfeld 44": "Lüneburg",
        "Textfeld 45": "Am Sande 3, 21335 Lüneburg (fiktive Adresse)",
        "Textfeld 46": "+49 (0)000 201 01 (Demonummer)",
        "Textfeld 6": "Vermögensangelegenheiten und Bankgeschäfte",
        "Textfeld 8": "Die Auflösung meiner Wohnung und meine finanziellen Angelegenheiten soll die bevollmächtigte Person nicht übernehmen.",
        "Textfeld 9": "Lüneburg, 12.06.2025", "Textfeld 11": "Lüneburg, 12.06.2025",
    }, [1, 3, 5, 7, 9, 12, 14, 15, 18, 20, 21, 23, 26, 28, 30, 32, 34, 36, 37, 39, 42, 43, 45]),
    ("content/pdfs/Patientenverfuegung_Vorlage.pdf", "Patientenverfuegung.pdf", {
        "Name 3": "Henri Becker", "Geburtsdatum 4": "22.08.1952",
        "Adresse 6": "Am Sande 1, 21335 Lüneburg (fiktive Adresse)",
        "Unterstützung durch 2": "meinen Sohn Martin Becker",
        "Name 5": "Dr. med. Clara Wendt (fiktiv)",
        "Adresse  4": "Bardowicker Straße 10, 21335 Lüneburg", "Telefon 4": "+49 (0)000 201 99",
        "Name, Vorname, Geburtsdatum 9": "Becker, Martin, 14.03.1979",
        "Adresse, Telefon, E-Mail 6": "Am Sande 3, 21335 Lüneburg · +49 (0)000 201 01 (Demonummer)",
        "Ort, Datum 8": "Lüneburg, 18.08.2025",
    }, [128, 127, 124, 123, 122, 119, 118, 116, 113]),
]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--list", action="store_true", help="List all template widgets without writing outputs")
    args = parser.parse_args()
    for template, output, values, numbers in FORMS:
        with pymupdf.open(ROOT / template) as doc:
            checked = {f"Kontrollkästchen {n}" for n in numbers}
            names = set()
            for page in doc:
                for widget in page.widgets():
                    if args.list:
                        print(template, page.number + 1, widget.field_type_string, repr(widget.field_name), widget.rect)
                        continue
                    names.add(widget.field_name)
                    if widget.field_type == pymupdf.PDF_WIDGET_TYPE_CHECKBOX:
                        widget.field_value = widget.on_state() if widget.field_name in checked else "Off"
                    elif widget.field_name in values:
                        widget.field_value = values[widget.field_name]
                    else:
                        continue
                    widget.update()
            if args.list:
                continue
            assert not (values.keys() | checked) - names, f"Missing fields in {template}: {(values.keys() | checked) - names}"
            doc.bake()
            for page in doc:
                page.insert_font(fontname="demo", fontbuffer=pymupdf.Font("helv").buffer)
                result = page.insert_textbox((120, 8, 420, 22), "SYNTHETISCHE DEMO – Henri Becker, fiktive Person, keine Unterschrift", fontsize=7, fontname="demo", color=(0.45, 0.45, 0.45), align=0)
                assert result >= 0, "Demo stamp does not fit"
            target = ROOT / "public/card-documents" / output
            target.parent.mkdir(parents=True, exist_ok=True)
            doc.save(target, garbage=4, deflate=True)
        with pymupdf.open(target) as pdf:
            print(f"{output}: {len(pdf)} pages")
            if output == "Vorsorgevollmacht.pdf":
                assert "Martin" in pdf[0].get_text() and "Henri" in pdf[0].get_text()


if __name__ == "__main__":
    main()
