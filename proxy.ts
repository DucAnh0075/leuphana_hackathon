import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseConfiguration } from "@/lib/auth/config";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const configuration = getSupabaseConfiguration();
  if (!configuration) return response;

  const client = createServerClient(configuration.url, configuration.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values) {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Refresh only. Every protected resource separately verifies identity and its
  // own person/recipient permissions; a proxy result never grants access.
  try {
    await client.auth.getClaims();
  } catch {
    // An unreachable auth service must not fabricate a session. Protected
    // handlers subsequently fail closed when their own verification fails.
    response.headers.set("X-Auth-Refresh", "unavailable");
  }
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

export const config = {
  matcher: ["/vorsorge/:path*", "/anmelden", "/scan", "/klinik/:path*", "/api/:path*"],
};
