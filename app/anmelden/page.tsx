import type { Metadata } from "next";
import { cookies } from "next/headers";
import Login from "@/components/vorsorge/Login";
import { VoraLanguageProvider } from "@/components/vora/VoraLanguage";
import { LOCALE_COOKIE, parseVoraLocale } from "@/lib/vora-language";

export const metadata: Metadata = { title: "Anmelden | VORAcard", description: "Dein Konto für Dokumente, Vorsorge und nächste Schritte." };
export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string,string|string[]|undefined>> }) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const locale = parseVoraLocale(typeof params.lang === "string" ? params.lang : cookieStore.get(LOCALE_COOKIE)?.value);
  return <VoraLanguageProvider initialLocale={locale}><Login next={typeof params.next === "string" ? params.next : undefined} mode={params.mode === "signup" ? "signup" : "login"}/></VoraLanguageProvider>;
}
