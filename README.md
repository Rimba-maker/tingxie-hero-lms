# TingXie HERO

AI-powered Chinese handwriting grading PWA — take-home technical assignment
(Junior Back-End Developer) for AiDi. Full flow: photo → backend upload →
Gemini Vision grading → correction overlay, per the assignment's evaluation
focus.

**Live URL:** https://tingxie-hero-lms.vercel.app

> **Viewing note:** this is a mobile-first PWA — every screen's visual design
> matches the assignment's own mobile mockups exactly, for phone or tablet
> (the actual target: a parent's phone, or a student's iPad). Opening the
> Live URL on a desktop browser at full window width still works — it's a
> real, working adaptive layout, not broken (see **Known limitations**) —
> but that's not the intended look. For the real experience, open DevTools
> (`F12`, or `Cmd+Option+I` on Mac) → toggle device toolbar
> (`Ctrl+Shift+M` / `Cmd+Shift+M`) → pick any phone or tablet preset →
> *then* load the link.

## Screenshots

| Dashboard | Syllabus | Results |
|---|---|---|
| ![Dashboard](docs/screenshots/dashboard.png) | ![Syllabus](docs/screenshots/syllabus.png) | ![Results](docs/screenshots/results.png) |

| History | Print Worksheet |
|---|---|
| ![History](docs/screenshots/history.png) | ![Print Worksheet](docs/screenshots/print-worksheet.png) |

Results and History above show three real graded submissions for the same
lesson across three different dates (score, per-character correction
overlay, a "Results over time" matrix that now actually has history to show,
pinyin, and a "Practice writing" stroke-order animation for the one
character still missed) — captured against temporary submissions inserted
directly into the live database for this screenshot, then deleted
immediately after (verified 0 rows remaining). The worksheet photo itself is
a synthesized demo image (not a real phone photo), built the same way for
this screenshot only. The shipped database starts empty; see
**Known limitations** below for why no demo data is seeded permanently.

Scan isn't screenshotted here — a static image can't represent a live camera
feed. The real screen has a working video feed, alignment brackets, a QR
target box, and a shutter button, genuinely streaming rather than a mockup
or error fallback — see **Known limitations** for what only a real device
confirms. Print Worksheet is the actual generated Tian Zige practice-sheet
PDF (`generateWorksheetPdf`, real output, not a mockup), rendered here in a
PDF viewer.

## For reviewers: open the architecture diagrams first

Before reading source files, open these two in a browser (double-click, no
server needed):

- [`docs/architecture/system-architecture.html`](docs/architecture/system-architecture.html)
  — the full component map: parent's phone → this PWA → the App Router
  server → Supabase (Postgres + Storage) and Gemini. Includes the one
  deliberate exception to "the browser never talks to a backing service
  directly": the stroke-order practice section fetches its stroke data
  straight from `hanzi-writer`'s CDN, client-side, bypassing the server —
  drawn as a dashed line so it reads as the exception it is.
- [`docs/architecture/grading-flow.html`](docs/architecture/grading-flow.html)
  — the exact scan-to-grade request sequence, message by message: upload,
  the server fetching its own uploaded photo back for Gemini, the Gemini
  call, **the write to `character_results` before the response goes out**
  (easy to miss reading the route handler top-to-bottom), then the
  red-pen overlay returned to the client.

Both are self-contained, interactive (pan/zoom, light/dark theme, a guided
"Play story" walkthrough per view), and kept in sync with the actual code —
not drawn once and left to rot. If anything in either diagram ever disagrees
with `src/`, trust the code and tell me; the diagram is wrong, not the app.

## Highlights

- **The evaluated flow works end-to-end, with real data at every step.**
  Photo → `POST /api/upload` → `POST /api/grade` (a real Gemini call) →
  Supabase writes → a red-pen/green-check overlay drawn on the actual graded
  photo, positioned from Gemini's own bounding boxes. That overlay is the
  assignment's own named "key evaluation point" — not a stand-in table, an
  actual mark on the actual photo.
- **Tested where it matters, not everywhere for its own sake.** 86 Vitest
  unit tests (26 files) cover every entity function's business logic —
  Gemini response parsing, score computation, the grade-submission
  pipeline's full orchestration order — against fakes, no live credentials
  needed to run them. 6 Playwright E2E tests cover navigation and both
  History states; the populated-history case manages its own real Supabase
  fixture (insert, verify, delete, confirm 0 rows remain) instead of relying
  on whatever happens to already be in the database.
- **Reviewed, not just built and shipped.** Two security-review passes and a
  Standards+Spec code-review caught and fixed a real bug before it could
  affect anyone — a prototype-pollution-adjacent object lookup
  (`plainObject["__proto__"]`) that could have crashed the Results page for
  a submission with an unlucky Gemini-returned string. `FSD_TingXieHero.md`
  §6 documents every audit run against this codebase, including the ones
  that correctly found nothing to fix.
