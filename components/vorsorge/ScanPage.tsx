"use client";

import { useEffect, useRef, useState } from "react";
import { consumerError } from "@/lib/consumer-language";
import { Badge, Brand, LoadingState, Symbol } from "./Presentation";
import styles from "./Vorsorge.module.css";

export default function ScanPage({ card, demoId }: { card?: string; demoId?: string }) {
  const [auth, setAuth] = useState<{ configured: boolean; authenticated: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [expired, setExpired] = useState(false);
  const [result, setResult] = useState<{ handoffId: string; duplicate: boolean } | null>(null);
  const requestId = useRef<string | null>(null);
  const query = demoId ? "?" + new URLSearchParams({ demo: demoId, role: "owner" }).toString() : "";
  const personalHref = "/vorsorge?" + new URLSearchParams({ view: "handoffs", ...(demoId ? { demo: demoId } : {}) }).toString();
  const clinicHref = "/klinik" + (demoId ? "?demo=" + encodeURIComponent(demoId) : "");
  const next = "/scan?" + new URLSearchParams({ ...(card ? { card } : {}), ...(demoId ? { demo: demoId } : {}) }).toString();
  useEffect(() => {
    if (demoId) return;
    const controller = new AbortController();
    fetch("/api/auth", { cache: "no-store", signal: controller.signal }).then(async response => {
      const data = await response.json();
      if (!response.ok) { setError(consumerError(data, "Your login could not be checked. Reload to try again.")); return; }
      setAuth(data);
    }).catch(cause => { if (cause.name !== "AbortError") setError("Connection lost. Reload to check your access."); });
    return () => controller.abort();
  }, [demoId]);
  async function scan() {
    if (!card || busy || expired) return;
    setBusy(true); setError(""); requestId.current ??= crypto.randomUUID();
    try {
      const response = await fetch("/api/scan" + query, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ card, requestId: requestId.current }) });
      const data = await response.json();
      if (response.status === 410 && demoId) { setExpired(true); setError("This sample workspace has expired. Start a new sample to continue."); return; }
      if (!response.ok || !data.ok) { setError(consumerError(data, "The card scan could not be sent. Check the card link and try again.")); return; }
      setResult({ handoffId: data.handoffId, duplicate: data.duplicate });
    } catch { setError("The card scan could not be sent. Check your connection and try again."); }
    finally { setBusy(false); }
  }
  return <div lang="en" className={styles.shell}>
    {demoId && <div className={styles.demoBar}><Symbol name="shield" size={15}/><span>Sample workspace. This simulates a card scan.</span></div>}
    <main id="main" className={styles.scanMain}>
      <Brand href={personalHref}/>
      <div className={styles.scanIllustration}><Symbol name={result ? "check" : "card"} size={48}/></div>
      <h1>{result ? "Documents received" : !card ? "The card link is incomplete" : "Share through your card"}</h1>
      <p>{result ? "The assigned documents have arrived at the clinic. The clinic still needs to confirm them in the correct record." : !card ? "Open the full link on your card to find the assigned documents." : "Confirm to send the documents assigned to this card to the clinic."}</p>
      {error && <div className={styles.notice + " " + styles.error} role="alert"><Symbol name="alert" size={18}/><span>{error}</span></div>}
      {expired ? <a className={styles.button} href="/anmelden?next=%2Fvorsorge%3Fview%3Dhandoffs">Open a new sample workspace</a> : result ? <>
        <div className={styles.scanInfo}><Badge tone="blue">{result.duplicate ? "Already received" : "Received"}</Badge><p>{result.duplicate ? "This retry did not create a second handoff." : "Confirmation in the clinic record is still pending."}</p></div>
        <div className={styles.buttonRow}><a className={styles.button} href={personalHref}>View sharing status</a>{demoId && <a className={styles.textButton} href={clinicHref} target="_blank" rel="noopener noreferrer">Open clinic demo</a>}</div>
      </> : card && <>
        {!demoId && !auth && !error ? <LoadingState label="Checking access…"/> : demoId || auth?.authenticated ? <button className={styles.button} disabled={busy} onClick={() => void scan()}>{busy ? "Sending…" : "Send to clinic"}</button> : <><div className={styles.scanInfo}><strong>Log in to continue</strong><p>{auth?.configured ? "The card link alone does not grant access to documents. Use an account with permission." : "Account login is not configured here. You can explore the sample workspace from the login page."}</p></div><div className={styles.buttonRow}><a className={styles.button} href={"/anmelden?next=" + encodeURIComponent(next)}>Log in</a></div></>}
      </>}
      <p className={styles.helperFootnote} style={{marginTop:28}}>Physical card hardware is not connected in this prototype. Access permissions are still required.</p>
      <a className={styles.textButton} href={personalHref}>Back to sharing</a>
    </main>
  </div>;
}