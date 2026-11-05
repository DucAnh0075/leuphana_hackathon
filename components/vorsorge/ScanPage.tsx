"use client";

import { useEffect, useRef, useState } from "react";
import { Badge, Brand, LoadingState, Symbol } from "./Presentation";
import styles from "./Vorsorge.module.css";

export default function ScanPage({ card, demoId }: { card?: string; demoId?: string }) {
  const [auth, setAuth] = useState<{ configured: boolean; authenticated: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ handoffId: string; duplicate: boolean } | null>(null);
  const requestId = useRef<string | null>(null);
  const query = demoId ? "?" + new URLSearchParams({ demo: demoId, role: "owner" }).toString() : "";
  const personalHref = "/vorsorge" + (demoId ? "?demo=" + encodeURIComponent(demoId) : "");
  const clinicHref = "/klinik" + (demoId ? "?demo=" + encodeURIComponent(demoId) : "");
  const next = "/scan?" + new URLSearchParams({ ...(card ? { card } : {}), ...(demoId ? { demo: demoId } : {}) }).toString();

  useEffect(() => {
    if (demoId) return;
    const controller = new AbortController();
    fetch("/api/auth", { cache: "no-store", signal: controller.signal })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Die Anmeldung konnte nicht geprüft werden.");
        setAuth(data);
      })
      .catch(cause => { if (cause.name !== "AbortError") setError(cause.message || "Die Verbindung konnte nicht hergestellt werden."); });
    return () => controller.abort();
  }, [demoId]);

  async function scan() {
    if (!card || busy) return;
    setBusy(true); setError("");
    requestId.current ??= crypto.randomUUID();
    try {
      const response = await fetch("/api/scan" + query, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ card, requestId: requestId.current }) });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Der Kartenkontakt konnte nicht verarbeitet werden.");
      setResult({ handoffId: data.handoffId, duplicate: data.duplicate });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Der Kartenkontakt konnte nicht verarbeitet werden."); }
    finally { setBusy(false); }
  }

  return <div className={styles.shell}>
    {demoId && <div className={styles.demoBar}><Symbol name="shield" size={15}/><span><strong>Synthetische Demo.</strong> Dieser Aufruf stellt einen Kartenkontakt nach.</span></div>}
    <main id="main" className={styles.scanMain}>
      <Brand href={personalHref}/>
      <div className={styles.scanIllustration}><Symbol name={result ? "check" : "card"} size={48}/></div>
      <h1>{result ? "Eingang ausgelöst." : !card ? "Der Kartenverweis fehlt." : "Kartenkontakt bereit."}</h1>
      <p>{result ? "Die zugeordneten Dokumente wurden für die Klinik bereitgestellt. Die Übernahme in die richtige Akte wird dort gesondert bestätigt." : !card ? "Öffne den vollständigen Link deiner Karte. Ohne Kartenkennung werden keine Unterlagen zugeordnet." : "Mit deiner Bestätigung wird der Kartenkontakt an die Anwendung gesendet. Sie ruft die zugeordneten Unterlagen ab und meldet den Eingang in der Klinikansicht."}</p>
      {error && <div className={styles.notice + " " + styles.error} role="alert"><Symbol name="alert" size={18}/><span>{error}</span></div>}
      {result ? <>
        <div className={styles.scanInfo}><Badge tone="blue">{result.duplicate ? "Vorhandener Vorgang" : "Zur Zuordnung bereit"}</Badge><p>Ein erneut gesendeter Versuch erzeugt keine doppelte Übergabe.</p><p>Die Aktenübernahme ist noch nicht durch diesen Kartenkontakt bestätigt.</p></div>
        <div className={styles.buttonRow}><a className={styles.button} href={personalHref}>Übergabestand ansehen<Symbol name="arrow" size={17}/></a><a className={styles.button + " " + styles.secondary} href={clinicHref} target="_blank" rel="noopener noreferrer">Klinikansicht öffnen<Symbol name="external" size={15}/></a></div>
      </> : card && <>
        {!demoId && !auth && !error ? <LoadingState label="Zugriff wird geprüft …"/> : demoId || auth?.authenticated ?
          <button className={styles.button} disabled={busy} onClick={() => void scan()}>{busy ? "Eingang wird ausgelöst …" : "Scan an Klinik senden"}<Symbol name="transfer" size={18}/></button> :
          <><div className={styles.scanInfo}><strong>Anmeldung erforderlich</strong><p>{auth?.configured ? "Der Kartenverweis allein erlaubt keinen Dokumentenzugriff. Melde dich mit einem berechtigten Konto an." : "Der persönliche Zugang ist hier noch nicht eingerichtet. Die synthetische Demo kannst du über die Anmeldung öffnen."}</p></div><div className={styles.buttonRow}><a className={styles.button} href={"/anmelden?next=" + encodeURIComponent(next)}>Zur Anmeldung<Symbol name="arrow" size={17}/></a></div></>}
      </>}
      <p className={styles.helperFootnote} style={{marginTop:28}}>Die technische Anbindung des konkreten Chips bleibt zu prüfen. Ein Kartenkontakt ersetzt keine Zugriffsberechtigung.</p>
      <a className={styles.textButton} href={personalHref}>Zur Vorsorgeübersicht</a>
    </main>
  </div>;
}
