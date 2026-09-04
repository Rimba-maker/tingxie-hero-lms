import "server-only";

import { createClient } from "@supabase/supabase-js";

import { clientEnv } from "@/shared/config/env.client";
import { serverEnv } from "@/shared/config/env.server";

// Server-only client — service role key bypasses RLS (see supabase/schema.sql).
// The `server-only` import makes this file a build error if it ever ends up in
// a client bundle, catching accidental service-role-key leaks at build time.
export const supabaseServer = createClient(
  clientEnv.supabaseUrl,
  serverEnv.supabaseServiceRoleKey,
);
