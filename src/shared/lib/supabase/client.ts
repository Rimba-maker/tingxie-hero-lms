import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getClientEnv } from "@/shared/config/env.client";

// Browser client — anon key only. Plain @supabase/supabase-js, not @supabase/ssr:
// this app has no auth/session in scope (see PRD_TingXieHero.md §2 out-of-scope).
// Lazily created on first use (see env.client.ts for why).
let client: SupabaseClient | undefined;

export function getSupabaseBrowserClient(): SupabaseClient {
  if (!client) {
    const { supabaseUrl, supabaseAnonKey } = getClientEnv();
    client = createClient(supabaseUrl, supabaseAnonKey);
  }
  return client;
}
