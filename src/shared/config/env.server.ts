import "server-only";

function requireEnv(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const serverEnv = {
  supabaseServiceRoleKey: requireEnv(
    "SUPABASE_SERVICE_ROLE_KEY",
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  ),
  geminiApiKey: requireEnv("GEMINI_API_KEY", process.env.GEMINI_API_KEY),
} as const;
