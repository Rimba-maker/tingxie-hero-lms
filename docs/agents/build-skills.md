# Build Skills

Which installed skills to invoke, and when, while executing the Build Order in
`docs/planning/FSD_TingXieHero.md` §6. Mapped to that doc's 5 phases — read this
before starting each phase, not all at once.

Skills not listed here (Prisma, Drizzle, MySQL, Nuxt, SvelteKit, Go, Redis,
Turborepo, better-auth, ...) don't match this stack — skip them regardless of
what else is installed.

## Phase 1 — Foundation

1. **`shadcn`** — project init (`npx shadcn init`) and adding the primitives
   FSD §1 names (Table, Badge, Tabs, Card) into `shared/ui/`.
2. **`supabase-postgres-best-practices`** — load BEFORE applying the DDL in
   FSD §3. Check the `character_results`/`submissions` schema and the
   `worksheet-photos` bucket access policy against current best practice
   (RLS, index choices) before running it, not after.
3. **`mattpocock-skills:wizard`** — generate a bash wizard for the steps only
   a human can click through: creating the Supabase project, copying the
   service role key, creating the Vercel project, setting env vars in both
   dashboards. Don't use it for anything the agent can do itself (e.g. `gh
   repo create` — already done).

## Phase 2 — Core Backend Pipeline (highest-risk phase per FSD §6)

4. **`mattpocock-skills:tdd`** — build `POST /api/upload` and `POST /api/grade`
   test-first. FSD itself flags this pipeline as "the highest-value,
   highest-risk part of the assignment" — red-green-refactor here catches
   Gemini response-shape drift before it reaches the DB.
5. **`context7`** (already used once for Serwist/Gemini/Supabase) — re-invoke
   only if implementation needs to deviate from the FSD §5 code sample.

## Phase 3 — Camera + Upload Flow (Screen 3)

Reference: `docs/reference/mockups/screen3-camera.png` — viewfinder overlay
with corner brackets, "Align Worksheet" header, "Keep page flat and inside
the brackets" hint, white shutter button, "Capture & Grade" label.

6. **`vercel-react-best-practices`** — client state/data-fetching patterns for
   the `useCameraCapture` + `useUploadSubmission` (Zustand) flow.
7. **`webapp-testing`** (Playwright) — verify camera permission prompt,
   capture, and upload states actually work in a real browser, not just
   type-check.

## Phase 4 — Results, Dashboard, Syllabus (Screens 1, 2, 4)

Reference: `docs/reference/mockups/` — `screen1-dashboard.png` (credits card +
Top Up, mastery rate/practiced stat pair, weekly calendar strip, upcoming
Ting Xie banner, "Scan & Grade Worksheet" CTA), `screen2-syllabus.png` (P1–P6
pill tabs, lesson cards with status tags, "Print A4 Worksheet (PDF)" link
per card), `screen4-results.png` (score ring + percentage, results-over-time
character × date table, Share Report / Retest Missed buttons). Assignment
brief says to match these "as closely as possible" — treat them as the
spec, not loose inspiration.

8. **`ui-ux-pro-max`** — concrete palette/typography/spacing decisions across
   the 4 screens before writing markup, so components aren't restyled twice.
9. **`impeccable`** — polish pass once screens are built: hierarchy,
   accessibility, responsive behavior. (Not `design-taste-frontend` — that
   skill explicitly excludes dashboards/data tables/multi-step product UI,
   which is exactly what these screens are.)

## Phase 5 — PWA, Polish, Deployment

10. **`webapp-testing`** — the FSD §6 Phase 5 checklist item "real photo →
    real grading → real results, desktop and mobile" — run it through
    Playwright, don't just eyeball it.
11. **`security-review`** (built-in) — final pass before submitting: confirm
    `SUPABASE_SERVICE_ROLE_KEY` and `GEMINI_API_KEY` never reach client
    bundles, per FSD §7/§8 and PRD's security NFR.
12. **`fewer-permission-prompts`** (built-in, optional) — reduce approval
    friction for the remaining `gh`/`vercel`/`npm` calls in this phase.

## Cross-cutting, every phase

- **`ponytail`** (already active) — keep it on. 5-day scope, no room for
  speculative abstraction; this is the discipline that keeps FSD's
  Open/Closed reminder actually followed.
- **`run`** (built-in) — after finishing each phase's checklist items, launch
  the app and look at it before moving to the next phase, not just after
  Phase 5.
