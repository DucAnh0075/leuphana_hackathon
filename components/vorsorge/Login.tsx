"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { demoConsumerDestination, safeConsumerDestination } from "@/lib/consumer-language";
import { LanguageMenu, useVoraLanguage } from "@/components/vora/VoraLanguage";
import { Symbol } from "./Presentation";
import s from "./Login.module.css";

type AuthState = { configured: boolean; authenticated: boolean; user?: { id: string; email?: string }; code?: string };
export default function Login({ next, mode = "login" }: { next?: string; mode?: "login" | "signup" }) {
  const { locale, t } = useVoraLanguage();
  const signup = mode === "signup";
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [method, setMethod] = useState<"otp" | "password">("password");
  const [sent, setSent] = useState(false);
  const [confirmation, setConfirmation] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [invalidField, setInvalidField] = useState<"code" | "password" | null>(null);
  const focusAfterUpdate = useRef<string | null>(null);
  const [message, setMessage] = useState("");
  const [retryAt, setRetryAt] = useState(0);
  const [now, setNow] = useState(0);
  const destination = safeConsumerDestination(next ?? "/vorsorge/app");
  const switchHref = `/anmelden?${signup ? "" : "mode=signup&"}next=${encodeURIComponent(destination)}&lang=${locale}`;
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/auth", { cache: "no-store", signal: controller.signal })
      .then(async response => {
        const result = await response.json() as AuthState;
        if (!response.ok) { setError(t("Die Anmeldung ist gerade nicht verfügbar. Bitte die Seite neu laden.", "Login is unavailable right now. Try reloading this page.")); return; }
        setAuth(result);
      })
      .catch(cause => { if (cause.name !== "AbortError") setError(t("Die Anmeldung konnte nicht geladen werden. Prüfe deine Verbindung und lade die Seite neu.", "Login could not be loaded. Check your connection and reload.")); });
    return () => controller.abort();
  }, [t]);
  useEffect(() => {
    if (!retryAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [retryAt]);
  useEffect(() => {
    if (busy || !focusAfterUpdate.current) return;
    document.getElementById(focusAfterUpdate.current)?.focus();
    focusAfterUpdate.current = null;
  }, [busy, sent, confirmation, method, error]);
  async function authenticate(action: "otp" | "verify" | "password" | "signup") {
    if (busy) return;
    setBusy(true); setError(""); setInvalidField(null); setMessage("");
    try {
      const response = await fetch("/api/auth", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, email: email.trim(), ...(action === "verify" ? { token } : {}), ...(["password", "signup"].includes(action) ? { password } : {}) }),
      });
      const result = await response.json() as { ok?: boolean; confirmationRequired?: boolean; code?: string };
      if (!response.ok || !result.ok) {
        setError(response.status === 429 ? t("Zu viele Versuche. Bitte kurz warten und erneut versuchen.", "Too many attempts. Please wait a moment and try again.")
          : response.status >= 500 ? t("Die Anmeldung ist gerade nicht verfügbar. Bitte später erneut versuchen.", "Login is unavailable right now. Please try again later.")
          : action === "verify" ? t("Dieser Code ist ungültig oder abgelaufen. Prüfe ihn oder fordere einen neuen an.", "This code could not be verified. Check it or request a new code.")
          : action === "password" && response.status === 401 ? t("E-Mail-Adresse oder Passwort stimmen nicht. Bitte erneut prüfen.", "Email or password is incorrect. Check your details and try again.")
          : action === "signup" ? t("Das Konto konnte nicht erstellt werden. Prüfe E-Mail und Passwort. Wenn du bereits ein Konto hast, melde dich an.", "The account could not be created. Check your email and password. If you already have an account, log in.")
          : t("Die Anmeldung konnte nicht abgeschlossen werden. Bitte erneut versuchen.", "Login did not succeed. Check your details and try again."));
        if (action === "verify") { setInvalidField("code"); focusAfterUpdate.current = "login-code"; }
        if (["password", "signup"].includes(action) && response.status < 500 && response.status !== 429) { setInvalidField("password"); focusAfterUpdate.current = "login-password"; }
        return;
      }
      if (action === "otp") {
        focusAfterUpdate.current = "login-code";
        setSent(true); setNow(Date.now()); setRetryAt(Date.now() + 60_000);
        setMessage(t("Wenn ein Konto für diese E-Mail-Adresse existiert, wurde ein Code verschickt.", "If an account exists for this email address, a code has been sent."));
      } else if (action === "signup" && result.confirmationRequired) {
        setPassword(""); setConfirmation(true); focusAfterUpdate.current = "login-title";
      } else window.location.assign(destination);
    } catch { setError(t("Der Vorgang konnte nicht abgeschlossen werden. Prüfe deine Verbindung und versuche es erneut.", "Login could not be completed. Check your connection and try again.")); }
    finally { setBusy(false); }
  }
  async function startDemo() {
    if (busy) return;
    setBusy(true); setError(""); setInvalidField(null);
    try {
      const response = await fetch("/api/demo", { method: "POST", headers: { "Content-Type": "application/json" } });
      const result = await response.json() as { demoId?: string };
      if (!response.ok || !result.demoId) throw new Error("demo-unavailable");
      const demo = new URL(demoConsumerDestination(destination, result.demoId), window.location.origin);
      demo.searchParams.set("lang", locale);
      window.location.assign(demo.pathname + demo.search + demo.hash);
    } catch { setError(t("Die Demo konnte nicht geöffnet werden. Prüfe deine Verbindung und versuche es erneut.", "The sample workspace could not be opened. Check your connection and try again.")); setBusy(false); }
  }
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void authenticate(signup ? "signup" : sent ? "verify" : method); }
  const remaining = Math.max(0, Math.ceil((retryAt - now) / 1000));
  return <div className={s.page} lang={locale}>
    <header className={s.header}><Link href={`/vorsorge?lang=${locale}`} className={s.brand}>VORAcard</Link><LanguageMenu className={s.language}/></header>
    <div className={s.layout}>
      <aside className={s.story}><p className={s.storyKicker}>{t("Dein Konto ist der Anfang.", "Your account is the starting point.")}</p><h2>{t("Deine Vorsorge. In deinem Tempo.", "Your care planning. At your own pace.")}</h2><p>{t("Nach der Anmeldung klärst du dein Anliegen. Dein Profil, die Dokumentauswahl und offene Schritte bleiben klar voneinander getrennt.", "After signing in, clarify your case. Your profile, document discovery and open tasks each have their own place.")}</p><ol><li><strong>{t("Profil anlegen", "Set up your profile")}</strong><span>{t("Die Grundlage für deine Vorsorge.", "The foundation for your care planning.")}</span></li><li><strong>{t("Neues Anliegen starten", "Start a new case")}</strong><span>{t("Für dich oder für jemand anderen.", "For yourself or someone else.")}</span></li><li><strong>{t("In der Übersicht weitermachen", "Continue in your overview")}</strong><span>{t("Dokumente, Aufgaben und Termine im Blick.", "Keep track of documents, tasks and appointments.")}</span></li></ol></aside>
      <main id="main" className={s.main}>
        <Link className={s.back} href={`/vorsorge?lang=${locale}`}>{t("Zurück zu VORAcard", "Back to VORAcard")}</Link>
        <h1 id="login-title" tabIndex={-1}>{auth?.authenticated ? t("Du bist angemeldet", "You are logged in") : confirmation ? t("E-Mail bestätigen", "Confirm your email") : sent ? t("Schau in dein Postfach", "Check your email") : signup ? t("Konto erstellen", "Create account") : t("Anmelden", "Log in")}</h1>
        <p className={s.intro}>{auth?.authenticated ? t("Öffne deine Übersicht und setze deine Vorsorge fort.", "Open your overview and continue your care planning.") : confirmation ? t("Falls die Registrierung möglich ist, erhältst du eine E-Mail. Bestätige deine Adresse über den Link und melde dich danach an.", "If registration is available, you will receive an email. Confirm your address using the link, then log in.") : sent ? t("Gib den sechsstelligen Code aus der E-Mail ein.", "Enter the six-digit code sent to your registered email address.") : signup ? t("Zuerst dein Konto. Die Auswahl der passenden Dokumente folgt in deinem Profil.", "Your account comes first. You will choose the right documents from your profile afterwards.") : method === "password" ? t("Mit E-Mail und Passwort zu deiner Übersicht.", "Enter your email and password to open your overview.") : t("Erhalte einen Anmeldecode an deine registrierte E-Mail-Adresse.", "Get a sign-in code at your registered email address.")}</p>
        {error && <div id="login-error" className={s.notice + " " + s.error} role="alert"><Symbol name="alert" size={18}/><span>{error}</span></div>}
        {message && <div className={s.notice} role="status"><Symbol name="mail" size={18}/><span>{message}</span></div>}
        {!auth && !error ? <p role="status" className={s.loading}>{t("Anmeldung wird vorbereitet…", "Preparing login…")}</p> : auth?.authenticated ? <a className={s.primary} href={destination}>{t("Zur Übersicht", "Continue to overview")}</a> : confirmation ? <a className={s.primary} href={switchHref}>{t("Zur Anmeldung", "Go to login")}</a> : <>
          {auth && !auth.configured && <div className={s.notice}><Symbol name="lock" size={18}/><span>{t("Die Kontoanmeldung ist hier noch nicht verfügbar. Du kannst die Demo mit Beispieldaten öffnen.", "Account login is not configured here. You can explore the sample workspace.")}</span></div>}
          {!auth && error && <button className={s.textButton} type="button" onClick={() => window.location.reload()}>{t("Seite neu laden", "Reload page")}</button>}
          <form className={s.form} onSubmit={submit}>
            <div className={s.field}><label htmlFor="login-email">{t("E-Mail-Adresse", "Email address")}</label><input id="login-email" name="email" type="email" inputMode="email" autoComplete={method === "password" ? "username" : "email"} autoCapitalize="none" spellCheck={false} required aria-invalid={invalidField === "password"} aria-describedby={invalidField === "password" ? "login-error" : undefined} placeholder="name@example.com" value={email} onChange={event => { setEmail(event.target.value); if (invalidField === "password") { setInvalidField(null); setError(""); } }} readOnly={sent} disabled={busy || !auth?.configured}/></div>
            {sent && <div className={s.field}><label htmlFor="login-code">{t("Bestätigungscode", "Verification code")}</label><input id="login-code" name="code" className={s.code} type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} required aria-invalid={invalidField === "code"} aria-describedby={invalidField === "code" ? "login-error" : undefined} value={token} onChange={event => { setToken(event.target.value.replace(/\D/g, "").slice(0,6)); if (invalidField === "code") { setInvalidField(null); setError(""); } }} placeholder="000000" disabled={busy}/></div>}
            {!sent && (method === "password" || signup) && <div className={s.field}><label htmlFor="login-password">{t("Passwort", "Password")}</label><input id="login-password" name="password" type="password" autoComplete={signup ? "new-password" : "current-password"} minLength={signup ? 8 : undefined} required aria-invalid={invalidField === "password"} aria-describedby={invalidField === "password" ? "login-error" : signup ? "password-hint" : undefined} value={password} onChange={event => { setPassword(event.target.value); if (invalidField === "password") { setInvalidField(null); setError(""); } }} disabled={busy || !auth?.configured}/>{signup && <p id="password-hint" className={s.hint}>{t("Mindestens 8 Zeichen.", "At least 8 characters.")}</p>}</div>}
            <button className={s.primary} type="submit" disabled={busy || !auth?.configured}>{busy ? t("Bitte warten…", "Please wait…") : signup ? t("Konto erstellen", "Create account") : sent ? t("Code bestätigen", "Verify code") : method === "password" ? t("Anmelden", "Log in") : t("Code per E-Mail senden", "Email me a code")}</button>
            {!signup && (sent ? <div className={s.buttonRow}><button type="button" className={s.textButton} disabled={busy || remaining > 0} onClick={() => void authenticate("otp")}>{remaining > 0 ? t(`Erneut senden in ${remaining}s`, `Resend in ${remaining}s`) : t("Code erneut senden", "Resend code")}</button><button type="button" disabled={busy} className={s.textButton} onClick={() => { focusAfterUpdate.current = "login-email"; setSent(false); setToken(""); setMessage(""); setError(""); setInvalidField(null); }}>{t("Andere E-Mail verwenden", "Use another email")}</button></div> : <button type="button" className={s.textButton} disabled={busy} onClick={() => { focusAfterUpdate.current = method === "otp" ? "login-password" : "login-email"; setMethod(value => value === "otp" ? "password" : "otp"); setPassword(""); setError(""); setInvalidField(null); }}>{method === "otp" ? t("Passwort verwenden", "Use a password") : t("E-Mail-Code verwenden", "Use an email code")}</button>)}
          </form>
          <p className={s.switch}>{signup ? t("Schon ein Konto?", "Already have an account?") : t("Noch kein Konto?", "New to VORAcard?")} <a href={switchHref}>{signup ? t("Anmelden", "Log in") : t("Konto erstellen", "Create account")}</a></p>
        </>}
        <div className={s.demo}><p>{t("Erst ausprobieren?", "Want to see how it works?")}</p><button className={s.secondary} disabled={busy} onClick={() => void startDemo()}>{t("Demo ansehen", "Open sample workspace")}</button><small>{t("Beispieldaten. Kein persönliches Konto.", "Public example data. No personal account.")}</small></div>
      </main>
    </div>
    <footer className={s.footer}>{t("VORAcard hilft dir beim Organisieren und Verstehen. Du entscheidest, welche Schritte du gehst.", "VORAcard helps you organise and understand. You choose which steps to take.")}</footer>
  </div>;
}