- **Accessible by default, not bolted on at the end.** Every screen has
  exactly one semantic `<h1>` and sits inside a `<main>` landmark; every
  non-obvious interactive element carries a real `aria-label`; the
  stroke-order animation checks `prefers-reduced-motion` and shows the
  finished character instantly instead of animating for anyone who's asked
  their OS to reduce motion.
- **A real, installable PWA.** Manifest with real app screenshots and a full
  icon set (including `apple-touch-icon` for iOS's home-screen add flow), a
  service worker verified end-to-end via Playwright — registers, installs,
  activates, controls the page, zero console errors.
- **Nothing faked beyond what the assignment explicitly says to hardcode.**
  Credits, the weekly calendar, Syllabus completion percentages, the
  historical matrix, and the stroke-order practice section are all backed by
  real Supabase data computed from actual rows — the student profile is the
  one thing hardcoded, exactly as the brief instructs.

## Stack

Next.js 16 (App Router, Turbopack) · TypeScript (strict) · Tailwind CSS v4 +
Shadcn UI · Supabase (Postgres + Storage) · Google Gemini (`@google/genai`) ·
Serwist (PWA) · Zustand · `pdf-lib` (real worksheet PDF export) ·
`hanzi-writer` (stroke-order practice) · Vitest · Playwright

**Docs, in the order you'd want them:**
- [`docs/planning/PRD_TingXieHero.md`](docs/planning/PRD_TingXieHero.md) —
  product requirements and the assumptions made where the brief was
  ambiguous (§5 of that doc)
- [`docs/planning/FSD_TingXieHero.md`](docs/planning/FSD_TingXieHero.md) —
  full technical spec, folder structure, DB schema, API contract, and a
  phase-by-phase build log (including every fix made *beyond* the original
  plan, and why)
- [`CONTEXT.md`](CONTEXT.md) + [`docs/adr/`](docs/adr/) — domain glossary and
  the handful of decisions worth not re-litigating (why submission IDs stay
  random UUIDs, why the DB-adapter pattern stays uniform even for trivial
  pass-throughs)
- [`docs/architecture/`](docs/architecture/) — two interactive HTML
  diagrams: system architecture (component topology) and the scan-to-grade
  request sequence. Self-contained — open either `.html` file directly in a
  browser, no server needed. See **For reviewers** above if you haven't yet.

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
npm run test:e2e   # Playwright — dashboard, syllabus, navigation, History states (auto-starts the
                    # dev server if one isn't already running; the History-populated case needs a
                    # real `.env.local` — it inserts and cleans up its own temp Supabase submission)
npm run lint       # ESLint
npm run build      # production build, also runs `serwist build`
```

## Architecture notes

- **Feature-Sliced Design** (`app` / `screens` / `widgets` / `features` /
  `entities` / `shared`) — see FSD §2 for the full layer breakdown.
- Backend entity functions (`src/entities/*/api/`) are written against narrow,
  dependency-injected interfaces so the highest-risk logic — Gemini response
  parsing, score computation, the full grade-submission pipeline — is
  unit-tested without live credentials; the Supabase/Gemini-backed
  implementations are thin, untested adapters wired at the API route / page
  level. `entities/submission/api/gradeSubmission.ts` owns the whole
  `POST /api/grade` sequence as one interface — the route itself is pure
  HTTP translation.
- Dashboard, Syllabus, Results, and History are React Server Components
  fetching data directly (not through a separate REST layer) — simpler than
  a full GET API for read-only screens, while `POST /api/upload`,
  `POST /api/grade` (the flow the assignment evaluates), and
  `POST /api/credits/topup` remain real API routes.
- The four screens that need a header/bottom-nav share one `ScreenShell`
  widget rather than each repeating that wrapper — see
  `docs/architecture/system-architecture.html` for how everything fits
  together, or `docs/architecture/grading-flow.html` for the scan-to-grade
  sequence specifically.
- Every screen has exactly one `<h1>` and sits inside a `<main>` landmark
  (`ScreenShell` provides both for the four nav-tab screens in one place),
  so heading/landmark navigation works for screen-reader users on every
  route, not just visually.
- Data straight from Gemini's grading output (`character_results.character`)
  is treated as untrusted past the render boundary — lookups keyed by it use
  a `Map`, not a plain object, since a plain-object lookup keyed by an
  attacker-influenceable string can resolve `Object.prototype` instead of
  `undefined` for a key like `"__proto__"`.
- Design tokens in `src/app/globals.css` were sampled directly from the
  client's mockup images rather than a generic template, converted to OKLCH.

## Known limitations

Scoped out deliberately, not oversights:

- **No real-device camera test yet.** `/scan`'s full upload/grade/retry
  lifecycle and every error state are verified end-to-end against a fake
  camera stream in a real browser — but that's still not a physical phone.
  Real permission prompts, autofocus, and codec behavior are the one thing
  left to confirm before first real-world use.
- **"Share Report" is decorative** — matches the mockup, no handler, since
  it's outside the assignment's evaluation focus (scan → upload → grade →
  feedback). Every other button ("Retest Missed", "Print A4 Worksheet",
  "Top Up") is fully functional.
- **Mobile is the only designed surface — the app itself is responsive
  everywhere.** The brief only supplied mobile mockups, so that's the only
  screen design that exists. But Dashboard, Syllabus, History, and Results
  get a real, working layout at any width (tablet through desktop, 2-column
  reflow, growing further on wide screens) — a parent checking progress on
  an iPad is a realistic scenario, not an edge case. Scan alone gets a
  clean phone-frame presentation on wider screens instead, since there's no
  camera-on-a-monitor use case to design a native layout for.
- **"Print A4 Worksheet (PDF)" only supports the 3 seeded lessons'
  vocabulary.** The bundled font is a hand-picked 170-glyph subset matching
  exactly what those 3 lessons use, not a general Chinese font — printing
  outside that set fails with a clear error instead of a silently blank
  PDF. A full Noto Sans SC file (a one-time asset swap, not a code change)
  is the fix once a 4th lesson is seeded.
- **Dark mode tokens exist but aren't wired up.** `globals.css` defines a
  full `.dark` palette, but nothing applies it — no toggle, no
  `prefers-color-scheme` handling. No dark-mode mockup was supplied and
  theming was outside the assignment's scope.
- **History and Results start empty on a fresh database**, intentionally —
  see the empty state on `/history`. No demo data is seeded, since a
  fabricated history would misrepresent real usage.
- **AI grading accuracy isn't tuned.** The assignment explicitly
  de-prioritizes recognition accuracy in favor of pipeline correctness,
  which is where the effort went instead.

## Beyond the original scope

The assignment scoped 4 screens over roughly a 5-day build. Once that
baseline worked end-to-end, several things were deliberately taken further:

- **Real data everywhere it's reasonably expected, not hardcoded
  placeholders.** Credits, the weekly calendar, and Syllabus completion
  percentages are all computed from actual Supabase rows — only the student
  profile is hardcoded, exactly as the brief instructs.
- **The correction overlay is real**, not a stand-in for it — a red-pen mark
  and the correct word over every miss, a green check over every hit,
  positioned from Gemini's own bounding-box output directly on the graded
  photo. This is the assignment's own named "key evaluation point."
- **Every button does what it looks like it does.** "Retest Missed", "Print
  A4 Worksheet (PDF)" (real `pdf-lib` output), and the camera's flash toggle
  (real hardware torch control) are all fully functional, not decorative.
- **Genuinely responsive, not just "doesn't look broken."** Dashboard,
  Syllabus, History, and Results get a real adaptive layout from mobile
  through desktop — a parent or student checking progress on an iPad is a
  realistic scenario for this product, not an edge case.
- **Several independent audit passes** — security review, a Standards+Spec
  code review, accessibility auditing, domain modeling (→ `CONTEXT.md` + 2
  ADRs), and a real-device compatibility sweep across 10+ real iPhone/iPad/
  Pixel/Galaxy profiles — each either fixed a real bug or explicitly
  confirmed there was nothing to fix. The most consequential find: Gemini's
  response schema didn't specify whether its `character` field meant the
  expected word or a transcription of what was actually written — a wrong
  answer's correction overlay was showing the student's own mistake back as
  "correct," on the app's own key evaluation point. Fixed and reverified
  against the live API.
- **A view-only stroke-order practice animation** for missed characters,
  added at explicit request beyond the original PRD scope.
- **A gallery-upload fallback and WebP capture**, added once live testing on
  a real phone surfaced them as genuine gaps. `/scan` no longer requires the
  live camera — "Choose from Gallery" hands off to the exact same
  upload/grade pipeline. Every captured or gallery-picked photo is now
  re-encoded to WebP (confirmed a Gemini-supported input format, not
  assumed) before upload, typically 25-35% smaller than the JPEG this
  produced before, with a safe PNG fallback on any browser that can't
  encode WebP.

Full reasoning, every fix, and the complete dated build log:
`docs/planning/FSD_TingXieHero.md` §6.

## Deployment

Live at https://tingxie-hero-lms.vercel.app, deployed via the Vercel CLI to a
dedicated project (`tingxie-hero-lms`) on its own, separate from any other
project on the same Vercel account. The three variables from `.env.example`
are set as encrypted project environment variables (Production + Preview):
`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`.

Not connected to auto-deploy-on-push — every deploy is a deliberate, manually
triggered `vercel deploy --prod` rather than automatic on every commit.
