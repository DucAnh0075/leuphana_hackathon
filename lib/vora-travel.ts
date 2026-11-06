/** Dated summaries of official entry rules; never individual vaccination advice. */
export const TRAVEL_ADVICE = [
  { country: "Ghana", aliases: ["ghana"], source: "https://www.auswaertiges-amt.de/de/reiseundsicherheit/ghanasicherheit-203372", title: "Yellow fever proof is an entry requirement", text: "The Foreign Office lists yellow fever vaccination proof as required for entry from age 9 months. Check the current certificate rules and your complete route with the official source.", checked: "6 November 2026" },
  { country: "Thailand", aliases: ["thailand"], source: "https://www.auswaertiges-amt.de/de/reiseundsicherheit/thailandsicherheit-201558", title: "The yellow fever rule depends on arrival and transit", text: "Direct arrival from Germany: no compulsory vaccination is listed. Arrival from a yellow fever area, or transit there for more than 12 hours: yellow fever proof is required from age 9 months. A destination alone cannot establish which rule applies.", checked: "6 November 2026" },
  { country: "Japan", aliases: ["japan"], source: "https://www.auswaertiges-amt.de/de/service/laender/japan-node/japansicherheit/213032", title: "No vaccination entry requirement is listed", text: "The Foreign Office country advice lists no prescribed vaccinations for entry. This says nothing about personal medical recommendations or conditions in transit countries. Recheck the current rules before departure.", checked: "6 November 2026" },
  { country: "Brazil", aliases: ["brazil", "brasilien", "brasil"], source: "https://www.auswaertiges-amt.de/de/reiseundsicherheit/brasiliensicherheit-201092", title: "Check the rules for onward travel too", text: "Direct arrival from Germany: no compulsory vaccination is listed. Onward travel to certain other countries can require yellow fever proof. Check every destination and transit stop separately.", checked: "6 November 2026" },
];
export function travelAdvice(destination: string) {
  const name = destination.trim().toLocaleLowerCase("en");
  return TRAVEL_ADVICE.find(item => item.aliases.includes(name));
}
