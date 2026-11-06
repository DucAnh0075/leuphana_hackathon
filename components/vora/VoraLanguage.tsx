"use client";

import { createContext, useCallback, useContext, useEffect, useId, useMemo, useState, type ReactNode } from "react";
import { LOCALE_COOKIE, parseVoraLocale, type VoraLocale } from "@/lib/vora-language";

type LanguageContext = { locale: VoraLocale; setLocale: (locale: VoraLocale) => void; t: (de: string, en: string) => string };
const Context = createContext<LanguageContext>({ locale: "de", setLocale: () => undefined, t: de => de });

export function VoraLanguageProvider({ initialLocale = "de", children, onLocaleChange }: {
  initialLocale?: VoraLocale; children: ReactNode; onLocaleChange?: (locale: VoraLocale) => void;
}) {
  const [locale, updateLocale] = useState(initialLocale);
  useEffect(() => {
    const previous = document.documentElement.lang;
    document.documentElement.lang = locale;
    window.dispatchEvent(new CustomEvent("vora-language-change", { detail: locale }));
    return () => { document.documentElement.lang = previous; };
  }, [locale]);
  const setLocale = useCallback((next: VoraLocale) => {
    const value = parseVoraLocale(next);
    updateLocale(value);
    document.cookie = `${LOCALE_COOKIE}=${value}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    const url = new URL(window.location.href);
    url.searchParams.set("lang", value);
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
    onLocaleChange?.(value);
  }, [onLocaleChange]);
  const value = useMemo(() => ({ locale, setLocale, t: (de: string, en: string) => locale === "de" ? de : en }), [locale, setLocale]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useVoraLanguage() { return useContext(Context); }

export function LanguageMenu({ className }: { className?: string }) {
  const { locale, setLocale } = useVoraLanguage();
  const id = useId();
  return <select id={id} className={className} aria-label="Sprache / Language" value={locale} onChange={event => setLocale(parseVoraLocale(event.target.value))}>
    <option value="de" lang="de">Deutsch</option><option value="en" lang="en">English</option>
  </select>;
}
