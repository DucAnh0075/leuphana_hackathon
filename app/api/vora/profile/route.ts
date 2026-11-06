import { readBoundedJson, requireSameOrigin, RequestBoundaryError } from "@/lib/auth/request";
import { careErrorResponse, CareError } from "@/lib/care/errors";
import { PROFILE_LIMIT, parseProfileMutation, ProfileAccountChangedError } from "@/lib/vora-profile";
import { readVoraProfile, saveVoraProfile } from "@/lib/vora-profile-service";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie", "Referrer-Policy": "no-referrer" };
export async function GET(request: Request) { try { return Response.json(await readVoraProfile(request), { headers }); } catch (error) { return careErrorResponse(error); } }
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const body = await readBoundedJson(request, PROFILE_LIMIT + 512);
    let mutation;
    try { mutation = parseProfileMutation(body); } catch { throw new CareError(400, "PROFILE_INVALID", "Die Profildaten sind unvollständig oder ungültig. Der gespeicherte Stand wurde nicht geändert."); }
    return Response.json(await saveVoraProfile(request, mutation), { headers });
  } catch (error) {
    if (error instanceof ProfileAccountChangedError) return Response.json({ error: error.message, code: error.code }, { status: error.status, headers });
    if (error instanceof RequestBoundaryError) return Response.json({ error: error.message, code: "REQUEST_BOUNDARY" }, { status: error.status, headers });
    return careErrorResponse(error);
  }
}
