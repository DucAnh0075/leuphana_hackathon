"use client";
import { useEffect, useRef, useState } from "react";
import { DONOR_CHOICES, HEALTH_PASS_SOURCES, donorDocument, donorIssues, germanDecision, localDate, type DonorDraft } from "@/lib/vora-health-pass";
import s from "./HealthPass.module.css";
import { useVoraLanguage } from "./VoraLanguage";
import { healthText } from "@/lib/vora-health-language";

export function DonorCardEditor({ draft, update, disabled, close }: { draft: DonorDraft; update: (draft: DonorDraft) => void; disabled: boolean; close: () => void }) {
  const { locale, t } = useVoraLanguage();
  const tr = (text: string) => healthText(text, locale);
  const [review, setReview] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { const frame = requestAnimationFrame(() => heading.current?.focus()); return () => cancelAnimationFrame(frame); }, []);
  const [downloaded, setDownloaded] = useState(false);
  const issues = donorIssues(draft);
  function change(key: keyof DonorDraft, value: string) { update({ ...draft, [key]: value }); setDownloaded(false); }
  function showReview(value: boolean) { setReview(value); requestAnimationFrame(() => heading.current?.focus()); }
  function download() {
    const url = URL.createObjectURL(new Blob([donorDocument(draft)], { type: "text/html;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "organspendeausweis-entwurf.html"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000); setDownloaded(true);
  }
  function print() {
    const frame = document.createElement("iframe");
    frame.title = t("Organspendeerklärung drucken", "Print organ donation declaration"); frame.style.position = "fixed"; frame.style.width = "1px"; frame.style.height = "1px"; frame.style.opacity = "0";
    frame.srcdoc = donorDocument(draft);
    frame.onload = () => {
      if (!frame.contentWindow) return;
      frame.contentWindow.onafterprint = () => frame.remove();
      frame.contentWindow.focus(); frame.contentWindow.print();
    };
    document.body.appendChild(frame);
    setTimeout(() => frame.remove(), 60_000);
  }
  return <div className={s.editor}>
    <div className={s.subheading}><h3 ref={heading} tabIndex={-1}>{tr(review ? "Review your card" : "Your organ donation decision")}</h3><span className={s.tag}>{tr("Unsigned draft")}</span></div>
    {!review ? <form onSubmit={event => { event.preventDefault(); showReview(true); }} noValidate>
      <p className={s.muted}>{tr("Every choice is yours. You can leave the decision open and return to this draft.")}</p>
      <fieldset disabled={disabled} className={s.choiceGroup}>
        <legend>{tr("Donation after death")}</legend>
        {DONOR_CHOICES.map(choice => <label className={s.radio} key={choice.value}><input type="radio" name="donation-decision" value={choice.value} checked={draft.choice === choice.value} onChange={() => change("choice", choice.value)} /><span>{tr(choice.label)}</span></label>)}
        {draft.choice && <button className={s.textButton} type="button" onClick={() => change("choice", "")}>{tr("Leave my decision open")}</button>}
      </fieldset>
      {(draft.choice === "except" || draft.choice === "only") && <label className={s.field} htmlFor="donor-organs"><span>{tr(draft.choice === "except" ? "Organs and tissues excluded" : "Only these organs and tissues")}</span><textarea id="donor-organs" rows={2} maxLength={500} value={draft.organs} disabled={disabled} onChange={event => change("organs", event.target.value)} /></label>}
      {draft.choice === "delegate" && <div className={s.fields}>
        <label className={s.field} htmlFor="donor-delegate"><span>{tr("Trusted person’s full name")}</span><input id="donor-delegate" maxLength={200} value={draft.delegateName} disabled={disabled} onChange={event => change("delegateName", event.target.value)} /></label>
        <label className={s.field} htmlFor="donor-contact"><span>{tr("Trusted person’s address or contact details")}</span><input id="donor-contact" maxLength={500} value={draft.delegateContact} disabled={disabled} onChange={event => change("delegateContact", event.target.value)} /></label>
      </div>}
      <div className={s.fields}>
        <label className={s.field} htmlFor="donor-name"><span>{tr("Your full name")}</span><input id="donor-name" autoComplete="name" maxLength={200} value={draft.name} disabled={disabled} onChange={event => change("name", event.target.value)} /></label>
        <label className={s.field} htmlFor="donor-birth"><span>{tr("Date of birth")}</span><input id="donor-birth" type="date" max={localDate()} value={draft.birthDate} disabled={disabled} onChange={event => change("birthDate", event.target.value)} /></label>
        <label className={s.field} htmlFor="donor-address"><span>{tr("Your address")}</span><input id="donor-address" autoComplete="street-address" maxLength={500} value={draft.address} disabled={disabled} onChange={event => change("address", event.target.value)} /></label>
        <label className={s.field} htmlFor="donor-date"><span>{tr("Declaration date")}</span><input id="donor-date" type="date" max={localDate()} value={draft.date} disabled={disabled} onChange={event => change("date", event.target.value)} /></label>
      </div>
      <label className={s.field} htmlFor="donor-notes"><span>{tr("Additional notes ")}<span className={s.muted}>{tr("(optional)")}</span></span><textarea id="donor-notes" rows={2} maxLength={1000} value={draft.notes} disabled={disabled} onChange={event => change("notes", event.target.value)} /></label>
      <p className={s.small}>{t("Zustimmung und Übertragung: ab 16 Jahren. Widerspruch: ab 14 Jahren.", "Consent and delegation: from age 16. Refusal: from age 14.")} <a href={HEALTH_PASS_SOURCES.age} target="_blank" rel="noreferrer">{tr("Age guidance")}</a></p>
      <div className={s.actions}><button className={s.primary} type="submit">{tr("Review draft")}</button><button className={s.textButton} type="button" onClick={close}>{tr("Close draft")}</button></div>
    </form> : <>
      {issues.length > 0 && <div className={s.notice} role="status"><strong>{tr("Still open")}</strong><ul>{issues.map(issue => <li key={issue}>{tr(issue)}</li>)}</ul></div>}
      <div className={s.declaration} lang="de">
        <p className={s.eyebrow}>Persönlicher Entwurf · nicht unterschrieben</p>
        <h4>Erklärung zur Organ- und Gewebespende</h4>
        <dl><div><dt>Name</dt><dd>{draft.name || "Noch offen"}</dd></div><div><dt>Geburtsdatum</dt><dd>{draft.birthDate || "Noch offen"}</dd></div><div><dt>Anschrift</dt><dd>{draft.address || "Noch offen"}</dd></div></dl>
        <p className={s.decision}>{germanDecision(draft)}</p>
        {draft.notes && <p><strong>Zusätzliche Hinweise: </strong>{draft.notes}</p>}
        <p>Datum: {draft.date || "Noch offen"}</p><p className={s.signature}>Ort, Datum und eigenhändige Unterschrift</p>
      </div>
      <p className={s.small}>{issues.length ? t("Du kannst den unvollständigen deutschen Entwurf mit deinen offenen Fragen herunterladen. Ergänze ihn vor der Unterschrift.", "You can download this incomplete German draft to keep your open questions. Complete it before signing.") : t("Prüfe die deutsche Erklärung, drucke sie aus und unterschreibe sie von Hand. Trage den unterschriebenen Ausweis bei dir.", "Review the German declaration, then print and sign it by hand. Keep the signed card with you.")} {t("Hierdurch entsteht kein Eintrag im Organspende-Register.", "This does not create an entry in the organ donation register.")}</p>
      <div className={s.actions}><button className={s.primary} onClick={download}>{tr(issues.length ? "Download incomplete draft" : "Download printable card")}</button>{!issues.length && <button className={s.secondary} onClick={print}>{tr("Print card")}</button>}<button className={s.textButton} onClick={() => showReview(false)}>{tr("Edit draft")}</button><button className={s.textButton} onClick={close}>{tr("Close review")}</button></div>
      {downloaded && <p className={s.small} role="status">{tr("Downloaded a German HTML declaration. Open it in your browser to print. It remains unsigned until you sign the printed copy.")}</p>}
    </>}
  </div>;
}
