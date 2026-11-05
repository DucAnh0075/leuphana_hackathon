import "server-only";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getSupabaseConfiguration } from "./config";

export async function createSupabaseServerClient(): Promise<SupabaseClient | null> {
  const configuration = getSupabaseConfiguration();
  if (!configuration) return null;
  const cookieStore = await cookies();

  return createServerClient(configuration.url, configuration.key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(values) {
        try {
          values.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch (error) {
          // Server Components are read-only. The proxy persists refresh cookies there;
          // Route Handlers must still surface any unexpected cookie-write failure.
          if (!(error instanceof Error) || !error.message.includes("Cookies can only be modified")) throw error;
        }
      },
    },
  });
}
