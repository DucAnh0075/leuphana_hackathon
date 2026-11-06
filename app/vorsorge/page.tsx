import type { Metadata } from "next";
import ConsumerWorkspace from "@/components/vorsorge/ConsumerWorkspace";
import PlanningWorkspace from "@/components/vorsorge/PlanningWorkspace";

export const metadata: Metadata = { title: "Your plan | Vorsorge", description: "Prepare your wishes one small step at a time. Choose documents, gather your notes and review a planning draft." };
export default async function CarePage({ searchParams }: { searchParams: Promise<Record<string,string|string[]|undefined>> }) {
  const params = await searchParams;
  const demoId = typeof params.demo === "string" ? params.demo : undefined;
  if (params.view === "documents" || params.view === "handoffs") return <ConsumerWorkspace demoId={demoId} initialView={params.view}/>;
  return <PlanningWorkspace demoId={demoId}/>;
}
