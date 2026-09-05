# TingXie HERO

AI-powered Chinese handwriting grading PWA — take-home technical assignment
(Junior Back-End Developer) for AiDi. Full flow: photo → backend upload →
Gemini Vision grading → correction overlay, per the assignment's evaluation
focus.

**Live URL:** _pending deployment_

## Screenshots

| Dashboard | Syllabus | Results |
|---|---|---|
| ![Dashboard](docs/screenshots/dashboard.png) | ![Syllabus](docs/screenshots/syllabus.png) | ![Results](docs/screenshots/results.png) |

## Stack

Next.js 16 (App Router, Turbopack) · TypeScript (strict) · Tailwind CSS v4 +
Shadcn UI · Supabase (Postgres + Storage) · Google Gemini (`@google/genai`) ·
Serwist (PWA) · Zustand · Vitest

See [`docs/planning/FSD_TingXieHero.md`](docs/planning/FSD_TingXieHero.md) for
the full technical spec and build order, and
[`docs/planning/PRD_TingXieHero.md`](docs/planning/PRD_TingXieHero.md) for
product requirements and the assumptions made where the brief was ambiguous
(§5 of that doc).

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables** — copy `.env.example` to `.env.local`
   and fill in:

   | Variable | Where to get it |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase project → Settings → Data API |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase project → Settings → API Keys (server-only, never expose to the client) |
   | `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) (server-only) |

3. **Apply the database schema** — in the Supabase SQL editor, run
   [`supabase/schema.sql`](supabase/schema.sql) then
   [`supabase/seed.sql`](supabase/seed.sql). This creates the `lessons`,
   `submissions`, and `character_results` tables (with RLS policies) and the
   `worksheet-photos` Storage bucket.

4. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Camera capture
   (`/scan`) requires HTTPS or `localhost` — both satisfy the browser's
   secure-context requirement for `getUserMedia`.

## Testing

```bash
npm run test       # Vitest — entity/business-logic unit tests
npm run test:e2e   # Playwright — dashboard, syllabus, navigation (needs `npm run dev` reachable)
npm run lint       # ESLint
npm run build      # production build, also runs `serwist build`
```

## Architecture notes

- **Feature-Sliced Design** (`app` / `screens` / `widgets` / `features` /
  `entities` / `shared`) — see FSD §2 for the full layer breakdown.
- Backend entity functions (`src/entities/*/api/`) are written against narrow,
  dependency-injected interfaces so the highest-risk logic — Gemini response
  parsing, score computation — is unit-tested without live credentials; the
  Supabase/Gemini-backed implementations are thin, untested adapters wired at
  the API route / page level.
- Dashboard, Syllabus, and Results are React Server Components fetching data
  directly (not through a separate REST layer) — simpler than a full GET API
  for read-only screens, while `POST /api/upload` and `POST /api/grade`
  (the flow the assignment evaluates) remain real API routes.
- Design tokens in `src/app/globals.css` were sampled directly from the
  client's mockup images rather than a generic template, converted to OKLCH.

## Known limitations

Scoped out deliberately, not oversights:

- **"Share Report," "Retest Missed," and "Print A4 Worksheet (PDF)" are
  decorative.** They match the mockups pixel-for-pixel but have no handler —
  the assignment's evaluation focus is the scan → upload → grade → feedback
  flow, not report sharing or printing. ("Top Up" on the Dashboard, by
  contrast, is real — it's not in this list.)
- **Mobile-only, by design.** The assignment brief only ever shows mobile
  mockups and never mentions desktop/tablet layouts (re-verified against the
  source PDF, not just the mockup images) — no responsive breakpoints were
  built.
- **Dark mode tokens exist but aren't mockup-verified.** `globals.css`
  defines a `.dark` palette so the app doesn't break under
  `prefers-color-scheme: dark`, but no dark-mode mockup was supplied and it
  hasn't had a dedicated visual pass.
- **History and Results start empty on a fresh database** — intentionally;
  see the empty state on `/history`. No demo data is seeded into the
  reviewer's database, since fabricated `submitted_at` history would misrepresent
  real usage.

## Deployment

Not deployed yet — pending final review. When ready:

1. Create a Vercel project linked to this repo.
2. Set the same three variables from `.env.example` in the Vercel dashboard
   (Project → Settings → Environment Variables): `NEXT_PUBLIC_SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`.
3. Deploy, then update the **Live URL** at the top of this README.
