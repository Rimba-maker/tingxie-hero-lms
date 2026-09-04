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
    real grading → real results" (mobile only — no desktop/tablet layout is
    in scope, confirmed against the source PDF, not just the mockup images)
    — run it through Playwright, don't just eyeball it.
11. **`security-review`** (built-in) — final pass before submitting: confirm
    `SUPABASE_SERVICE_ROLE_KEY` and `GEMINI_API_KEY` never reach client
    bundles, per FSD §7/§8 and PRD's security NFR.
12. **`fewer-permission-prompts`** (built-in, optional) — reduce approval
    friction for the remaining `gh`/`vercel`/`npm` calls in this phase.

## Phase 6 — Maturity & pre-showcase audit (beyond the original 5-day plan)

Not part of FSD §6's original build order — run afterward, once Phases 1-5 were
functionally complete, as an explicit "make this as mature as possible before
showcase" pass. Reference: FSD §6's own "Phase 6" section documents what each
of these actually found.

13. **`mattpocock-skills:improve-codebase-architecture`** — repo-wide deepening
    review (module/interface/depth/seam vocabulary from `codebase-design`).
    Run this before `ponytail-audit`, not after — architecture findings
    (shallow modules, missing locality) are a different failure mode than
    over-engineering findings, and fixing depth issues first means the
    over-engineering pass isn't auditing code that's about to change shape.
14. **`ponytail-audit`** — repo-wide over-engineering/dead-code scan (distinct
    from the `ponytail` cross-cutting discipline above — this is the explicit
    audit command, not just the always-on lazy-dev persona). Verify every
    proposed cut against the actual build/test suite before committing it —
    this project had one audit finding (dropping `esbuild` as a direct
    dependency) that looked correct via `npm ls` but broke the build in
    practice.
15. **`mattpocock-skills:grill-me`** — self-answered (or user-answered)
    interview to sharpen what "showcase-ready" actually requires, before
    doing more work speculatively. Decisions from this project's run: add
    real upload validation (a genuine trust-boundary gap), add README
    screenshots + Known Limitations + Deployment sections, explicitly do NOT
    seed demo data into the review database and do NOT invest in a dark-mode
    pass.
16. **`ui-ux-pro-max`** (re-invoked, not `design-taste-frontend`) — for any
    further UI work after the initial Phase 4 build. Scored explicitly during
    this project's Phase 6 (9/10 vs 3/10) specifically because
    `design-taste-frontend`'s own scope note excludes dashboards/dense
    product UI — see FSD §6 Phase 6 for the full comparison. Used for a
    mockup-fidelity pass on the Results screen, which caught a real
    pluralization bug ("1 characters missed").

## Cross-cutting, every phase

- **`ponytail`** (already active) — keep it on. 5-day scope, no room for
  speculative abstraction; this is the discipline that keeps FSD's
  Open/Closed reminder actually followed.
- **`run`** (built-in) — after finishing each phase's checklist items, launch
  the app and look at it before moving to the next phase, not just after
  Phase 5.
