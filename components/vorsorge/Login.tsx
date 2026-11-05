"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Brand, LoadingState, Symbol } from "./Presentation";
import styles from "./Vorsorge.module.css";

type AuthState = { configured: boolean; authenticated: boolean; user?: { id: string; email?: string }; error?: string };
function safeDestination(value?: string) {
  if (!value?.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u001f]/.test(value)) return "/vorsorge";
  try {
    const base = "https://vorsorge.invalid";
    const target = new URL(value, base);
    return target.origin === base ? target.pathname + target.search + target.hash : "/vorsorge";
  } catch { return "/vorsorge"; }
}

export default function Login({ next }: { next?: string }) {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [method, setMethod] = useState<"otp" | "password">("otp");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [retryAt, setRetryAt] = useState(0);
  const [now, setNow] = useState(0);
  const destination = safeDestination(next);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/auth", { cache: "no-store", signal: controller.signal })
      .then(async response => {
        const result = await response.json() as AuthState;
        if (!response.ok) throw new Error(result.error || "Der Anmeldedienst ist gerade nicht erreichbar.");
        setAuth(result);
      })
      .catch(cause => { if (cause.name !== "AbortError") setError(cause.message || "Der Anmeldedienst ist gerade nicht erreichbar."); });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (!retryAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [retryAt]);

  async function authenticate(action: "otp" | "verify" | "password") {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/auth", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, email: email.trim(), ...(action === "verify" ? { token } : {}), ...(action === "password" ? { password } : {}) }),
      });
      const result = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "Die Anmeldung hat nicht geklappt. Bitte versuche es erneut.");
      if (action === "otp") {
        setSent(true); setNow(Date.now()); setRetryAt(Date.now() + 60_000);
        setMessage("Wenn für diese Adresse ein Zugang besteht, wurde ein Code versendet.");
      } else {
        window.location.assign(destination);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Die Anmeldung ist gerade nicht möglich.");
    } finally { setBusy(false); }
  }

  async function startDemo() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/demo", { method: "POST", headers: { "Content-Type": "application/json" } });
      const result = await response.json() as { demoId?: string; error?: string };
      if (!response.ok || !result.demoId) throw new Error(result.error || "Die Demo konnte nicht gestartet werden.");
      window.location.assign((destination.startsWith("/klinik") ? "/klinik" : "/vorsorge") + "?demo=" + encodeURIComponent(result.demoId));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Die Demo konnte nicht gestartet werden.");
      setBusy(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void authenticate(sent ? "verify" : method);
  }
  const remaining = Math.max(0, Math.ceil((retryAt - now) / 1000));

  return <div className={styles.shell}><div className={styles.authShell}>
    <aside className={styles.authStory}>
      <Brand href="/" light/>
      <div className={styles.authStoryContent}>
        <h1>Gut vorbereitet.<br/>Auch wenn es darauf ankommt.</h1>
        <p>Behalte deine Vorsorge im Blick und sieh, welche Unterlagen in der Klinik angekommen sind.</p>
        <ul className={styles.authStoryList}>
          <li><Symbol name="document"/>Dokumente mit ihren Originalbelegen</li>
          <li><Symbol name="transfer"/>Nachvollziehbare Übergaben</li>
          <li><Symbol name="help"/>Unterstützung beim nächsten Schritt</li>
        </ul>
      </div>
      <small>Demonstrator mit ausschließlich synthetischen Unterlagen</small>
    </aside>
    <main id="main" className={styles.authMain}>
      <div className={styles.authForm}>
        <Link className={styles.authBack} href="/"><Symbol name="arrow" size={16}/>Zur Krankenhaus-Demo</Link>
        <h1>{auth?.authenticated ? "Du bist angemeldet." : sent ? "Schau in dein Postfach." : "Willkommen bei Vorsorge"}</h1>
        <p>{auth?.authenticated ? "Öffne deine persönlichen Unterlagen und Übergaben." : sent ? "Gib den sechsstelligen Code ein. Er wurde an die angegebene E-Mail-Adresse gesendet, sofern dafür ein Zugang besteht." : "Melde dich mit deiner hinterlegten E-Mail-Adresse an."}</p>
        {error && <div className={styles.notice + " " + styles.error} role="alert"><Symbol name="alert" size={18}/><span>{error}</span></div>}
        {message && <div className={styles.notice} role="status"><Symbol name="mail" size={18}/><span>{message}</span></div>}
        {!auth && !error ? <LoadingState label="Anmeldung wird vorbereitet …"/> : auth?.authenticated ?
          <a className={styles.button} href={destination}>Weiter zu deinen Unterlagen<Symbol name="arrow" size={17}/></a> :
          <>
            {auth && !auth.configured && <div className={styles.notice}><Symbol name="lock" size={18}/><span>Die persönliche Anmeldung ist hier noch nicht eingerichtet. Die synthetische Demo kannst du bereits ausprobieren.</span></div>}
            <form className={styles.form} onSubmit={submit}>
              <div className={styles.field}><label htmlFor="login-email">E-Mail-Adresse</label><input id="login-email" className={styles.input} type="email" inputMode="email" autoComplete="email" required placeholder="name@beispiel.de" value={email} onChange={event => setEmail(event.target.value)} readOnly={sent} disabled={busy || !auth?.configured}/></div>
              {sent && <div className={styles.field}><label htmlFor="login-code">Bestätigungscode</label><input id="login-code" className={styles.input + " " + styles.codeInput} type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} required value={token} onChange={event => setToken(event.target.value.replace(/\D/g, "").slice(0,6))} placeholder="000000" disabled={busy}/></div>}
              {!sent && method === "password" && <div className={styles.field}><label htmlFor="login-password">Passwort</label><input id="login-password" className={styles.input} type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} disabled={busy || !auth?.configured}/></div>}
              <button className={styles.button} type="submit" disabled={busy || !auth?.configured}>{busy ? "Bitte warten …" : sent ? "Code bestätigen" : method === "password" ? "Anmelden" : "Code per E-Mail erhalten"}{!busy && <Symbol name={sent || method === "password" ? "arrow" : "mail"} size={17}/>}</button>
              {sent ? <div className={styles.buttonRow}><button type="button" className={styles.textButton} disabled={busy || remaining > 0} onClick={() => void authenticate("otp")}>{remaining > 0 ? "Neuer Code in " + remaining + " Sek." : "Code erneut senden"}</button><button type="button" className={styles.textButton} onClick={() => { setSent(false); setToken(""); setMessage(""); setError(""); }}>Andere E-Mail verwenden</button></div> :
                <button type="button" className={styles.textButton} disabled={busy} onClick={() => { setMethod(value => value === "otp" ? "password" : "otp"); setError(""); }}>{method === "otp" ? "Mit Passwort anmelden" : "Mit E-Mail-Code anmelden"}</button>}
            </form>
          </>}
        <div className={styles.authChoice}><p>Du möchtest den Ablauf erst kennenlernen?</p><button className={styles.button + " " + styles.secondary} disabled={busy} onClick={() => void startDemo()}>Synthetische Demo öffnen<Symbol name="arrow" size={17}/></button><small>Öffentliche Beispieldaten. Kein persönliches Konto.</small></div>
      </div>
      <p className={styles.authFooter}>Ein App-Zugang erteilt keine Vertretungsvollmacht.</p>
    </main>
  </div></div>;
}
