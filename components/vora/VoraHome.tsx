"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { VoraLocale } from "@/lib/vora-language";
import { Symbol } from "@/components/vorsorge/Presentation";
import { LanguageMenu, useVoraLanguage, VoraLanguageProvider } from "./VoraLanguage";
import AgentAvatar from "./AgentAvatar";
import s from "./VoraHome.module.css";

/** Public orientation only. Discovery begins in an authenticated case or an explicit demo. */
export default function VoraHome({ initialLocale = "de" }: { initialLocale?: VoraLocale }) {
  return <VoraLanguageProvider initialLocale={initialLocale}><HomeContent/></VoraLanguageProvider>;
}

function HomeContent() {
  const router = useRouter();
  const { locale, t } = useVoraLanguage();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const destination = "/vorsorge/app";
  const signup = `/anmelden?mode=signup&next=${encodeURIComponent(destination)}&lang=${locale}`;
  const login = `/anmelden?next=${encodeURIComponent(destination)}&lang=${locale}`;
  async function openDemo() {
    if (busy) return;
    setBusy(true); setError(false);
    try {
      const response = await fetch("/api/demo", { method: "POST", headers: { "Content-Type": "application/json" } });
      const result = await response.json() as { demoId?: string };
      if (!response.ok || !result.demoId) throw new Error("demo-unavailable");
      router.push(`${destination}?demo=${encodeURIComponent(result.demoId)}&lang=${locale}`);
    } catch { setError(true); setBusy(false); }
  }
  return <div className={s.page} lang={locale}>
    <header className={s.header}>
      <Link className={s.brand} href={`/vorsorge?lang=${locale}`} aria-label={t("VORAcard Startseite", "VORAcard home")}><span aria-hidden="true">V</span>VORAcard</Link>
      <nav className={s.headerLinks} aria-label={t("Hauptnavigation", "Main navigation")}><a href="#angebot">{t("Was VORAcard kann", "What VORAcard does")}</a><a href="#ablauf">{t("So funktioniert’s", "How it works")}</a></nav>
      <div className={s.headerActions}><LanguageMenu className={s.language}/><Link className={s.login} href={login}>{t("Anmelden", "Log in")}</Link></div>
    </header>

    <main id="main">
      <section className={s.hero} aria-labelledby="home-title">
        <div className={s.heroCopy}>
          <h1 id="home-title" className={s.heroTitle}><span className={s.visuallyHidden}>{t("Aus Vorsorge wird VORAcard.", "From care planning to VORAcard.")}</span><span aria-hidden="true" className={s.intro}>{t("Aus Vorsorge wird", "Care planning becomes")}</span><span className={s.wordStage} aria-hidden="true"><span className={s.sourceWord}>Vorsorge</span><span className={s.brandWord}>VORAcard<span className={s.wordDot}>.</span></span></span></h1>
          <p className={s.heroLead}>{t("Heute klären. Für morgen festhalten.", "Decide today. Be ready for tomorrow.")}</p>
          <p className={s.heroDescription}>{t("Vollmachten verstehen, Vorsorge im Blick behalten und wichtige Nachweise zusammenführen. VORAcard zeigt dir den nächsten Schritt.", "Understand care documents, keep track of preventive care and bring important records together. VORAcard helps you find your next step.")}</p>
          <div className={s.heroActions}><Link className={s.primary} href={signup}>{t("Konto erstellen", "Create account")}</Link><button className={s.secondary} type="button" disabled={busy} onClick={() => void openDemo()} aria-describedby="demo-note">{busy ? t("Demo wird geöffnet…", "Opening demo…") : t("Demo ansehen", "Explore demo")}</button></div>
          <p id="demo-note" className={s.microcopy}>{t("Erst kennenlernen? Die Demo nutzt ausschließlich Beispieldaten.", "Just exploring? The demo uses fictional data only.")}</p>
          {error && <p role="alert" className={s.error}>{t("Die Demo konnte nicht geöffnet werden. Bitte erneut versuchen.", "The demo could not be opened. Please try again.")}</p>}
        </div>
        <div className={s.preview} aria-label={t("Beispiel einer VORAcard Übersicht", "Example VORAcard overview")}>
          <div className={s.previewHeader}><span>VORAcard</span><span>{t("Ein Einblick", "A preview")}</span></div>
          <div className={s.previewBody}>
            <p className={s.previewGreeting}>{t("Deine Vorsorge", "Your care plan")}</p>
            <h2>{t("Ein guter nächster Schritt.", "One clear next step.")}</h2>
            <div className={s.previewFocus}><span className={s.documentIcon}><Symbol name="document" size={23}/></span><div><strong>{t("Vorsorgevollmacht", "Power of attorney")}</strong><p>{t("Wer darf für dich entscheiden?", "Who can act on your behalf?")}</p><span>{t("Baustein für Baustein vorbereiten", "Prepare one section at a time")}</span></div></div>
            <div className={s.previewRow}><Symbol name="check" size={18}/><div><strong>{t("Dokumente", "Documents")}</strong><span>{t("Auswählen · verstehen · abschließen", "Choose · understand · complete")}</span></div></div>
            <div className={s.previewRow}><Symbol name="clock" size={18}/><div><strong>{t("Vorsorge & Termine", "Preventive care & appointments")}</strong><span>{t("Möglichkeiten prüfen und Besuche vorbereiten", "Explore options and prepare for visits")}</span></div></div>
            <div className={s.previewRow}><Symbol name="card" size={18}/><div><strong>{t("Gesundheits-Pass", "Health pass")}</strong><span>{t("Impfpass und Organspende an einem Ort", "Vaccinations and organ donation together")}</span></div></div>
          </div>
          <div className={s.previewAgent}><span><AgentAvatar/></span><p>{t("Ein Begriff unklar? Frag VORAcard.", "A term unclear? Ask VORAcard.")}</p></div>
        </div>
      </section>

      <section id="angebot" className={s.offer} aria-labelledby="offer-title">
        <div className={s.sectionHeading}><h2 id="offer-title">{t("Was möchtest du regeln?", "What would you like to organise?")}</h2><p>{t("Drei Bereiche, eine Übersicht. Für dich und die Menschen, die dir wichtig sind.", "Three areas, one overview. For you and the people who matter to you.")}</p></div>
        <div className={s.features}>
          <article><Symbol name="document" size={25}/><h3>{t("Deine Entscheidungen festhalten", "Record your decisions")}</h3><p>{t("Vorsorgevollmacht, Patientenverfügung oder Betreuungsverfügung: Finde das passende Dokument und arbeite es in verständlichen Bausteinen durch.", "Power of attorney, advance directive or care directive: find the right document and work through clear, manageable sections.")}</p><p className={s.featureResult}>{t("Am Ende: Vorlage, Prüfung und nötige nächste Schritte.", "The result: a form, a review and the next steps required.")}</p></article>
          <article><Symbol name="clock" size={25}/><h3>{t("Vorsorge konkret planen", "Make preventive care concrete")}</h3><p>{t("Welche Früherkennungsangebote passen zu deinem Alter? Sieh dir etwa Gesundheits-Check-up, Hautkrebs-Screening und Darmkrebs-Früherkennung mit Voraussetzungen und Intervallen an.", "Which screening programmes match your age? Explore health check-ups, skin cancer and bowel cancer screening with eligibility and intervals.")}</p><p className={s.featureResult}>{t("Am Ende: ein ausgewähltes Angebot und ein vorbereiteter Arztbesuch.", "The result: a selected option and a prepared medical visit.")}</p></article>
          <article><Symbol name="card" size={25}/><h3>{t("Wichtige Nachweise zusammenführen", "Keep important records together")}</h3><p>{t("Impfpass über einen gekennzeichneten Demo-ePA-Import öffnen. Den Organspendeausweis selbst ausfüllen oder einen vorhandenen hinterlegen. Vor einer Reise gezielt nachsehen.", "Open vaccination records through a clearly labelled demo ePA import. Complete an organ donor card or add an existing one. Check your records before a trip.")}</p><p className={s.featureResult}>{t("Am Ende: ein Gesundheits-Pass mit sichtbarer Quelle und Status.", "The result: a health pass with a visible source and status.")}</p></article>
        </div>
      </section>

      <section id="ablauf" className={s.process} aria-labelledby="process-title">
        <div className={s.sectionHeading}><h2 id="process-title">{t("Ein Konto. Neue Anliegen, wann du sie brauchst.", "One account. A new case whenever you need one.")}</h2><p>{t("Die Dokumentauswahl gehört zu deinem Anliegen. Du kannst sie später jederzeit erneut durchgehen.", "Document discovery belongs to your case. You can go through it again whenever your situation changes.")}</p></div>
        <ol className={s.processSteps}>
          <li><span aria-hidden="true">1</span><div><h3>{t("Konto erstellen", "Create an account")}</h3><p>{t("Mit E-Mail und Passwort registrieren. Dein Profil ist der Ausgangspunkt für deine Vorsorge.", "Sign up with your email and password. Your profile is the starting point for your care planning.")}</p></div></li>
          <li><span aria-hidden="true">2</span><div><h3>{t("Anliegen klären", "Clarify your case")}</h3><p>{t("Für dich oder eine andere Person? Beantworte wenige Fragen und wähle dann die passenden Dokumente.", "For yourself or someone else? Answer a few questions, then choose the documents that fit.")}</p></div></li>
          <li><span aria-hidden="true">3</span><div><h3>{t("Schritt für Schritt weiterkommen", "Keep moving forward")}</h3><p>{t("Deine Übersicht bündelt offene Aufgaben, Dokumente und Termine. Du machst dort weiter, wo du aufgehört hast.", "Your overview brings together open tasks, documents and appointments. Pick up where you left off.")}</p></div></li>
        </ol>
      </section>

      <section id="vertrauen" className={s.trust} aria-labelledby="trust-title">
        <div><Symbol name="shield" size={25}/><h2 id="trust-title">{t("Du behältst den Überblick. Und die Entscheidung.", "You stay informed. You stay in control.")}</h2></div>
        <div className={s.trustCopy}><p>{t("VORAcard erklärt und organisiert. Rechtliche Prüfung und individuelle medizinische Beratung gehören zu den zuständigen Fachpersonen. Offizielle Quellen und die Sprache der Originalvorlage bleiben sichtbar.", "VORAcard explains and organises. Legal review and individual medical advice belong with qualified professionals. Official sources and the original form’s language stay visible.")}</p><p>{t("Der KI-Chat startet erst mit deiner Zustimmung. Gespeicherte Antworten und Dateien werden nicht automatisch angehängt. ePA-Synchronisierung sowie Arzt- und Notartermine sind in dieser Version gekennzeichnete Demo-Abläufe.", "The AI chat starts with your consent. Saved answers and files are not attached automatically. ePA synchronisation, medical appointments and notary appointments are labelled demo flows in this version.")}</p></div>
      </section>

      <section className={s.closing} aria-labelledby="closing-title"><div><h2 id="closing-title">{t("Fang mit einer Sache an.", "Start with one thing.")}</h2><p>{t("Dein nächster Schritt muss nicht alles auf einmal sein.", "Your next step does not have to be everything at once.")}</p></div><Link className={s.primary} href={signup}>{t("Konto erstellen", "Create account")}</Link></section>
    </main>
    <footer className={s.footer}><Link href={`/vorsorge?lang=${locale}`} className={s.footerBrand}>VORAcard</Link><span>{t("Vorsorge, die weiterdenkt.", "Care, considered.")}</span><a href="#vertrauen">{t("Daten & Grenzen", "Data & boundaries")}</a><Link href={login}>{t("Anmelden", "Log in")}</Link></footer>
  </div>;
}
