import { PREVENTION } from "./vora";
import type { VoraLocale } from "./vora-language";
export const preventionDetails: Record<string, [string, string, string, string, string]> = {
 "checkup-young": ["Gesundheits-Check-up", "Einmal von 18 bis 34 Jahren", "Anamnese und körperliche Untersuchung; Labortests abhängig von Risikofaktoren.", "Hausarztpraxis", "General practice"],
 checkup: ["Gesundheits-Check-up", "Ab 35 alle 3 Jahre", "Gesundheitsuntersuchung. Ab 35 zusätzlich einmaliges Screening auf Hepatitis B und C.", "Hausarztpraxis", "General practice"],
 skin: ["Hautkrebs-Früherkennung", "Ab 35 alle 2 Jahre", "Untersuchung der gesamten Haut durch eine dafür qualifizierte Ärztin oder einen Arzt.", "Hautarztpraxis oder qualifizierte Hausarztpraxis", "Dermatology or qualified general practice"],
 "cervical-young": ["Gebärmutterhalskrebs-Früherkennung", "Von 20 bis 34 jährlich", "Zytologischer Abstrich (Pap-Test) im gesetzlichen Früherkennungsprogramm.", "Frauenarztpraxis", "Gynaecology practice"],
 cervical: ["Gebärmutterhalskrebs-Früherkennung", "Ab 35 alle 3 Jahre", "Kombination aus HPV-Test und Zytologie. Die jährliche klinische gynäkologische Untersuchung ist ein eigenes Angebot.", "Frauenarztpraxis", "Gynaecology practice"],
 breast: ["Klinische Brustuntersuchung", "Ab 30 jährlich", "Abtasten der Brust und regionalen Lymphknoten sowie Anleitung zur Selbstbeobachtung.", "Frauenarztpraxis", "Gynaecology practice"],
 mammography: ["Mammographie-Screening", "Von 50 bis 75 alle 2 Jahre", "Organisiertes Röntgen-Screening. Die Programmeinladung informiert über möglichen Nutzen und mögliche Nachteile.", "Mammographie-Screening-Einheit", "Mammography screening unit"],
 bowel: ["Darmkrebs-Früherkennung", "Ab 50: Stuhltest alle 2 Jahre oder Darmspiegelung", "Wahl zwischen immunologischem Stuhltest und zwei Früherkennungs-Darmspiegelungen mit mindestens 10 Jahren Abstand.", "Hausarztpraxis; Darmspiegelung in einer berechtigten gastroenterologischen Praxis", "General practice; colonoscopy at an authorised gastroenterology practice"],
 prostate: ["Prostata- und Genitaluntersuchung", "Ab 45 jährlich", "Gesetzliches Angebot mit Tastuntersuchung. Ein PSA-Bluttest gehört nicht zu dieser Standardleistung.", "Hausarztpraxis oder Urologie", "General practice or urology"],
 aorta: ["Bauchaortenaneurysma-Screening", "Für Männer ab 65 einmalig", "Ultraschalluntersuchung der Bauchschlagader im gesetzlichen Früherkennungsprogramm.", "Praxis mit entsprechender Ultraschallberechtigung", "A practice authorised for this ultrasound examination"],
};
export function getPreventionTitle(id: string, locale: VoraLocale) { return locale === "de" ? preventionDetails[id]?.[0] || id : PREVENTION.find(offer => offer.id === id)?.title || id; }
