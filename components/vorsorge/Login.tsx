"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { consumerError, demoConsumerDestination, safeConsumerDestination } from "@/lib/consumer-language";
import { Brand, LoadingState, Symbol } from "./Presentation";
import styles from "./Vorsorge.module.css";

type AuthState = { configured: boolean; authenticated: boolean; user?: { id: string; email?: string }; code?: string };
export default function Login({ next }: { next?: string }) {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [method, setMethod] = useState<"otp" | "password">("password");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [invalidField, setInvalidField] = useState<"code" | "password" | null>(null);
  const focusAfterUpdate = useRef<string | null>(null);
  const [message, setMessage] = useState("");
  const [retryAt, setRetryAt] = useState(0);
  const [now, setNow] = useState(0);
  const destination = safeConsumerDestination(next);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/auth", { cache: "no-store", signal: controller.signal })
      .then(async response => {
        const result = await response.json() as AuthState;
        if (!response.ok) { setError(consumerError(result, "Login is unavailable right now. Try reloading this page.")); return; }
        setAuth(result);
      })
      .catch(cause => { if (cause.name !== "AbortError") setError("Login could not be loaded. Check your connection and reload."); });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (!retryAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [retryAt]);
  useEffect(() => {
    if (busy || !focusAfterUpdate.current) return;
    document.getElementById(focusAfterUpdate.current)?.focus();
    focusAfterUpdate.current = null;
  }, [busy, sent, method, error]);
  async function authenticate(action: "otp" | "verify" | "password") {
    setBusy(true); setError(""); setInvalidField(null); setMessage("");
    try {
      const response = await fetch("/api/auth", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, email: email.trim(), ...(action === "verify" ? { token } : {}), ...(action === "password" ? { password } : {}) }),
      });
      const result = await response.json() as { ok?: boolean; code?: string };
      if (!response.ok || !result.ok) {
        const fallback = response.status === 429 ? "Too many attempts. Please wait a moment and try again."
          : response.status >= 500 ? "Login is unavailable right now. Please try again later."
          : action === "verify" ? "This code could not be verified. Check it or request a new code."
          : action === "password" && response.status === 401 ? "Email or password is incorrect. Check your details and try again."
          : "Login did not succeed. Check your details and try again.";
        setError(consumerError(result, fallback));
        if (action === "verify") { setInvalidField("code"); focusAfterUpdate.current = "login-code"; }
        if (action === "password" && response.status === 401) { setInvalidField("password"); focusAfterUpdate.current = "login-password"; }
        return;
      }
      if (action === "otp") {
        focusAfterUpdate.current = "login-code";
        setSent(true); setNow(Date.now()); setRetryAt(Date.now() + 60_000);
        setMessage("If an account exists for this email address, a code has been sent.");
      } else window.location.assign(destination);
    } catch { setError("Login could not be completed. Check your connection and try again."); }
    finally { setBusy(false); }
  }
  async function startDemo() {
    setBusy(true); setError(""); setInvalidField(null);
    try {
      const response = await fetch("/api/demo", { method: "POST", headers: { "Content-Type": "application/json" } });
      const result = await response.json() as { demoId?: string; code?: string };
      if (!response.ok || !result.demoId) { setError(consumerError(result, "The sample workspace could not be opened. Try again.")); setBusy(false); return; }
      window.location.assign(demoConsumerDestination(destination, result.demoId));
    } catch { setError("The sample workspace could not be opened. Check your connection and try again."); setBusy(false); }
  }
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void authenticate(sent ? "verify" : method); }
  const remaining = Math.max(0, Math.ceil((retryAt - now) / 1000));
  return <div lang="en" className={styles.shell}><div className={styles.authShell}>
    <aside className={styles.authStory}><Brand href="/vorsorge" light/><div className={styles.authStoryContent}><h1>Your documents.<br/>A clear handover.</h1><p>Sign in to access your stored originals, choose a recipient and track the clinic’s receipt.</p><ol className={styles.authStoryList}><li>Open your existing documents</li><li>Check the version and recipient</li><li>Share and follow the receipt</li></ol></div><small>The sample workspace contains fictional people and documents.</small></aside>
    <main id="main" className={styles.authMain}><div className={styles.authForm}>
      <Link className={styles.authBack} href="/vorsorge"><Symbol name="arrow" size={16}/>Back to VORA</Link>
      <h1>{auth?.authenticated ? "You are logged in" : sent ? "Check your email" : "Log in"}</h1>
      <p>{auth?.authenticated ? "Continue to your existing documents and sharing." : sent ? "Enter the six-digit code sent to your registered email address." : method === "password" ? "Enter your email and password to open your documents." : "Get a sign-in code at your registered email address."}</p>
      {error && <div id="login-error" className={styles.notice + " " + styles.error} role="alert"><Symbol name="alert" size={18}/><span>{error}</span></div>}
      {message && <div className={styles.notice} role="status"><Symbol name="mail" size={18}/><span>{message}</span></div>}
      {!auth && !error ? <LoadingState label="Preparing login…"/> : auth?.authenticated ? <a className={styles.button} href={destination}>Continue to documents</a> : <>
        {auth && !auth.configured && <div className={styles.notice}><Symbol name="lock" size={18}/><span>Account login is not configured here. You can explore the sample workspace.</span></div>}
        <form className={styles.form} onSubmit={submit}>
          <div className={styles.field}><label htmlFor="login-email">Email address</label><input id="login-email" name="email" className={styles.input} type="email" inputMode="email" autoComplete={method === "password" ? "username" : "email"} autoCapitalize="none" spellCheck={false} required aria-invalid={invalidField === "password"} aria-describedby={invalidField === "password" ? "login-error" : undefined} placeholder="name@example.com" value={email} onChange={event => { setEmail(event.target.value); if (invalidField === "password") { setInvalidField(null); setError(""); } }} readOnly={sent} disabled={busy || !auth?.configured}/></div>
          {sent && <div className={styles.field}><label htmlFor="login-code">Verification code</label><input id="login-code" name="code" className={styles.input + " " + styles.codeInput} type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} required aria-invalid={invalidField === "code"} aria-describedby={invalidField === "code" ? "login-error" : undefined} value={token} onChange={event => { setToken(event.target.value.replace(/\D/g, "").slice(0,6)); if (invalidField === "code") { setInvalidField(null); setError(""); } }} placeholder="000000" disabled={busy}/></div>}
          {!sent && method === "password" && <div className={styles.field}><label htmlFor="login-password">Password</label><input id="login-password" name="password" className={styles.input} type="password" autoComplete="current-password" required aria-invalid={invalidField === "password"} aria-describedby={invalidField === "password" ? "login-error" : undefined} value={password} onChange={event => { setPassword(event.target.value); if (invalidField === "password") { setInvalidField(null); setError(""); } }} disabled={busy || !auth?.configured}/></div>}
          <button className={styles.button} type="submit" disabled={busy || !auth?.configured}>{busy ? "Please wait…" : sent ? "Verify code" : method === "password" ? "Log in" : "Email me a code"}</button>
          {sent ? <div className={styles.buttonRow}><button type="button" className={styles.textButton} disabled={busy || remaining > 0} onClick={() => void authenticate("otp")}>{remaining > 0 ? "Resend in " + remaining + "s" : "Resend code"}</button><button type="button" disabled={busy} className={styles.textButton} onClick={() => { focusAfterUpdate.current = "login-email"; setSent(false); setToken(""); setMessage(""); setError(""); setInvalidField(null); }}>Use another email</button></div> : <button type="button" className={styles.textButton} disabled={busy} onClick={() => { focusAfterUpdate.current = method === "otp" ? "login-password" : "login-email"; setMethod(value => value === "otp" ? "password" : "otp"); setPassword(""); setError(""); setInvalidField(null); }}>{method === "otp" ? "Use a password" : "Use an email code"}</button>}
        </form>
      </>}
      <div className={styles.authChoice}><p>Want to see how it works?</p><button className={styles.button + " " + styles.secondary} disabled={busy} onClick={() => void startDemo()}>Open sample workspace</button><small>Public example data. No personal account.</small></div>
    </div><p className={styles.authFooter}>Planning works without an account. Local drafts stay in this browser; signing in does not upload them.</p></main>
  </div></div>;
}
