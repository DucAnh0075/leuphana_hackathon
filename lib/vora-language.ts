/** The interface language is a preference, never a change of legal jurisdiction. */
export type VoraLocale = "de" | "en";
export const LOCALE_COOKIE = "vora_locale";

export function parseVoraLocale(value: unknown): VoraLocale {
  return value === "en" ? "en" : "de";
}
