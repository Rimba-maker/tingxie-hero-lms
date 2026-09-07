// MOE Singapore curriculum (see CONTEXT/PRD) - every date/time shown to a
// parent must read the same way regardless of where the server process
// actually runs (Vercel's serverless functions don't run in Singapore's
// timezone by default). Locale (e.g. "en-SG") only controls *formatting
// conventions* - day/month order, separators - it does NOT pin which
// timezone a timestamp is interpreted in. Confirmed live: the same instant
// reads a calendar day earlier under a US-Pacific server TZ without an
// explicit `timeZone` option, `toLocaleDateString("en-SG", ...)` included -
// this constant exists so every date/time formatter in the app pins it the
// same way, once, instead of each call site having to remember to.
export const SINGAPORE_TIME_ZONE = "Asia/Singapore";

export function formatSingaporeDate(date: Date, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-SG", { ...options, timeZone: SINGAPORE_TIME_ZONE }).format(date);
}
