import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
};

async function recordScan(value: unknown) {
  const card = (typeof value === "string" ? value.trim() : "").slice(0, 64) || "demo";

  if (!supabase) {
    return Response.json(
      { ok: false, error: "Supabase nicht konfiguriert" },
      { status: 503, headers },
    );
  }

  try {
    const { error } = await supabase.from("scans").insert({ card_id: card });
    if (error) {
      return Response.json({ ok: false, error: error.message }, { status: 500, headers });
    }
    return Response.json({ ok: true, card }, { headers });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Scan konnte nicht gespeichert werden" },
      { status: 500, headers },
    );
  }
}

export async function GET(request: Request) {
  return recordScan(new URL(request.url).searchParams.get("card"));
}

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const card = body && typeof body === "object" && "card" in body && typeof body.card === "string"
    ? body.card
    : new URL(request.url).searchParams.get("card");
  return recordScan(card);
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers });
}
