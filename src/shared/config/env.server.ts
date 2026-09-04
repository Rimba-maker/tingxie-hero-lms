import "server-only";

import { requireEnv } from "./requireEnv";

// See env.client.ts for why this is a function rather than a module-scope const.
export function getServerEnv() {
  return {
    supabaseServiceRoleKey: requireEnv(
      "SUPABASE_SERVICE_ROLE_KEY",
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    ),
    geminiApiKey: requireEnv("GEMINI_API_KEY", process.env.GEMINI_API_KEY),
  } as const;
}
