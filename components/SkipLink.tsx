"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LOCALE_COOKIE, parseVoraLocale, type VoraLocale } from "@/lib/vora-language";

export default function SkipLink() {
  const pathname = usePathname();
  const consumer = /^\/(vorsorge|anmelden|scan)(\/|$)/.test(pathname ?? "");
  const [locale, setLocale] = useState<VoraLocale>("de");
  useEffect(() => {
    const cookie = document.cookie.split("; ").find(value => value.startsWith(`${LOCALE_COOKIE}=`))?.slice(LOCALE_COOKIE.length + 1);
    const timer = window.setTimeout(() => setLocale(parseVoraLocale(new URL(location.href).searchParams.get("lang") || cookie)), 0);
    const changed = (event: Event) => setLocale(parseVoraLocale((event as CustomEvent<unknown>).detail));
    window.addEventListener("vora-language-change", changed);
    return () => { clearTimeout(timer); window.removeEventListener("vora-language-change", changed); };
  }, [pathname]);
  const english = consumer && locale === "en";
  return <a className="skip-link" href="#main" lang={english ? "en" : "de"} onClick={() => {
    const main = document.getElementById("main");
    if (main) { main.tabIndex = -1; main.focus(); }
  }}>{english ? "Skip to content" : "Zum Inhalt"}</a>;
}
