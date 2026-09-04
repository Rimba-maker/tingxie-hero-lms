import { requireEnv } from "./requireEnv";

// A function, not a module-scope const: Next.js evaluates every route
// module during `next build`'s page-data collection, even ones never hit at
// runtime. Reading env vars eagerly at import time turns a missing local
// .env into a build failure instead of a request-time one.
export function getClientEnv() {
  return {
    supabaseUrl: requireEnv("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
  } as const;
}
