import type { Metadata } from "next";
import ScanPage from "@/components/vorsorge/ScanPage";

export const metadata: Metadata = { title: "Card scan | Vorsorge", description: "Confirm a card scan to send the permitted documents to a clinic." };
export default async function CardScanPage({ searchParams }: { searchParams: Promise<Record<string,string|string[]|undefined>> }) {
  const params = await searchParams;
  return <ScanPage card={typeof params.card === "string" ? params.card : undefined} demoId={typeof params.demo === "string" ? params.demo : undefined}/>;
}
