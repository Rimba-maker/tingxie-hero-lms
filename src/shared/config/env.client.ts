function requireEnv(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

// A function, not a module-scope const: Next.js evaluates every route
// module during `next build`'s page-data collection, even ones never hit at
// runtime. Reading env vars eagerly at import time turns a missing local
// .env into a build failure instead of a request-time one.
export function getClientEnv() {
  return {
    supabaseUrl: requireEnv("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnonKey: requireEnv(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
  } as const;
}
