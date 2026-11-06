import type { Metadata } from "next";
import ConsumerWorkspace from "@/components/vorsorge/ConsumerWorkspace";
import PlanningWorkspace from "@/components/vorsorge/PlanningWorkspace";
import VoraHome from "@/components/vora/VoraHome";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LOCALE_COOKIE, parseVoraLocale } from "@/lib/vora-language";

export const metadata: Metadata = { title: "VORAcard | Your care, in one place", description: "Prepare your care documents, vaccination passport and organ donation card, and explore prevention and travel preparation in VORAcard." };
export default async function CarePage({ searchParams }: { searchParams: Promise<Record<string,string|string[]|undefined>> }) {
  const params = await searchParams;
  const demoId = typeof params.demo === "string" ? params.demo : undefined;
  if (params.view === "documents" || params.view === "handoffs") return <ConsumerWorkspace demoId={demoId} initialView={params.view}/>;
  if (params.view === "legacy") return <PlanningWorkspace demoId={demoId}/>;
  if (["area", "doc", "phase", "block", "case", "demo"].some(key => typeof params[key] === "string")) {
    const query = new URLSearchParams(); for (const key of ["area", "doc", "phase", "block", "case", "demo", "lang"]) if (typeof params[key] === "string") query.set(key, params[key]);
    redirect(`/vorsorge/app?${query}`);
  }
  const cookieStore = await cookies();
  return <VoraHome initialLocale={parseVoraLocale(params.lang || cookieStore.get(LOCALE_COOKIE)?.value)}/>;
}
