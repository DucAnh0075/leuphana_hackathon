import { createSupabaseServerClient } from "@/lib/auth/server";
import { getSupabaseConfiguration } from "@/lib/auth/config";
import { readBoundedJson, RequestBoundaryError, requireSameOrigin } from "@/lib/auth/request";

export const dynamic = "force-dynamic";

const cacheHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
  Vary: "Cookie",
};

function json(body: object, status = 200) {
  return Response.json(body, { status, headers: cacheHeaders });
}

function unavailable() {
  return json({ error: "Die Anmeldung ist gerade nicht verfügbar. Bitte später erneut versuchen." }, 503);
}

function authFailure(status: number | undefined, message: string) {
  if (status === 429) return json({ error: "Zu viele Versuche. Bitte kurz warten und erneut versuchen." }, 429);
  if (!status || status >= 500) return unavailable();
  return json({ error: message }, 401);
}

function emailFrom(body: Record<string, unknown>) {
  if (typeof body.email !== "string") throw new RequestBoundaryError(400, "Bitte eine E-Mail-Adresse eingeben.");
  const email = body.email.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new RequestBoundaryError(400, "Bitte eine gültige E-Mail-Adresse eingeben.");
  }
  return email;
}

export async function GET() {
  if (!getSupabaseConfiguration()) return json({ configured: false, authenticated: false });
  try {
    const client = await createSupabaseServerClient();
    if (!client) return json({ configured: false, authenticated: false });
    const { data, error } = await client.auth.getUser();
    if (error) {
      if (!error.status || error.status >= 500) {
        return json({ configured: true, authenticated: false, error: "Die Sitzung konnte gerade nicht geprüft werden." }, 503);
      }
      return json({ configured: true, authenticated: false });
    }
    if (!data.user) return json({ configured: true, authenticated: false });
    return json({
      configured: true,
      authenticated: true,
      user: { id: data.user.id, email: data.user.email },
    });
  } catch {
    return json({ configured: true, authenticated: false, error: "Die Sitzung konnte gerade nicht geprüft werden." }, 503);
  }
}

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const body = await readBoundedJson(request);
    if (typeof body.action !== "string" || !["otp", "verify", "password", "logout"].includes(body.action)) {
      throw new RequestBoundaryError(400, "Diese Anmeldeaktion ist nicht bekannt.");
    }
    const client = await createSupabaseServerClient();
    if (!client) return json({ error: "Die Anmeldung ist noch nicht eingerichtet. Die synthetische Demo ist separat verfügbar." }, 503);

    if (body.action === "logout") {
      const { error } = await client.auth.signOut({ scope: "local" });
      if (error) return unavailable();
      return json({ ok: true });
    }

    const email = emailFrom(body);
    if (body.action === "otp") {
      const { error } = await client.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      });
      if (error?.status === 429) return authFailure(429, "");
      if (error && (!error.status || error.status >= 500)) return unavailable();
      // Existing and unknown addresses receive the same public response.
      return json({ ok: true });
    }

    if (body.action === "verify") {
      if (typeof body.token !== "string" || !/^\d{6}$/.test(body.token.trim())) {
        throw new RequestBoundaryError(400, "Bitte den sechsstelligen Code eingeben.");
      }
      const { data, error } = await client.auth.verifyOtp({ email, token: body.token.trim(), type: "email" });
      if (error) return authFailure(error.status, "Der Code ist ungültig oder abgelaufen. Bitte erneut versuchen oder einen neuen Code anfordern.");
      if (!data.user || !data.session) return authFailure(401, "Die Anmeldung konnte nicht abgeschlossen werden.");
      return json({ ok: true });
    }

    if (typeof body.password !== "string" || body.password.length < 1 || body.password.length > 1024) {
      throw new RequestBoundaryError(400, "Bitte ein Passwort eingeben.");
    }
    const { data, error } = await client.auth.signInWithPassword({ email, password: body.password });
    if (error) return authFailure(error.status, "E-Mail-Adresse oder Passwort stimmen nicht. Bitte erneut prüfen.");
    if (!data.user || !data.session) return authFailure(401, "Die Anmeldung konnte nicht abgeschlossen werden.");
    return json({ ok: true });
  } catch (error) {
    if (error instanceof RequestBoundaryError) return json({ error: error.message }, error.status);
    return unavailable();
  }
}
