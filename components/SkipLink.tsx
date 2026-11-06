"use client";

import { usePathname } from "next/navigation";

export default function SkipLink() {
  const pathname = usePathname();
  const english = /^\/(vorsorge|anmelden|scan)(\/|$)/.test(pathname ?? "");
  return <a className="skip-link" href="#main" lang={english ? "en" : "de"} onClick={() => {
    const main = document.getElementById("main");
    if (main) { main.tabIndex = -1; main.focus(); }
  }}>{english ? "Skip to content" : "Zum Inhalt"}</a>;
}
