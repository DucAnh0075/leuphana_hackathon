import { getKisSupabase } from "@/lib/kis-card";

export const dynamic = "force-dynamic";
const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Cache-Control": "no-store" };
const json = (body: object, status: number) => Response.json(body, { status, headers });
async function send(request: Request) {
  let value: unknown = new URL(request.url).searchParams.get("card");
  if (request.method === "POST" && value === null) {
    try { value = (await request.json())?.card; }
    catch { return json({ ok: false, error: "Ungültiger JSON-Body." }, 400); }
  }
  if (value != null && typeof value !== "string") return json({ ok: false, error: "Ungültige Karten-ID." }, 400);
  const card = (typeof value === "string" ? value.trim() : "") || "demo";
  if (card.length > 64) return json({ ok: false, error: "Karten-ID darf höchstens 64 Zeichen enthalten." }, 400);
  const supabase = getKisSupabase();
  if (!supabase) return json({ ok: false, error: "Supabase ist nicht konfiguriert." }, 503);
  try {
    const { error } = await supabase.from("kis_card_scans").insert({ card_id: card });
    if (error) throw error;
    return json({ ok: true, card }, 200);
  } catch { return json({ ok: false, error: "Kartenereignis konnte nicht gesendet werden." }, 500); }
}
export const GET = send;
export const POST = send;
export function OPTIONS() { return new Response(null, { status: 204, headers }); }
