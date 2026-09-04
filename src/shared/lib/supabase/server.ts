import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getClientEnv } from "@/shared/config/env.client";
import { getServerEnv } from "@/shared/config/env.server";

// Server-only client — service role key bypasses RLS (see supabase/schema.sql).
// The `server-only` import makes this file a build error if it ever ends up in
// a client bundle, catching accidental service-role-key leaks at build time.
// Lazily created on first use (see env.client.ts for why).
let client: SupabaseClient | undefined;

export function getSupabaseServer(): SupabaseClient {
  if (!client) {
    const { supabaseUrl } = getClientEnv();
    const { supabaseServiceRoleKey } = getServerEnv();
    client = createClient(supabaseUrl, supabaseServiceRoleKey);
  }
  return client;
}
