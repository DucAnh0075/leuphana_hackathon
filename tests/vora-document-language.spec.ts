import { test, expect } from "@playwright/test";
import { DOCUMENTS } from "../lib/vora";
import { getLocalizedDocuments, displayDocumentChoice } from "../lib/vora-document-language";
import { checkDocumentForm, documentTemplate } from "../lib/vora-document-templates";

test("all 40 public document blocks have German meaning without mutating IDs or stored choices", () => {
  const localized = getLocalizedDocuments("de");
  expect(localized.flatMap(doc => doc.modules)).toHaveLength(40);
  localized.forEach((doc, index) => {
    expect(doc.id).toBe(DOCUMENTS[index].id);
    doc.modules.forEach((block, position) => {
      const original = DOCUMENTS[index].modules[position];
      expect(block.id).toBe(original.id);
      expect(block.title).not.toBe(original.title);
      expect(block.purpose).not.toBe(original.purpose);
      expect(block.prompt).not.toBe(original.prompt);
      if (original.caution) expect(block.caution).toBeTruthy();
      expect(block.options).toEqual(original.options);
    });
  });
  expect(displayDocumentChoice("Include this authority", "de")).toBe("Diese Befugnis aufnehmen");
  expect(getLocalizedDocuments("en")).toEqual(DOCUMENTS);
});
test("language selects an actual bilingual original and never invents an English patient directive", () => {
  expect(documentTemplate("power", "en").url).toContain("Vorsorgevollmacht_deutsch_englisch.pdf");
  expect(documentTemplate("guardian", "en").url).toContain("Betreuungsverfuegung_deutsch_englisch.pdf");
  expect(documentTemplate("directive", "en").language).toBe("de");
  expect(documentTemplate("directive", "en").note).toContain("does not supply an official English translation");
});
test("notary form checks distinguish everyday, certification, deed and unresolved scopes", () => {
  expect(checkDocumentForm("power", "ordinary").level).toBe("ordinary");
  expect(checkDocumentForm("power", "land").level).toBe("certification");
  expect(checkDocumentForm("power", "registry").level).toBe("certification");
  expect(checkDocumentForm("power", "irrevocable-land").level).toBe("deed");
  expect(checkDocumentForm("power", "consumer-loan").level).toBe("deed");
  expect(checkDocumentForm("power", "consumer-loan").en).toContain("specifically negotiated loan");
  expect(checkDocumentForm("power", "unknown").level).toBe("clarify");
  expect(checkDocumentForm("power", "complex").level).toBe("clarify");
  expect(checkDocumentForm("directive", "land").level).toBe("ordinary");
  expect(checkDocumentForm("guardian", "consumer-loan").level).toBe("ordinary");
});
