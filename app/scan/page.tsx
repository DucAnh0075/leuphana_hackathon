import type { Metadata } from "next";
import ScanPage from "@/components/vorsorge/ScanPage";

export const metadata: Metadata = { title: "Kartenkontakt | Vorsorge", description: "Zugeordnete Vorsorgeunterlagen für den Klinikablauf bereitstellen." };
export default async function CardScanPage({ searchParams }: { searchParams: Promise<Record<string,string|string[]|undefined>> }) {
  const params = await searchParams;
  return <ScanPage card={typeof params.card === "string" ? params.card : undefined} demoId={typeof params.demo === "string" ? params.demo : undefined}/>;
}
