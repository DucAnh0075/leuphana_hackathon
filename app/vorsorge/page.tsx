import type { Metadata } from "next";
import ConsumerWorkspace from "@/components/vorsorge/ConsumerWorkspace";

export const metadata: Metadata = { title: "Meine Vorsorge", description: "Deine Vorsorgedokumente, Originalbelege und Übergaben an die Klinik." };
export default async function CarePage({ searchParams }: { searchParams: Promise<Record<string,string|string[]|undefined>> }) {
  const params = await searchParams;
  return <ConsumerWorkspace demoId={typeof params.demo === "string" ? params.demo : undefined}/>;
}
