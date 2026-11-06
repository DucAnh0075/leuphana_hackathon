"use client";

import type { ReactNode } from "react";
import styles from "./Vorsorge.module.css";

export type SymbolName = "home" | "document" | "transfer" | "arrow" | "chevron" | "check" | "close" | "help" | "shield" | "card" | "phone" | "clock" | "person" | "logout" | "alert" | "copy" | "refresh" | "external" | "hospital" | "mail" | "lock";
const paths: Record<SymbolName, ReactNode> = {
  home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-7h6v7"/></>,
  document: <><path d="M14 3H5v18h14V8z"/><path d="M14 3v5h5M8 12h8M8 16h5"/></>,
  transfer: <><path d="M3 7h16m-4-4 4 4-4 4M21 17H5m4-4-4 4 4 4"/></>,
  arrow: <><path d="M4 12h16m-6-6 6 6-6 6"/></>,
  chevron: <path d="m9 5 7 7-7 7"/>,
  check: <path d="m5 12 4 4L19 6"/>,
  close: <path d="m6 6 12 12M6 18 18 6"/>,
  help: <><path d="M5 4h14v13H9l-4 4z"/><path d="M9 8h6m-6 4h4"/></>,
  shield: <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z"/><path d="m8 12 3 3 5-6"/></>,
  card: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M6 9h4v4H6zM14 9h3m-3 4h3M6 16h11"/></>,
  phone: <><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M10 5h4m-3 14h2"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></>,
  person: <><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></>,
  logout: <><path d="M9 3H4v18h5M10 12h11m-4-4 4 4-4 4"/></>,
  alert: <><path d="m12 3 10 18H2z"/><path d="M12 9v5m0 3v1"/></>,
  copy: <><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V3H3v13h5"/></>,
  refresh: <><path d="M20 7V2m0 5h-5M4 17v5m0-5h5"/><path d="M20 7a9 9 0 0 0-16 1m0 9a9 9 0 0 0 16-1"/></>,
  external: <><path d="M14 3h7v7m0-7L10 14M10 3H3v18h18v-7"/></>,
  hospital: <><path d="M5 21V3h14v18M2 21h20M9 21v-5h6v5M9 7h6m-3-3v6M9 13h1m4 0h1"/></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>,
  lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v2"/></>,
};

export function Symbol({ name, size = 20 }: { name: SymbolName; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export function Brand({ href = "/vorsorge", light = false }: { href?: string; light?: boolean }) {
  return <a href={href} className={styles.brand + (light ? " " + styles.brandLight : "")} aria-label="Vorsorge home"><span className={styles.brandMark}><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 7v9c0 6 9 10 9 10s9-4 9-10V7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/><path d="M12 8v7m8-7v7m-8-3h8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg></span><span>Vorsorge<span className={styles.brandDescriptor}>Your wishes. Within reach.</span></span></a>;
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "blue" | "green" | "amber" | "red" }) {
  return <span className={styles.badge + " " + styles["badge_" + tone]}>{children}</span>;
}

export function EmptyState({ title, children, icon = "document" }: { title: string; children: ReactNode; icon?: SymbolName }) {
  return <div className={styles.empty}><span className={styles.emptyIcon}><Symbol name={icon} size={26}/></span><h2>{title}</h2><p>{children}</p></div>;
}

export function LoadingState({ label = "Loading your documents…" }: { label?: string }) {
  return <div className={styles.loading} role="status"><span className={styles.spinner}/><span>{label}</span></div>;
}

export function dateLabel(value?: string | null, time = false) {
  if (!value) return "Pending";
  if (/^\d{2}\.\d{2}\.\d{4}/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", time ? { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" } : { day: "2-digit", month: "long", year: "numeric" }).format(date);
}
