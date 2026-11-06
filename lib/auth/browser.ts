"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfiguration } from "./config";

let browserClient: SupabaseClient | null = null;

export function createSupabaseBrowserClient(): SupabaseClient | null {
  const configuration = getSupabaseConfiguration();
  if (!configuration) return null;
  browserClient ??= createBrowserClient(configuration.url, configuration.key);
  return browserClient;
}
