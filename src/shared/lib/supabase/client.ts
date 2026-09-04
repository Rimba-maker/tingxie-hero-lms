import { createClient } from "@supabase/supabase-js";

import { clientEnv } from "@/shared/config/env.client";

// Browser client — anon key only. Plain @supabase/supabase-js, not @supabase/ssr:
// this app has no auth/session in scope (see PRD_TingXieHero.md §2 out-of-scope).
export const supabase = createClient(clientEnv.supabaseUrl, clientEnv.supabaseAnonKey);
