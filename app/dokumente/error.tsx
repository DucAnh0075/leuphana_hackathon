"use client";
import Link from "next/link";

export default function Error({ reset }: { reset: () => void }) {
  return <main className="empty-state"><p className="eyebrow">DOKUMENTANSICHT</p><h1>Die Dokumente sind gerade nicht erreichbar.</h1><p>Bitte versuchen Sie es noch einmal.</p><div className="error-actions"><button className="button primary" onClick={reset}>Erneut versuchen</button><Link className="button secondary" href="/">Zur Startseite</Link></div></main>;
}
