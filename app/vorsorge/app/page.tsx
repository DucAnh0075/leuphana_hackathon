import { cookies } from "next/headers";
import ProfileWorkspace from "@/components/vora/ProfileWorkspace";
import { DOCUMENTS, type Area, type DocumentId } from "@/lib/vora";
import { LOCALE_COOKIE, parseVoraLocale } from "@/lib/vora-language";
export const dynamic = "force-dynamic";
export default async function ProfilePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams; const cookieStore = await cookies();
  const area: Area = typeof params.area === "string" && ["documents", "prevention", "vaccinations", "travel"].includes(params.area) ? params.area as Area : "overview";
  const doc = area === "documents" && typeof params.doc === "string" && ["power", "directive", "guardian"].includes(params.doc) ? params.doc as DocumentId : undefined;
  const phaseIndex = typeof params.phase === "string" ? ["select", "blocks", "review", "finish"].indexOf(params.phase) : -1;
  const block = typeof params.block === "string" && DOCUMENTS.find(item => item.id === doc)?.modules.some(item => item.id === params.block) ? params.block : undefined;
  // Only the shell is rendered here. Personal content requires an authenticated, owner-scoped API response.
  return <ProfileWorkspace key={typeof params.demo === "string" ? params.demo : "account"} initialLocale={parseVoraLocale(params.lang || cookieStore.get(LOCALE_COOKIE)?.value)} demoId={typeof params.demo === "string" ? params.demo : undefined} initialArea={area} initialDocument={doc} initialPhase={phaseIndex >= 0 ? phaseIndex : undefined} initialBlock={block} initialCaseId={typeof params.case === "string" ? params.case : undefined}/>;
}
