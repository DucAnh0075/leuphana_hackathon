import type { Metadata } from "next";
import ConsumerWorkspace from "@/components/vorsorge/ConsumerWorkspace";
import PlanningWorkspace from "@/components/vorsorge/PlanningWorkspace";
import VoraWorkspace from "@/components/vora/VoraWorkspace";
import type { Area, DocumentId } from "@/lib/vora";

export const metadata: Metadata = { title: "VORA | Your care, in one place", description: "Prepare your care documents, organise your vaccination record and explore prevention and travel preparation in VORA." };
export default async function CarePage({ searchParams }: { searchParams: Promise<Record<string,string|string[]|undefined>> }) {
  const params = await searchParams;
  const demoId = typeof params.demo === "string" ? params.demo : undefined;
  if (params.view === "documents" || params.view === "handoffs") return <ConsumerWorkspace demoId={demoId} initialView={params.view}/>;
  if (params.view === "legacy") return <PlanningWorkspace demoId={demoId}/>;
  const area: Area = typeof params.area === "string" && ["documents", "prevention", "vaccinations", "travel"].includes(params.area) ? params.area as Area : "overview";
  const document = typeof params.doc === "string" && ["power", "directive", "guardian"].includes(params.doc) ? params.doc as DocumentId : undefined;
  return <VoraWorkspace initialArea={area} initialDocument={document}/>;
}
