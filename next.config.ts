import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";

const nextConfig: NextConfig = {
  // No auth/multi-tenant in scope (PRD §2) and this app has never set a
  // single response header, so nothing was preventing the whole thing being
  // framed by another site (clickjacking) or a browser MIME-sniffing an
  // upload response into something it isn't. Skipped a full
  // Content-Security-Policy deliberately - correctly scoping one around
  // Next.js's own inline scripts, the service worker, and Supabase/Gemini
  // origins is a real project of its own, and getting it wrong risks
  // silently breaking the app right before the deadline. These three are
  // the well-understood, near-zero-risk baseline every response should
  // carry regardless.
  async headers() {
    return [
      {
        source: "/:path*{/}?",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default withSerwist(nextConfig);
