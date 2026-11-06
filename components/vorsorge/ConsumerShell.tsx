"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Symbol } from "./Presentation";
import styles from "./Planning.module.css";

export type ConsumerShellProps = {
  children: ReactNode;
  active: "plan" | "documents" | "handoffs";
  demoId?: string;
  title?: string;
  headerAction?: ReactNode;
  helpTitle?: string;
  helpContent?: ReactNode;
  onReset?: () => void;
};

export default function ConsumerShell({ children, active, demoId, title = "Your planning space", headerAction, helpTitle = "A little help", helpContent, onReset }: ConsumerShellProps) {
  const [helpOpen, setHelpOpen] = useState(false);
  const helpButton = useRef<HTMLButtonElement>(null);
  const helpPanel = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!helpOpen) return;
    helpPanel.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !document.querySelector('[role="dialog"], dialog[open]')) {
        setHelpOpen(false);
        helpButton.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [helpOpen]);
  function closeHelp() { setHelpOpen(false); helpButton.current?.focus(); }
  function href(view: ConsumerShellProps["active"]) {
    const params = new URLSearchParams();
    if (demoId) params.set("demo", demoId);
    if (view !== "plan") params.set("view", view);
    return "/vorsorge" + (params.size ? "?" + params.toString() : "");
  }
  return <div className={styles.shell} lang="en">
    <aside className={styles.sidebar} aria-label="Workspace navigation">
      <a className={styles.brand} href={href("plan")} aria-label="Vorsorge home">
        <span className={styles.brandMark}><svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M16 26V12M16 19C7 19 5 13 5 7c7 0 11 4 11 12ZM16 14c0-6 4-9 11-9 0 6-4 9-11 9Z" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
        <span className={styles.brandWord}>Vorsorge</span>
      </a>
      <nav className={styles.navigation} aria-label="Main">
        <a href={href("plan")} aria-current={active === "plan" ? "page" : undefined}><Symbol name="home"/><span>Your plan</span></a>
        <a href={href("documents")} aria-current={active === "documents" ? "page" : undefined}><Symbol name="document"/><span>Documents</span></a>
        <a href={href("handoffs")} aria-current={active === "handoffs" ? "page" : undefined}><Symbol name="transfer"/><span>Sharing</span></a>
      </nav>
      <div className={styles.sidebarBottom}>
        {onReset && <button type="button" className={styles.railButton} onClick={onReset}><Symbol name="refresh"/><span>Start over</span></button>}
        <button ref={helpButton} type="button" className={styles.railButton} aria-expanded={helpOpen} aria-controls="workspace-help" onClick={() => setHelpOpen(!helpOpen)}><Symbol name="help"/><span>Help</span></button>
        <p className={styles.sidebarNote}>A little preparation.<br/>More peace of mind.</p>
      </div>
    </aside>
    <div className={styles.workspace}>
      <header className={styles.topbar}><span>{demoId ? "Sample workspace" : title}{demoId && <small>Fictional data</small>}</span><div className={styles.headerActions}>{headerAction ?? <a className={styles.loginLink} href={"/anmelden?next=" + encodeURIComponent(href(active))}>Log in<Symbol name="person" size={16}/></a>}</div></header>
      {helpOpen && <section ref={helpPanel} tabIndex={-1} id="workspace-help" className={styles.helpPanel} aria-label={helpTitle}>
        <div><h2>{helpTitle}</h2>{helpContent ?? <p>Plan your wishes in small steps. Documents holds existing originals, and Sharing shows deliveries to a clinic. A planning draft stays separate from signed documents.</p>}</div>
        <button className={styles.iconButton} aria-label="Close help" onClick={closeHelp}><Symbol name="close"/></button>
      </section>}
      {children}
    </div>
  </div>;
}
