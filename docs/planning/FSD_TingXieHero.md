# FSD — TingXie HERO: Technical Architecture & Build Plan
**Companion docs:** `PRD_TingXieHero.md` (product requirements & scope) ·
`CONTEXT.md` + `docs/adr/` (domain glossary and load-bearing decisions,
repo root) · `docs/architecture/` (interactive system-architecture and
grading-flow sequence diagrams)
**Architecture style:** Feature-Sliced Design (FSD), Open/Closed principle — new feature = new file/folder, avoid modifying shared code across features
**Status:** Build complete (Phases 1-5) + several maturity/audit passes beyond the original 5-day plan — see §6. This document reflects the **as-built** system, not the original plan; where the two diverged, a note explains why.

---

## 1. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16 (App Router, Turbopack) | |
| Language | TypeScript (strict mode) | |
| Styling | Tailwind CSS v4 + Shadcn UI (base-nova/base-ui style) | Table, Badge, Tabs, Card, Button, Avatar, Skeleton components |
| Database | Supabase (PostgreSQL) | |
| Storage | Supabase Storage Bucket | For uploaded worksheet photos |
| AI Vision | Google Gemini via `@google/genai` SDK | Model: `gemini-flash-latest` (Google-maintained alias) — `gemini-2.5-flash` was retired for new API keys mid-build, its suggested replacement `gemini-3.6-flash` hit consistent 503s, so the alias was chosen specifically to avoid another manual version bump on the next deprecation |
| Deployment | Vercel | Frontend + API routes together. **Not yet deployed** — deliberately deferred pending final review (see §8) |
| PWA | Serwist (`@serwist/next` + `@serwist/turbopack` + `@serwist/cli`) | Configurator mode, required for Turbopack (webpack-only `next-pwa` doesn't work here) |
| State (client) | Zustand | `useUploadSubmission` store only — everything else is server-fetched or local `useState` |
| Icons | lucide-react | |
| Utilities | class-variance-authority, clsx, tailwind-merge | shadcn's standard variant/className stack |
| PDF generation | `pdf-lib` + `@pdf-lib/fontkit` | Real Tian Zige practice-sheet PDF for "Print A4 Worksheet" (Phase 12) — dynamically imported, not in the main bundle |
| Stroke-order animation | `hanzi-writer` | Results screen's "Practice writing" section (Phase 16) — dynamically imported; per-character stroke data fetched from its default CDN at runtime, not bundled |
| Testing | Vitest (unit) + Playwright (E2E) | See PRD §8 Non-Functional Requirements for current test counts |

---

## 2. Feature-Sliced Design Folder Structure (as built)

```
src/
├── app/                                    # Next.js App Router — routing shell
│   ├── (dashboard)/
│   │   ├── page.tsx                        # Screen 1 route (RSC, force-dynamic)
│   │   ├── loading.tsx
│   │   └── error.tsx
│   ├── syllabus/
│   │   ├── page.tsx                        # Screen 2 route
│   │   ├── loading.tsx
│   │   └── error.tsx
│   ├── scan/
│   │   └── page.tsx                        # Screen 3 route (renders ScanScreen, client-side camera flow)
│   ├── results/[submissionId]/
│   │   ├── page.tsx                        # Screen 4 route
│   │   ├── loading.tsx
│   │   └── error.tsx
│   ├── history/
│   │   ├── page.tsx                        # Not in original 4-screen scope — added because the
│   │   │                                    # bottom nav's "History" tab needs a real destination;
│   │   │                                    # lists past graded submissions, links into Results
│   │   ├── loading.tsx                     # Added Phase 13 — was the one route missing the
│   │   └── error.tsx                       # loading-skeleton/error-boundary pair every other route had
│   ├── premium/
│   │   └── page.tsx                        # Stub page (bottom nav needs a destination; feature is
│   │                                        # explicitly out of scope per PRD §4). Builds directly on
│   │                                        # `ScreenShell` — no dedicated `screens/premium/` file exists
│   │                                        # for a page this trivial.
│   ├── api/
│   │   ├── upload/route.ts                 # POST /api/upload
│   │   ├── grade/route.ts                  # POST /api/grade
│   │   └── credits/topup/route.ts          # POST /api/credits/topup — the real "Top Up" button (Phase 7)
│   ├── manifest.ts                         # PWA manifest
│   ├── sw.ts                               # Serwist service worker source
│   ├── layout.tsx
│   └── global-error.tsx
│
├── screens/                                # FSD "pages" layer — screen compositions
│   ├── dashboard/ui/DashboardScreen.tsx
│   ├── syllabus/ui/SyllabusScreen.tsx
│   ├── scan/ui/ScanScreen.tsx
│   ├── results/ui/ResultsScreen.tsx
│   └── history/ui/HistoryScreen.tsx
│
├── widgets/                                # composed UI blocks used by screens
│   ├── app-header/
│   │   ├── model/types.ts                  # Viewer type ({ parentName, studentName, moeLevel }) —
│   │   │                                    # added Phase 14 so ScreenShell has one shape to pass around
│   │   └── ui/AppHeader.tsx                # shared avatar + welcome text + level pill + bell
│   ├── screen-shell/ui/ScreenShell.tsx     # wraps AppHeader + page content + BottomNav for the 4
│   │                                        # screens that need them (added Phase 14 — collapsed a
│   │                                        # duplicated header/nav wrapper repeated across all 4 pages)
│   ├── bottom-nav/ui/BottomNav.tsx         # Dashboard / Syllabus / History / Premium
│   ├── credits-card/ui/CreditsCard.tsx
│   ├── mastery-stats/ui/MasteryStats.tsx
│   ├── weekly-calendar-strip/ui/WeeklyCalendarStrip.tsx
│   ├── lesson-card/ui/LessonCard.tsx
│   ├── camera-viewfinder/ui/CameraViewfinder.tsx
│   ├── score-header/ui/ScoreHeader.tsx
│   ├── worksheet-overlay/ui/WorksheetOverlay.tsx  # Phase 7 — renders the graded photo with the
│   │                                        # red-pen/green-check correction marks (the assignment's
│   │                                        # own key evaluation point). Additive to, not a
│   │                                        # replacement for, the historical matrix below.
│   └── historical-matrix/ui/HistoricalMatrix.tsx
│
├── features/                               # user actions / interactions
│   ├── capture-worksheet/
│   │   ├── model/useCameraCapture.ts       # getUserMedia + canvas capture, real browser-API complexity
│   │   └── ui/ShutterButton.tsx
│   ├── upload-submission/
│   │   └── model/useUploadSubmission.ts    # Zustand store: POST /api/upload -> POST /api/grade,
│   │                                        # tracks idle/uploading/grading/success/error,
│   │                                        # upload() resolves to the terminal state (not void)
│   ├── print-worksheet/ui/PrintWorksheetButton.tsx  # Phase 12 — generates the real Tian Zige PDF;
│   │                                        # preloads the pdf-lib chunk on hover/focus (Phase 13)
│   ├── top-up-credits/ui/TopUpButton.tsx   # Phase 7 — real POST /api/credits/topup, router.refresh()
│   └── practice-stroke-order/ui/StrokeOrderCard.tsx  # Phase 16 — hanzi-writer animation per missed
│       # character on Results, one glyph per character in a multi-character word
│       # No expand-lesson or select-level-tab feature folders — both were single-caller
│       # (SyllabusScreen only) thin useState wrappers, inlined during a repo-wide
│       # over-engineering audit (ponytail-audit). MOE_LEVELS/MoeLevel now live as a
│       # local const/type in SyllabusScreen.tsx.
│
├── entities/                               # domain models — pure data shape + fetch logic
│   ├── lesson/
│   │   ├── model/
│   │   │   ├── types.ts                    # Lesson, VocabEntry
│   │   │   └── buildPinyinLookup.ts        # Phase 18 — VocabEntry[] -> Map<character, pinyin>;
│   │   │                                    # a Map, not a plain object, since it's indexed by
│   │   │                                    # Gemini-sourced, unvalidated character strings
│   │   └── api/
│   │       ├── getLessons.ts
│   │       └── generateWorksheetPdf.ts     # Phase 12 — real Tian Zige practice-sheet PDF via
│   │                                        # pdf-lib + @pdf-lib/fontkit, subset Noto Sans SC font
│   ├── submission/
│   │   ├── model/types.ts
│   │   └── api/
│   │       ├── createSubmission.ts         # POST /api/upload step 2: insert pending submission
│   │       ├── uploadWorksheetImage.ts     # POST /api/upload step 1: Storage upload
│   │       ├── validateWorksheetImage.ts   # trust-boundary check (image MIME + <=4MB) before
│   │       │                               # either of the above run
│   │       ├── gradeSubmission.ts          # Phase 10 — owns the whole POST /api/grade sequence as
│   │       │                               # one interface (DB adapters + Gemini client + image
│   │       │                               # fetcher as dependencies); the route is pure HTTP glue
│   │       ├── gradingErrors.ts            # Phase 10 — SubmissionNotFoundError, GeminiGradingError
│   │       ├── getSubmissionForGrading.ts  # fetch image_url + vocabList
│   │       ├── gradeWithGemini.ts          # prompt, safety settings, mediaResolution, response
│   │       │                               # parsing, score computation
│   │       ├── mapGradeError.ts            # instanceof-matches gradingErrors.ts to an HTTP status
│   │       ├── saveGradingResult.ts        # write character_results, update
│   │       │                               # submissions.status/graded_at
│   │       ├── getSubmissionDetail.ts      # Results screen data (joins lessons for week_number
│   │       │                               # + vocabulary, the latter driving the historical
│   │       │                               # matrix's per-character pinyin, Phase 15)
│   │       └── listSubmissionHistory.ts    # History screen data (graded submissions only)
│   ├── character-result/
│   │   ├── model/
│   │   │   ├── types.ts                    # CharacterResult
│   │   │   └── boundingBoxToOverlayStyle.ts  # Phase 7 — pure box_2d -> CSS-percentage mapping,
│   │   │                                    # TDD seam for WorksheetOverlay
│   │   └── api/
│   │       ├── getCharacterHistory.ts      # batched query across all matching characters
│   │       │                               # (one query, not N+1 per character)
│   │       └── buildCharacterHistoryMatrix.ts  # pure pivot logic (rows/cols), TDD seam
│   └── student/                            # Phase 7 — credits card + Top Up, not hardcoded
│       ├── model/types.ts                  # StudentCredits
│       └── api/
│           ├── getStudentCredits.ts        # total/used/expiresOn — "used" is derived from the
│           │                               # student's actual submissions count, nothing to keep in sync
│           └── topUpCredits.ts             # POST /api/credits/topup step: +10 credits
│
└── shared/                                 # cross-cutting, no business logic
    ├── lib/
    │   ├── supabase/
    │   │   └── server.ts                   # server-only client, service role key, lazy singleton
    │   │       # No browser client (shared/lib/supabase/client.ts) — removed as dead code.
    │   │       # This app is server-only per PRD §2 (no auth/session), so nothing ever
    │   │       # needed a browser-side Supabase client.
    │   ├── gemini/client.ts                # server-only, lazy singleton
    │   ├── pluralize.ts                    # count-aware singular/plural helper, used at every
    │   │                                    # count+noun display (characters, lessons, lists)
    │   ├── formatTestSchedule.ts           # Phase 7 — pins Asia/Singapore explicitly via Intl,
    │   │                                    # independent of the server's ambient local timezone
    │   ├── getCurrentWeekDays.ts           # Phase 7 — real current Mon-Sat week from Date
    │   └── utils.ts                        # cn() (clsx + tailwind-merge)
    ├── ui/                                  # Shadcn primitives: Button, Card, Badge, Tabs, Table,
    │                                        # Avatar, Skeleton
    └── config/
        ├── requireEnv.ts                   # shared "throw if missing" helper
        ├── currentStudent.ts               # CURRENT_STUDENT_ID — the single hardcoded student row,
        │                                    # no auth in scope
        ├── env.client.ts                   # NEXT_PUBLIC_SUPABASE_URL only
        └── env.server.ts                   # SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY,
                                             # `server-only`-guarded
```

**No `shared/types/api.ts`.** The original sketch planned shared request/response types for a
separate GET API layer; that layer was never built (see §4), so there's nothing to type there —
each server-fetching screen imports its entity function's own return type directly.

**Open/Closed reminder:** when adding a new screen or widget later, create a new folder under the
relevant layer — never bolt unrelated logic onto an existing entity/widget file.

---

## 3. Database Schema (Supabase / PostgreSQL DDL)

**Source of truth:** `supabase/schema.sql` + `supabase/seed.sql` — reviewed against the
`supabase-postgres-best-practices` skill before applying (RLS policies, FK indexes, status check
constraints, `numeric(4,1)` for scores, storage bucket policy). Read those files directly for the
authoritative, fully-commented version; the summary below is for orientation only.

**Tables:** `lessons` (syllabus content + vocabulary jsonb; `test_scheduled_at` timestamptz,
nullable — drives the Dashboard's "Upcoming Ting Xie" banner and calendar-strip event dot),
`submissions` (one graded worksheet scan, FK to `lessons`), `character_results` (per-character
grading outcome, FK to `submissions`, cascade delete; `bounding_box` jsonb, nullable — Gemini's
`box_2d`, drives the Results screen's photo overlay, see §5), `students` (single hardcoded row —
no auth in scope — owning `credits_total`/`credits_expire_at`; "used" credits are derived from the
student's actual `submissions` count, not a separately-maintained counter).

Applied directly to the live Supabase project via the linked `supabase` CLI (`supabase db query
--linked`) — confirmed authenticated and linked to this exact project (`project-ref` file matches
`NEXT_PUBLIC_SUPABASE_URL`) before every DDL statement, each one run only after explicit
per-migration confirmation. All migrations so far are additive (new nullable column, new table) —
nothing dropped or overwritten.

**RLS:** No end-user auth in scope, so no `auth.uid()`-scoped policies. All three tables get a
public-read policy for `anon`/`authenticated`; writes only ever happen server-side via the service
role key, which bypasses RLS entirely.

**Storage:** `worksheet-photos` bucket, public. Public rather than signed-URL because the upload
flow needs a URL immediately usable without a round trip. The Results screen's `WorksheetOverlay`
now renders this photo directly (client-side `<img>`, public URL, no signed-URL round trip needed)
alongside the server-side read in `POST /api/grade` (which fetches the same image to send to
Gemini) — so the original "client renders it directly" reasoning for a public bucket now matches
what's actually built, not just the upload path.

**Seed data** (`supabase/seed.sql`, matches PRD §6 Screen 2): 3 lessons for P2 (weeks 2-4, one each
of `pending`/`completed`/`needs_revision` status) with their vocabulary lists. P1 and P3-P6 have no
seed lessons — the Syllabus screen's tab selector for those levels correctly renders an empty
state.

---

## 4. API Contract

Three real API routes. `POST /api/upload` and `POST /api/grade` are the flow the assignment
evaluates; `POST /api/credits/topup` is the real "Top Up" button (Phase 7). Everything else
(Dashboard, Syllabus, Results, History) is a React Server Component fetching its entity function
directly, **not** a separate GET API layer — see the note at the end of this section for why.

### `POST /api/upload`
**Request:** `multipart/form-data` — `{ image: Blob, lessonId: string }`

**Server logic:**
1. Validate the image (`validateWorksheetImage`: must be `image/jpeg`/`png`/`webp`, ≤4MB — kept
   under Vercel's own 4.5MB request body cap, see Phase 38) — 400 with a clear message if not,
   before anything touches Storage.
2. Upload to Supabase Storage bucket `worksheet-photos` (`uploadWorksheetImage`).
3. Insert a `submissions` row with `image_url`, `lesson_id`, `status: 'pending'`
   (`createSubmission`).

**Response:** `{ "submissionId": "uuid", "status": "pending" }`

### `POST /api/grade`
**Request:** `{ "submissionId": "uuid" }`

**Server logic** — the route itself is pure HTTP translation (parse body → call the pipeline →
map error → respond); the sequence below lives entirely in `entities/submission/api/gradeSubmission.ts`
(`gradeSubmission`), one interface taking the DB adapters, Gemini client, and image-fetcher as
dependencies (see §6 Phase 10 for why this was pulled out of the route):
1. Fetch the submission's `image_url` and its lesson's `vocabulary` list (`getSubmissionForGrading`
   — throws the typed `SubmissionNotFoundError` if the submission doesn't exist).
2. Fetch the image and base64-encode it (`fetchImageAsBase64`).
3. Call Gemini with the prompt + `responseSchema` + `safetySettings` (`BLOCK_ONLY_HIGH` — content
   is always a benign child's worksheet photo) + `mediaResolution: MEDIA_RESOLUTION_HIGH`
   (`gradeWithGemini`). The SDK call itself, a blocked response, and an unparseable response all
   throw the typed `GeminiGradingError` — including a live 503 "high demand" case from the model
   itself, confirmed in Phase 10.
4. Write `character_results` rows (including `bounding_box` when Gemini returned one), update
   `submissions.status = 'graded'`, `graded_at = now()` (`saveGradingResult`).

`mapGradeError` matches `SubmissionNotFoundError`/`GeminiGradingError` by `instanceof` (404/502
respectively) — not by string-prefixing `error.message` as it did before Phase 10.

**Response:**
```json
{ "submissionId": "uuid", "score": 8, "totalPossible": 10,
  "results": [{ "character": "校园", "isCorrect": true,
    "boundingBox": { "ymin": 100, "xmin": 200, "ymax": 300, "xmax": 400 } }, ...] }
```

### `POST /api/credits/topup`
**Request:** none (no body)

**Server logic:** `topUpCredits` adds a fixed +10 to the hardcoded student's `credits_total`.
"Used" credits are never stored — `getStudentCredits` always derives them from a live count of that
student's `submissions` rows, so there's nothing here that can drift out of sync.

**Response:** `{ "creditsTotal": number }`. The Dashboard's Top Up button calls this then
`router.refresh()` — no client-side cache to invalidate since the credits card is server-rendered.

**Why no `GET /api/submissions/:id` or `GET /api/character-history` routes** (both were in the
original plan): Dashboard, Syllabus, and Results are React Server Components that call their
entity function directly (`getSubmissionDetail`, `getCharacterHistory`, etc.) with
`export const dynamic = "force-dynamic"`. This is simpler than a full GET API for read-only screens
and avoids an unnecessary network hop — the client-observable "flow" the assignment actually grades
(upload → grade → feedback) is entirely `POST /api/upload` + `POST /api/grade`, which remain real
API routes. Supabase queries still live inside `entities/*/api/` either way — screens and widgets
never call Supabase directly, so the narrow-interface/seam discipline that a GET API would have
enforced is preserved without the extra layer.

---

## 5. Gemini Integration Detail

```ts
// src/shared/lib/gemini/client.ts — server-only, lazy singleton
import { GoogleGenAI } from "@google/genai";
import { getServerEnv } from "@/shared/config/env.server";

let client: GoogleGenAI | undefined;
export function getGeminiClient(): GoogleGenAI {
  if (!client) {
    const { geminiApiKey } = getServerEnv();
    client = new GoogleGenAI({ apiKey: geminiApiKey });
  }
  return client;
}
```

```ts
// src/entities/submission/api/gradeWithGemini.ts (server-only, TDD'd — 5 tests)
const GEMINI_MODEL = "gemini-flash-latest";

const response = await geminiClient.models.generateContent({
  model: GEMINI_MODEL,
  contents: [{ role: "user", parts: [
    { text: buildPrompt(vocabList) },
    { inlineData: { mimeType: "image/jpeg", data: imageBase64 } },
  ]}],
  config: {
    mediaResolution: "MEDIA_RESOLUTION_HIGH", // same 256 tokens/image as MEDIUM, better stroke detail
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
    ],
    responseMimeType: "application/json",
    // array of { character, isCorrect, box_2d?: [ymin, xmin, ymax, xmax] } —
    // box_2d normalized 0-1000, Gemini's documented object-detection output
    // shape (confirmed via Context7), drives WorksheetOverlay's red/green
    // marks on the graded photo — the assignment's own "key evaluation point"
    responseSchema: { /* ... */ },
  },
});

const blockReason = response.promptFeedback?.blockReason;
if (blockReason) throw new Error(`Gemini blocked this image: ${blockReason}`);

const results = JSON.parse(response.text); // still try/catch'd — untrusted external output
const score = results.filter((r) => r.isCorrect).length;
// totalPossible = results.length, NOT vocabList.length — Gemini sometimes grades
// each character individually rather than per-word, so a 3-word list can come
// back as 6 results (confirmed live). totalPossible must match what was actually graded.
```

**Deprecation history during this build:** the FSD originally specced `gemini-2.5-flash`
(substituted from the assignment's named `gemini-1.5-flash`, already deprecated at spec time).
`gemini-2.5-flash` itself then returned 404 "no longer available to new users" once live credentials
were connected. Its suggested replacement, `gemini-3.6-flash`, hit consistent 503 "high demand"
across multiple retries. Settled on the `-latest` alias Google maintains, specifically so the next
model retirement doesn't need another manual version bump.

**Future mitigation option, not implemented:** researched against the current `@google/genai`
docs (via context7) while looking for anything else worth upgrading — the SDK exposes
`ai.models.get({ model })`, returning a `ModelStatus` with a `modelStage` field
(`STABLE`/`DEPRECATED`/`RETIRED`/etc.) and an optional `retirementTime`. Given this build already
hit two real model retirements (above), this is a genuine way to detect the next one proactively
instead of via a live 404/503. Deliberately not built: it's an extra API call on every grading
request for a failure mode the `-latest` alias already mitigates by design, and this assignment's
own Non-Functional Requirements don't prioritize performance or resilience hardening. Worth
revisiting if this pipeline is ever operated for real, ongoing use.

---

## 6. Build History

### Phases 1-5 (original 5-day plan) — complete
- **Phase 1 — Foundation:** Next.js/FSD/Tailwind/Shadcn scaffold, Supabase project + schema + seed,
  git repo.
- **Phase 2 — Core backend pipeline:** `POST /api/upload`, `POST /api/grade`, TDD'd against fakes,
  then verified live end-to-end (real upload → real Gemini call → real Supabase write → real
  Results render) once credentials were connected. Two real bugs found and fixed this way: the
  Gemini model deprecation cascade above, and `totalPossible` computed from `vocabList.length`
  instead of the actual result count.
- **Phase 3 — Camera + upload flow:** `useCameraCapture`, `CameraViewfinder`, chained into
  `useUploadSubmission`. Layout/error paths verified via Playwright; the live camera stream itself
  needs a real device (headless Chromium's fake camera device doesn't work in this dev
  environment — confirmed via a direct `getUserMedia` test).
- **Phase 4 — Results, Dashboard, Syllabus:** built against mockups, then a dedicated visual-fidelity
  pass compared each screen pixel-by-pixel against `docs/reference/mockups/*.png` and fixed every
  discrepancy found (colors, spacing, alignment, a real WCAG contrast bug in the warning Badge
  variant, a real vertical-alignment bug in the lesson card header).
- **Phase 5 — PWA:** Serwist Configurator mode (required for Turbopack), manifest, icons. Service
  worker registration confirmed live via Playwright (registers → installs → activates → controls
  the page, zero console errors).

### Phase 6 (beyond the original plan) — maturity & pre-showcase audit
Not in the original 5-day scope, done afterward as an explicit "make this as mature as possible
before showcase" pass:
- **`mattpocock-skills:improve-codebase-architecture`** — repo-wide deepening review. Found one real
  issue (`useUploadSubmission`'s `upload()` returned `void`, forcing the one caller to reach past
  the reactive store binding via `.getState()`) and fixed it; everything else in the codebase was
  already appropriately deep (entity layer, `gradeWithGemini`) or appropriately shallow
  (presentational UI).
- **`ponytail-audit`** — repo-wide over-engineering scan. Cut: 39 lines of dead shadcn-scaffold CSS
  tokens (chart/sidebar, zero consumers), the entire unused browser Supabase client (and the env var
  it was the sole consumer of), two single-caller feature hooks inlined into `SyllabusScreen`. One
  finding (dropping `esbuild` as a direct devDependency) was reverted after it broke the build —
  `@serwist/cli` needs it present but doesn't force-install it itself.
- **`mattpocock-skills:grill-me`** — self-answered pre-showcase readiness interview. Added real
  upload validation (`validateWorksheetImage`, a genuine trust-boundary gap — no size/MIME check
  existed before), README screenshots + a Known Limitations section + a Deployment-readiness
  section. Explicitly decided *against* seeding demo data into the review database (fabricated
  `submitted_at` history would look like faked usage to a technical reviewer) and against a
  dark-mode polish pass (brief and mockups are light-only).
- **Deep audit + doc refresh** (this pass) — found and closed one real implementation gap (the
  camera overlay's QR target box was never built, despite being in the assignment's text
  requirements and already assumed-about in the PRD), found and fixed a pluralization bug
  ("1 characters missed") plus 3 latent instances of the same bug elsewhere, then rewrote this
  document and the PRD to match the as-built system rather than the original plan.

### Phase 7 (beyond the original plan) — a second re-read of the source PDF
- **API error surfacing fix** — `/api/upload` and `/api/grade` already returned a clear `{ error }`
  message on failure, but the client never read the response body, so users saw a bare status code
  ("Upload failed: 400") instead of the actual message. Added an uncaught-exception boundary to
  both routes (previously fell through to Next.js's empty-body 500) and fixed the client to read
  `error` from the body.
- **`WorksheetOverlay` — corrected an earlier scope call.** Re-reading the source assignment PDF at
  your prompt (focusing on the Evaluation Focus section's literal subject/object, not the accuracy
  disclaimer next to it) surfaced that "sending back to the front end for overlay of the correct
  word in red pen" is named as the key evaluation point *twice* in the source document, and Screen
  4's earlier "the matrix already covers this" reasoning only satisfied the assignment's Section 5
  layout spec, not this separate, explicitly-flagged evaluation criterion. Extended
  `gradeWithGemini`'s prompt/`responseSchema` to also request a `box_2d` bounding box per character
  (confirmed as a supported `generateContent` output shape via Context7, not assumed), added the
  `bounding_box` column, and built `WorksheetOverlay` to render the graded photo with red-bordered
  "correct word" marks over misses and green check marks over hits. The Historical Matrix Table
  stays — Section 5 names it explicitly by name, so this is additive, not a replacement. Verified
  by inserting a real temp submission (with bounding boxes) into the live DB, rendering the actual
  `/results/[id]` route, screenshotting it, then deleting the temp rows and confirming 0 remain —
  not just the throwaway-preview check the initial commit shipped with.
- **Live DDL access, corrected** — initially told you the service-role key couldn't run schema
  migrations and asked you to hand-run one in the SQL editor. You pushed back; the linked
  `supabase` CLI (`npx supabase db query --linked`) can run arbitrary SQL against the linked
  project directly, confirmed authenticated and pointed at this exact project before use. Used for
  every schema change from here on, always after an explicit per-migration confirmation (Claude
  Code's own auto-approval classifier blocks live DDL from running unattended, correctly).
- **Credits card + calendar strip made real, not hardcoded.** Re-read the Dashboard's Technical
  Requirements bullets closely at your prompt: only the student-profile bullet says "Hardcode" —
  the credits card and calendar strip bullets say "Display"/"Include," which reads as a
  requirement for real, functioning UI, not frozen mockup numbers. Added a `students` table
  (`credits_total`, `credits_expire_at`) with "used" credits derived from the student's actual
  `submissions` count (nothing to keep in sync), a working `POST /api/credits/topup` (+10, wired
  to a real "Top Up" button via `router.refresh()`), and `getCurrentWeekDays` — a small pure
  function computing the real current Mon-Sat week from `Date` (no calendar library needed for
  this). Caught and fixed a real timezone bug in the process: the "Upcoming Ting Xie" banner
  initially showed 10:00 PM instead of the intended 3:00 PM, because the schedule formatter used
  the server's ambient local timezone instead of the product's actual one (Singapore, MOE
  curriculum) — `formatTestSchedule` now pins `Asia/Singapore` explicitly via `Intl`, independent
  of wherever the server happens to run. Verified end-to-end against live data, including clicking
  the real Top Up button and confirming the DB and UI both updated.
- **Syllabus's "Completed (80%)" fixed the same way.** Same re-read, same question applied to
  Screen 2: the assignment only says "Hardcode status tags (Pending, Completed)" — the tag *text*.
  The `(80%)` appended to every completed lesson's badge, unconditionally, was a fabricated number
  riding along inside that string, not the tag itself. `getLessons` now embeds each lesson's most
  recent `submissions` row (ordered `submitted_at desc`, limited to 1 via PostgREST's
  foreign-table order/limit) and a new pure `getStatusLabel` computes the real percentage from it
  — a completed lesson with no graded submission yet correctly shows plain "Completed", not an
  invented number. P1-P6 tabs and the expandable vocabulary cards were already fully real (state-
  driven tab filter, real `lessons.vocabulary` jsonb) — nothing to fix there. Verified by inserting
  a real temp graded submission (8/10) for the seeded "completed" lesson, confirming the card
  rendered "Completed (80%)" computed from that row, then deleting it and confirming 0 remain.

### Phase 8 (beyond the original plan) — PWA installability, verified against current criteria
Checked the PWA Setup requirement ("basic web app manifest settings... so the app installs
seamlessly on mobile home screens") against current Context7-verified docs (Next.js's own
`metadata.icons` reference, web.dev's manifest/richer-install-ui guides) rather than assuming the
Phase 5 build was complete. First finding, before touching code: **modern Lighthouse (v13, checked
directly — `npx lighthouse --only-categories`) has no "PWA" category or installability audits at
all anymore** — `installable-manifest`, `service-worker`, `maskable-icon`, etc. don't exist in its
audit registry any more; Google moved this to manual inspection in Chrome DevTools' Application
panel years ago. There's no numeric "PWA score" to chase — worth knowing so this isn't re-attempted
next time.

Found one real gap: no `apple-touch-icon`. iOS Safari's "Add to Home Screen" doesn't read the web
manifest's `icons` at all — without an explicit `<link rel="apple-touch-icon">` (Next.js
`metadata.icons.apple`), iOS falls back to a screenshot of the page as the home-screen icon, which
directly contradicts "installs seamlessly." Fixed by pointing `icons.apple` at the existing
`icon-192.png` (no new asset needed — iOS scales it). Also added `screenshots` to the manifest
(3 real app screenshots, already sitting in `docs/screenshots/` for the README, copied into
`public/screenshots/`) for Chrome's richer install-UI dialog, and `orientation: "portrait"`,
consistent with the already-documented mobile-only, no-responsive-layout decision.

Verified against the actual current installability criteria (not a score) via Playwright: service
worker active/activated/controlling the page, manifest valid JSON with 192+512+maskable icons and
3 screenshots, `apple-touch-icon` present, correct viewport meta, zero console errors.

### Phase 9 (beyond the original plan) — Camera capture, checked against current platform docs
Same pattern as Phase 8: checked Screen 3's three sub-requirements (Camera API, UI Overlay, Capture
Trigger) against current Context7-verified docs (MDN's `MediaStreamTrack.applyConstraints`,
`ImageCapture`, and constraints guides) before assuming the Phase 3 build was already as good as it
gets, per your instruction to check whether ours was already better first.

Two of the three were already solid: `getUserMedia({ facingMode: "environment" })` for the rear
camera, and the corner-bracket/instruction-text/QR-box overlay, both matched the mockup and needed
no change. The flash toggle button, though, was purely decorative — a `<span>` with a Zap icon, no
`onClick`, nothing it actually toggled. Made it real: `useCameraCapture` now checks
`track.getCapabilities().torch` after the stream starts and exposes `torchSupported`/`torchOn`/
`toggleTorch` (calling `track.applyConstraints({ advanced: [{ torch }] })`); the button in
`CameraViewfinder` is disabled — not hidden — when the capability isn't there, since `torch` has no
Safari/Firefox support at all (confirmed via Context7/MDN, a real platform limit, not a bug to
work around).

Also improved the capture itself: `getUserMedia`'s video constraints now request `width`/`height`
ideal 1920×1080 (an *ideal* hint, degrades gracefully rather than failing outright on cameras that
can't do 1080p), and `capture()` now tries `ImageCapture.takePhoto()` first — it captures at the
camera's full photo resolution, genuinely higher than the video preview stream, where the browser
supports it (Chromium only) — falling back to the original canvas-snapshot-of-the-video-element
approach everywhere else, including if `takePhoto()` itself throws on specific hardware.

Verified what this sandbox can verify: build/lint/tests clean, and a Playwright run against
`/scan` with Chromium's fake camera device confirms the flash button correctly disables (the fake
device reports no `torch` capability) and nothing throws. Isolated one thing before trusting it:
the fake device's `getUserMedia` call itself fails with `NotSupportedError` in this Windows
sandbox — confirmed via a direct `getUserMedia` call that this happens identically with or without
this phase's constraint changes, so it's the same pre-existing sandbox limitation Phase 3 already
documented, not a regression. The torch-on and higher-resolution-capture paths still need a real
device to see working, same as the rest of the camera flow.

**Deliberately still open**, tracked rather than silently left:
- [ ] Vercel env vars set, deploy triggered, live URL added to README — deferred pending your
  explicit go-ahead (standing instruction from earlier in this project).
- [ ] Real-device camera test (`/scan`) — cannot be done from this sandbox; needs a human on an
  actual phone/browser. Now also covers verifying the torch toggle actually lights the flash and
  that `ImageCapture.takePhoto()` produces a visibly higher-res photo than the old canvas path.

### Phase 10 (beyond the original plan) — deepening the grading pipeline
A `mattpocock-skills:improve-codebase-architecture` pass (explore step run by a fresh sub-agent,
not the one that wrote the code, specifically so it wouldn't rationalize away its own friction).
Scoped to the grading pipeline — the hottest area this session — per the codebase-design glossary
(module/interface/depth/seam/leverage/locality). Two candidates taken, one left alone:

- **Collapsed the grading pipeline's orchestration into one module (Strong).** `POST /api/grade`
  used to inline the whole sequence — fetch submission → fetch+encode image → call Gemini →
  persist — directly in the route handler, with the image-fetch-and-encode step untested and
  unowned by any module (no `route.test.ts` existed anywhere under `src/app/api`; only the
  individual pieces were tested with fakes, never the orchestration wiring them together). New
  `entities/submission/api/gradeSubmission.ts` owns the whole sequence as one interface
  (`gradeSubmission(deps, submissionId)`), taking the two DB adapters, the Gemini client, and an
  injected `fetchImageAsBase64` as dependencies — genuinely testable now, with fakes for all four.
  The route is pure HTTP translation: parse body → call the pipeline → map error → respond.
- **Typed the grading pipeline's error contract (Worth exploring).** The interface between the
  throw sites and `mapGradeError` used to be an unenforced string-prefix convention
  (`message.startsWith("Submission not found")`, `message.startsWith("Gemini")`) — renaming a
  thrown message even slightly would have silently degraded the HTTP status to a generic 500, with
  no compile error. New `entities/submission/api/gradingErrors.ts` (`SubmissionNotFoundError`,
  `GeminiGradingError`) replaces the string matching with `instanceof` checks.
- **Left alone: collapsing the ~4 pass-through DB adapter-pair files** (`createSubmission.ts` et
  al.) that are an exact one-line body with no real mapping logic. Technically correct per the
  deletion test, but reopens a decision already made — this file's own §9 records the DI-adapter
  split as a deliberate repo-wide convention, and Phase 6's own architecture pass already concluded
  the rest of the codebase was appropriately deep. Consistency across 10 files wasn't worth
  breaking for a marginal locality win on 4 nobody has had friction with.

**A real, currently-live bug surfaced while verifying the refactor end-to-end, unrelated to the
refactor itself** — worth recording since it directly affects the assignment's actually-evaluated
flow. Verified the refactor was behavior-preserving by running the exact same real submission
through both the old and new code (via `git stash`) before concluding anything: both failed
identically, proving whatever was wrong predated this session's changes. Root cause, found via
temporary diagnostic logging of the raw caught error: `gradeWithGemini`'s `generateContent()` call
itself was throwing an uncaught SDK-level `ApiError` (a live 503 "This model is currently
experiencing high demand" from `gemini-flash-latest` — the same demand issue already documented
above for its predecessor model) that fell straight through every existing catch as an untyped
error, surfacing as the generic "Grading failed, please try again" instead of a clear, accurate
message. Fixed in the same pass since it's exactly the same class of problem as the typed-errors
candidate above: `generateContent()` is now wrapped in its own try/catch, converting any SDK-level
throw into `GeminiGradingError("Gemini is temporarily unavailable, please try again")` — correctly
mapped to a 502 instead of a 500. Verified live: a real upload through `/api/upload`, graded
through the real (still-overloaded) Gemini endpoint, now correctly returns 502 with the accurate
message instead of masking an external outage as our own bug. Test submissions and their Storage
objects deleted after, confirmed via `select count(*)`.

### Phase 11 (beyond the original plan) — a second Postgres best-practices pass
Re-ran `supabase-postgres-best-practices` now that `students` exists and every real query shape in
the app is known (Phase 1's review only had the original spec to go on). Found real gaps this time:

- **`submissions.student_id` had no foreign key at all** — a bare default-valued `text` column,
  nothing stopped an invalid value from ever being inserted once `students` existed alongside it.
  Added `references students(id)`.
- **Two missing domain-invariant `check` constraints**: `students.credits_total >= 0` (nothing
  currently decrements it, but the invariant is cheap to enforce at the database rather than trust
  every future write path) and `submissions.total_score` must be `null` or within
  `[0, total_possible]` (guaranteed by `gradeWithGemini`'s own arithmetic today, same reasoning).
- **Indexes replaced, not just added.** `idx_submissions_submitted_at` (bare) and
  `idx_submissions_lesson_id` (bare) matched neither of the two real query shapes that actually run:
  `listSubmissionHistory` always filters `status = 'graded'` before ordering by `submitted_at`, and
  `getLessons` fetches each lesson's single most recent submission via an embedded
  `.order("submitted_at", { foreignTable: "submissions" }).limit(1, ...)`. Replaced with a partial
  index (`submitted_at desc where status = 'graded'`) for the first, and a composite index
  (`lesson_id, submitted_at desc`) for the second — the composite also serves the FK/cascade lookup
  the old bare `lesson_id` index existed for for free (leftmost-prefix rule), so nothing was lost.
- Fixed a stale comment on the `worksheet-photos` bucket claiming the Results screen "never
  actually displays the photo" — Phase 7's `WorksheetOverlay` does exactly that now.

**Three rules deliberately not applied, reasoning kept in `schema.sql` next to each decision:**
switching UUID primary keys to `bigint identity`/UUIDv7 (submission IDs are exposed in a public URL
— unguessable is a deliberate security property here, not an oversight, and fragmentation is a
large-table concern this dataset will never approach); indexing `submissions.student_id` (every row
has the exact same value in this single-hardcoded-student, no-auth assignment — an index can't
narrow down a column with one distinct value, the planner would ignore it); wrapping
`saveGradingResult`'s two writes in a single Postgres transaction (would need an RPC function since
PostgREST doesn't span a transaction across two separate `.from()` calls — a real gap, but
low-probability and recoverable, not worth the added surface at this scope).

Verified against live data before applying anything (checked for existing rows that would violate
the new constraints — found none), applied via the linked `supabase` CLI after explicit
confirmation, then verified with a real upload through `POST /api/upload` (confirms the new FK
doesn't block a real insert) and all three data-fetching routes (`/`, `/syllabus`, `/history`)
still rendering correctly against the new indexes. Test data cleaned up after.

### Phase 12 (beyond the original plan) — creative feature audit
Documented here retroactively — chronologically this happened between Phase 9 and Phase 10, but
a spec-conformance review (`mattpocock-skills:code-review`) caught that it had never been written
up, leaving PRD/FSD stale against real, shipped behavior. Full research and reasoning live in
`docs/research/feature-ideas-audit.md` and `docs/research/ocr-alternatives.md`; summarized here:

- **Shipped: "Retest Missed"** — was a decorative button. Now a real `Link` to
  `/scan?lessonId=<id>`, since retesting a worksheet means physically handing the child a new copy
  of the same page — there's no meaningful way to "retest only 2 of 3 words" on paper.
- **Shipped: "Print A4 Worksheet (PDF)"** — was a decorative stub (and PRD §6 Screen 2 said so
  until this phase entry corrected it). `generateWorksheetPdf` (`entities/lesson/api`) draws a real
  Tian Zige practice sheet via `pdf-lib` + `@pdf-lib/fontkit`, added to the Tech Stack below. The
  full Noto Sans SC font is 10MB, so it's subset (via `subset-font`/HarfBuzz) down to 26KB by
  scanning every `.ts`/`.tsx` file plus `seed.sql` for non-ASCII characters actually used — a first
  attempt that only scanned `seed.sql` silently dropped the 《 》 brackets the UI adds in code.
  `pdf-lib`/`fontkit` (~1.1MB) are dynamically imported on click, preloaded on hover/focus, and
  excluded from the service worker's precache (a lowered `maximumFileSizeToCacheInBytes` in
  `serwist.config.js`) so the feature costs nothing for someone who never clicks it.
- **Investigated, not built: `jscanify`** (document-edge-detection camera capture). Its real
  browser cost turned out to be an ~8-10MB `OpenCV.js` dependency, not the modest add-on estimated
  when first ranked — roughly 6x the app's entire precache, for a feature that only improves
  recognition accuracy, which the assignment explicitly excludes from evaluation. The existing
  corner-bracket alignment guide already solves the same underlying problem for free.
- **Audited, not integrated: `pinyin-pro`**. Verified all 8 seeded vocabulary entries' pinyin are
  already correct against the library's own derivation; no dependency added since nothing would
  consume it (no content-authoring workflow exists yet to plug it into).
- **Skipped as scope creep: a real `ts-fsrs`-backed Mastery Rate.** Good idea for a real product
  roadmap, not for this assignment — the stat isn't named anywhere in the Technical Requirements.

`pdf-lib` (`^1.17.1`) and `@pdf-lib/fontkit` (`^1.1.1`) are now real runtime dependencies — added
to §1's Tech Stack table.

### Phase 13 (beyond the original plan) — Vercel React best-practices audit
Full audit of the `vercel-react-best-practices` skill's 70 rules against the built app before
changing anything, not the other way around — most rules already matched (Server Components with
no client waterfalls, no barrel imports, memoized hot paths). Two real gaps found and fixed:

- **History was the only route missing the loading-skeleton/error-boundary pair** every other
  route already had (Dashboard, Syllabus, Results). Added `src/app/history/loading.tsx` and
  `error.tsx`, matching the existing pattern exactly.
- **`PrintWorksheetButton` waited for the click to load `pdf-lib`/`fontkit`** (a dynamically
  imported ~1.1MB chunk, per Phase 12). Now preloads that chunk and its font asset on
  `onMouseEnter`/`onFocus` (`bundle-preload`) instead. Verified via a production build that nothing
  loads before hover — Turbopack's dev-mode HMR gave a false "loads eagerly" reading first, which
  was correctly diagnosed as a dev-mode artifact rather than a real bug before "fixing" it.

### Phase 14 (beyond the original plan) — second maturity pass: security, review, domain, diagrams
One approved batch of four distinct skills, run in sequence, each verified against build/lint/test
before moving to the next:

- **`security-review`** — one real hardening fix, everything else correctly filtered as
  non-exploitable: `uploadWorksheetImage` now hardcodes `contentType: "image/jpeg"` on the Storage
  upload instead of trusting the client's `file.type`, closing a spoofed-Content-Type path even
  though no currently-reachable XSS exploit exists today.
- **`mattpocock-skills:code-review`** (Standards + Spec axes) — Standards caught a real duplicated
  layout: all four screens (`DashboardScreen`, `SyllabusScreen`, `HistoryScreen`, `ResultsScreen`)
  repeated the same header/nav wrapper `<div>` plus a conditional `AppHeader`/`BottomNav` pairing.
  New `Viewer` type (`widgets/app-header/model/types.ts`) and `ScreenShell` widget (§2) collapse
  that into one interface. Spec caught a real bug: Syllabus, History, and Premium were passing
  `"P2"` to the header instead of `"Primary 2"` — confirmed against
  `docs/reference/mockups/screen2-syllabus.png`, which spells the level out in full — plus the
  stale PRD wording already corrected in Phase 12's own writeup.
- **`mattpocock-skills:domain-modeling`** — `CONTEXT.md` (repo root): a full glossary for Lesson,
  Submission, Grading, Credits, and every other term this doc and the PRD use. Two ADRs recorded
  under `docs/adr/`: `0001-uniform-di-adapter-pattern` (why the ~4 pass-through DB adapters stay
  split — Phase 6 and Phase 10 had each independently re-suggested and re-rejected collapsing them)
  and `0002-random-uuid-primary-keys` (why Phase 11's fragmentation concern was declined —
  `submissions.id` is exposed in a public URL, and unguessable is a deliberate security property,
  not an oversight).
- **`archify`** — two interactive HTML diagrams under `docs/architecture/`: `system-architecture.html`
  (component topology: PWA → server → Postgres/Storage/Gemini, with the service-role/Gemini-key
  security boundary called out) and `grading-flow.html` (the scan-to-grade sequence, including the
  assignment's own key evaluation point — the bounding-box overlay round-trip). Both passed all 9
  showcase composition checks and a real-browser visual check at four viewport sizes in light and
  dark before being committed.

### Phase 15 (beyond the original plan) — Results-matrix mockup fidelity gap

Re-audited Screen 4's "Historical Matrix Table" requirement against
`docs/reference/mockups/screen4-results.png` directly (not just the PRD prose). Structure already
matched: rows = tested characters, columns = test dates, ✔/✘ pulled live from `character_results`
via `HistoricalMatrix`/`buildCharacterHistoryMatrix`. One real gap found: the mockup shows pinyin
under each hanzi in the Character column; ours showed the hanzi alone. `getSubmissionDetail` now
joins the submission's lesson `vocabulary` and `ResultsScreen` derives a `character → pinyin` map
passed into `HistoricalMatrix` — same character/pinyin stacked-text pattern `LessonCard` already
uses for the Syllabus vocab grid. Verified live against a temporary submission (deleted after).

### Phase 16 (beyond the original plan) — a deliberate scope override, by explicit request

A `mattpocock-skills:grill-me` session, self-answered at your request, weighed three further-upgrade
avenues: adopting an LMS repo, adopting a Mandarin-writing library, or wireframing a new feature.
Research (web search, not assumption): no LMS repo was worth adopting (nothing improves on this
app's intentionally narrow scope); [`hanzi-writer`](https://hanziwriter.org/) (MIT, ~10KB gzipped,
actively maintained, stroke data for 9000+ characters from the Make Me a Hanzi project) is a strong
library, but its only real use — showing correct stroke order — is exactly what
`PRD_TingXieHero.md` §4 already excludes as "Stroke-order tracing/practice screen." The honest
answer was "don't build it, this isn't the gap it looks like." You overrode that and asked for it
anyway — recorded as your explicit decision, not a PDF interpretation, in PRD §4.

Built: a "Practice writing" section on Results, shown only when characters were missed, one
`hanzi-writer` stroke-order animation per missed character plus a "Replay" button
(`features/practice-stroke-order/ui/StrokeOrderCard.tsx`). `hanzi-writer` itself is dynamically
imported (same code-split pattern as `pdf-lib` in Phase 12) so it costs nothing for a perfect score;
its per-character stroke data loads from its default CDN at runtime, not bundled.

**A real bug found during live verification, not just eyeballed:** the first version passed a whole
vocabulary word (e.g. `"温暖"`) to `HanziWriter.create()` as if it were one character. `hanzi-writer`'s
stroke data is keyed per single character — the multi-character word silently 404'd and fell back to
static, unanimated text, with no visible error other than a console 404 caught only by checking
`page.on("console")` during a Playwright screenshot pass. Fixed by splitting each word into its
individual characters (`[...character]`, Unicode-codepoint-aware) and rendering one animation per
glyph, sharing one "Replay" button. Re-verified against a real temp submission with a genuine
2-character missed word, screenshotted, temp rows deleted after.

### Phase 17 (beyond the original plan) — a11y/motion audit of the just-shipped Phase 16 feature

`/wayfinder` was requested for a further-upgrade hunt but is out of fit here (a persistent
multi-session ticket map for a small, near-complete project) and is blocked from direct invocation
anyway (`disable-model-invocation`) — ran a focused manual audit of `StrokeOrderCard` instead, the
one piece of UI shipped in Phase 16 that hadn't been through any accessibility/UX pass yet. Two real
gaps found, both fixed and re-verified live, not just asserted:

- **No accessible name on the animated glyphs.** A screen reader saw an empty `<div>` with
  JS-injected SVG and no text alternative. Added `role="img"` + `aria-label="Stroke order for
  <glyph>"` per glyph, matching the same convention `HistoricalMatrix`'s check/cross icons already
  use. Also gave the shared "Replay" button a per-card `aria-label` (`"Replay stroke order for
  <word>"`) — with one card per missed character, several buttons all announcing as bare "Replay"
  would be ambiguous to a screen-reader user tabbing through.
- **Ignored `prefers-reduced-motion`**, despite this codebase already having that convention
  elsewhere (`LessonCard`'s `motion-safe:` expand/collapse). Reads the media query via
  `useSyncExternalStore` (not a plain `useState`/`useEffect` pair — reading `matchMedia` during
  render would mismatch SSR's no-`window` render, and the first naive fix using state-set-in-effect
  hit exactly that: the animation effect closed over the pre-update value, so the very first
  animation still ignored the preference even though a later render correctly hid the Replay
  button). When `reduce` is set, `showCharacter()` replaces `animateCharacter()` and the
  now-pointless Replay button doesn't render. Verified with two real Playwright browser contexts —
  one default, one `reduced_motion: "reduce"` — confirming the Replay button count (1 vs 0) and the
  glyphs rendering fully-drawn instantly under reduced motion, not just that the code compiled.

### Phase 18 (beyond the original plan) — security-review + code-review of Phases 15-17

Three parallel sub-agent passes against the diff from the last-reviewed commit (`7f3cebf`, end of
Phase 14) to HEAD — the pinyin fix, the stroke-order feature, and its a11y follow-up, none of which
had been through a Standards+Spec code-review or a security-review since landing.

- **`security-review`** — one real bug found and fixed, not just a theoretical concern: the pinyin
  lookup built via `Object.fromEntries` was a plain object indexed with `character_results.character`
  — a string written from Gemini's parsed grading JSON with no server-side charset/enum validation.
  `plainObject["__proto__"]` resolves `Object.prototype` (a truthy object) instead of `undefined`,
  confirmed live (`node -e`), which would crash the Results page's render (`Objects are not valid as
  a React child`) for that submission indefinitely, until manually cleaned from the DB. Fixed by
  extracting a `buildPinyinLookup` selector (`entities/lesson/model/`) that returns a `Map` instead —
  `Map#get` has no prototype-chain lookup surface — with a unit test asserting `__proto__`/
  `constructor` keys correctly return `undefined`. Two other findings were reported but not code-fixed
  after review: a URL-encoding gap inside `hanzi-writer` itself (third-party library internals, no
  viable exploit chain found — a single Unicode code point can't construct a path-traversal sequence
  in one URL segment) and `hanzi-writer`'s default CDN fetch revealing, per missed character, which
  word a specific student struggled with to a third party (`cdn.jsdelivr.net`) via the request URL —
  a real but low-severity privacy trade-off of using the library's default loader rather than a
  self-hosted `charDataLoader`, judged not worth the added complexity for this assignment's scope but
  worth a conscious, written call rather than a silent one.
- **`mattpocock-skills:code-review`** (Standards axis) — one minor smell: `ResultsScreen` computed
  `characterResults.filter((r) => !r.isCorrect)` twice (once for a count, once for the array).
  Deduped to a single `missedCharacters` value feeding both.
- **`mattpocock-skills:code-review`** (Spec axis) — clean. Verified every claim in this document's
  own Phase 15-17 entries against the actual code line-by-line (the join, the pinyin rendering, the
  per-glyph splitting, the `useSyncExternalStore` usage, the per-card aria-labels) — no gaps, no
  undocumented scope creep, no claim that didn't match what the code actually does.

### Phase 19 (beyond the original plan) — a genuinely broken E2E test, found by running it

Widened the audit beyond the recent diff to areas never re-checked this pass. Ran `npx playwright
test` directly instead of trusting the PRD's own coverage claim, and found a real, currently-failing
test: **"history tab shows past results and links into each one"** asserted a `/week \d+/i` link
existed on `/history`, but the shipped database has no permanent seed data (deliberately — see
README's Known Limitations) and genuinely had zero submissions at the time this ran. The test only
ever passed by accident, whenever some leftover row from a manual verification pass happened to
still be in the database when it ran — a non-deterministic dependency on external state, not a real
fixture. It was also never actually testing the empty state PRD §8 claims E2E coverage includes
("both History states (empty and populated)") — no test asserted "No results yet" anywhere.

Fixed by splitting into `test.describe.serial("history states", ...)`: one test asserting the real
empty state first, one test that inserts its own temporary submission via a direct Supabase client
(env vars hand-parsed from `.env.local` — Playwright doesn't auto-load it the way Next.js does, and
adding a `dotenv` dependency for one file wasn't worth it), asserts the populated state and the
click-through to `/results/[id]`, then deletes the row and confirms 0 remain — the same
insert-verify-delete-confirm rhythm used for every manual live-data check throughout this project.
`serial`, not parallel, since both tests hit the same shared `/history` route and would otherwise
race. Verified by running the suite for real (not just reading the diff): 6/6 pass, and an
independent follow-up query confirmed the fixture's cleanup left 0 rows, matching the test's own
assertion rather than just trusting it.

### Phase 20 (beyond the original plan) — app-wide heading/landmark audit

Continued widening the audit into areas never checked this pass. Grepped the whole `src/` tree for
`<h1`/`<h2`/`<h3`/`role="heading"` and for `<main`/`<nav`/`role="main"` — found **zero heading
elements anywhere in the app**, and only the one `<nav>` inside `BottomNav`. A screen-reader user
navigating by heading or landmark (a standard assistive-tech workflow, not an edge case) had nothing
to jump to on any of the 6 screens.

Fixed across all of them, verified with a live Playwright count (`h1`/`main` per screen, not just
reading the diff) confirming exactly one of each everywhere, and a full screenshot comparison
confirming zero visual regression (existing `className`s carried over onto the new tag — Tailwind's
preflight already zeroes default heading margins, so `<p>`/`<span>` → `<h1>` changed nothing visible):

- `ScreenShell` now wraps `{children}` in `<main className="contents">` — `display: contents` keeps
  the landmark without disturbing the outer flex layout's gap spacing. Covers Dashboard, Syllabus,
  History, and Premium in one place.
- `ScanScreen` (the one screen that doesn't use `ScreenShell`, being a full-bleed camera layout) got
  its own `<main>` directly, and `CameraViewfinder`'s "Align Worksheet" label became its `<h1>`.
- Syllabus's "MOE {level} Syllabus", History's "Past Ting Xie Results", Results' "Week N Syllabus
  Test", and Premium's "Premium is coming soon" each became that screen's `<h1>` — already
  page-specific, distinguishing text, just promoted to the right element.
- Dashboard has no natural on-screen title (the mockup has none) and `AppHeader`'s "Welcome back,
  {name}" greeting repeats identically across Dashboard/Syllabus/History/Premium — using it as every
  page's `<h1>` would give a heading-navigating user the same text four times over, which is worse
  than no distinguishing heading at all. Added a visually-hidden `<h1 className="sr-only">Dashboard</h1>`
  instead — correct for screen readers, invisible in the mockup-matched layout.

### Phase 21 (beyond the original plan) — deep runtime/concurrency pass, two real bugs found

Deliberately different lens from every prior audit (dead-code, security, Standards+Spec, Vercel
perf patterns): manually traced the upload → grade → credits → retry pipeline for edge cases and
state-consistency bugs rather than style or bloat. Found two, both real and both concrete:

- **A failed grading attempt permanently cost a credit.** `findStudentCredits` counted every
  `submissions` row for the student regardless of `status` — so a submission stuck `pending`
  (Gemini 503/timeout/blocked content — all three have actually happened during this build, see
  §5's deprecation history) silently and permanently reduced "remaining credits," with no way for
  the parent to get it back. Filtered the count to `status = 'graded'`: a credit is now only spent
  on a scan that actually completed. `CONTEXT.md`'s Credits entry updated to say so explicitly.
- **"Try again" didn't retry grading — it discarded the submission and demanded a fresh photo.**
  The PRD's own stated reason for splitting upload/grade into two routes was "lets grading be
  retried without re-uploading the photo" (§5), but `useUploadSubmission`'s error state never
  carried the `submissionId` forward, and `ScanScreen`'s retry button just called `reset()`. Added
  `retryGrade(submissionId)` to the store (re-runs only the grade step) and had the error state
  keep `submissionId` when the upload itself succeeded; `ScanScreen`'s "Try again" now calls
  `retryGrade` when there's a submission to retry, falling back to a full `reset()` only when the
  upload step itself is what failed. TDD'd against a fake API that throws on a second
  `uploadSubmission` call, proving the retry path genuinely never re-uploads.

Both verified: `npx tsc --noEmit`, lint, and the full Vitest suite (67/67, up from 65 — two new
cases for the retry behavior) all clean before committing either fix.

### Phase 22 (beyond the original plan) — a degenerate all-empty grading result

Continued the same deep pass into `gradeWithGemini.ts` and its downstream consumers. Both
`ScoreHeader` and `getStatusLabel` compute `score / totalPossible * 100` with no guard — and
`totalPossible` is `results.length` (§5), not a fixed constant. If Gemini ever returns a
valid-but-empty `[]` (a blank or unreadable worksheet photo is a real, if rare, way to get one, not
a contrived input), that saves a `0/0` graded submission: `0/0` is `NaN` in JS, so the Syllabus
status badge and the Results score circle would silently render "Completed (NaN%)" and "NaN%"
instead of failing loudly. Fixed at the source rather than patching both display sites separately:
`gradeWithGemini` now throws `GeminiGradingError` when Gemini grades nothing (or returns a
non-array), the same typed failure already used for blocked/malformed responses, so it surfaces as
a normal "grading failed, please try again" instead of a broken-looking success. TDD'd (68/68
passing, up from 67); `npx tsc --noEmit` and lint both clean.

### Phase 23 (beyond the original plan) — the Results not-found UI was dead code in production

Found by deliberately checking a real production build, not just `next dev` (which is the one
environment where this bug can't reproduce — see why below). `getSubmissionDetail` threw a plain
`new Error("Submission not found: ...")`, and `ResultsError` (the route's `error.tsx`) branched on
`error.message.startsWith("Submission not found")` to show a friendly "This result couldn't be
found / Back to Dashboard" message instead of the generic failure UI — the exact string-matching
pattern `mapGradeError.ts` already has a comment warning against, reintroduced in a sibling file.

Confirmed live end-to-end: `npm run build && npm run start`, then loaded `/results/<a made-up
uuid>` in a real browser. Production showed **"Couldn't load this result" / a minified React error
digest / "Try again"** — never the intended message. Root cause, per Next.js's own docs (confirmed
via context7, not assumed): *"errors forwarded from Server Components show a generic message with
an identifier [in production]... to prevent leaking sensitive details from the server."*
`error.message` never carried the real text past that boundary; the branch had been dead since
whenever this last got tested only in dev, where messages pass through unobfuscated.

Fixed with the framework's actual purpose-built mechanism instead of trying to preserve a message
across a boundary that deliberately strips it: `getSubmissionDetail` now throws the existing typed
`SubmissionNotFoundError` (reused from `gradingErrors.ts`, not a new class); `page.tsx` catches
that specific type and calls `notFound()` from `next/navigation`, which isn't treated as an
application error and reaches a new dedicated `not-found.tsx` intact. `error.tsx` is now only for
genuinely unexpected failures and no longer branches on a string it can't reliably see. Re-verified
against the same rebuilt production server: the correct message now renders.

While in there: `(dashboard)/error.tsx`, `history/error.tsx`, and `syllabus/error.tsx` all
displayed raw `error.message` to the end user - the same generic Next.js digest text a parent has
no reason to see. Removed it from all three in favor of the app's own friendly fallback text;
`console.error(error)` already captures the real one for debugging.

### Phase 24 (beyond the original plan) — dynamic status changes were never announced

Same audit family as Phase 20 (app-wide heading/landmark gap), one dimension over: Phase 20 fixed
*static* structure; this pass grepped the whole `src/` tree for `aria-live`/`role="status"`/
`role="alert"` and found **zero matches anywhere in the app**. Every async status change - Scan's
"Uploading…" → "Grading…" → the error banner, Top Up's "Adding…", Print Worksheet's "Preparing
PDF…" - only ever updated visibly. A screen-reader user wouldn't hear any of it; they'd have to
manually re-explore the page after every action to discover what happened, on the exact flow the
assignment names as its key evaluation point.

Fixed all three: `ScanScreen`'s busy overlay is `role="status" aria-live="polite"` (routine
progress), its error banner is `role="alert"` (interrupts immediately, matching how errors should
read - `role="alert"` implies assertive by spec, no separate `aria-live` needed). `TopUpButton` and
`PrintWorksheetButton` each get a visually-hidden `role="status" aria-live="polite"` span next to
the button - stacking a status role directly on the `<button>` itself isn't valid ARIA once it
already carries the interactive button role, and a screen reader focused on a button doesn't
reliably re-announce its own label text changing under it anyway. Verified: `npx tsc --noEmit`,
lint, the full Vitest suite (69/69, unchanged - pure UI attributes, nothing new to unit test), and
Playwright (6/6) all clean.

### Phase 25 (beyond the original plan) — the credits card showed the wrong number entirely

Found by re-checking `screen1-dashboard.png` pixel-for-pixel against the live component, the same
method that caught the Syllabus "(80%)" and pinyin-fidelity bugs earlier in this document. The
mockup reads **"12 of 20 Remaining"** with the progress bar filled to roughly that same 60% - the
displayed number and the bar both track how many credits are *left*. `CreditsCard` displayed and
filled its bar from `used` directly: `{used} of {total} Remaining`. Since the live database starts
with 0 graded submissions, this rendered as **"0 of 30 Remaining"** with an empty bar on a totally
fresh install - the single most visible number on the entire app, on the very first screen,
reading as "you have no credits left" when the truth was the opposite: nothing had been spent yet.

Fixed by computing `remaining = total - used` (clamped at 0 - nothing enforces a hard quota, so
`used` can exceed `total` between a scan and the next Top Up, and a negative "Remaining" isn't a
state worth rendering even though the numbers allow it). Pulled the math into its own
`getCreditsDisplay.ts` rather than leaving it inline, the same pattern as `getStatusLabel.ts` -
this project doesn't unit-test components directly (no React Testing Library / jsdom anywhere in
it), so arithmetic that's easy to get backwards, as this one proved, needs to live somewhere
testable without one. TDD'd (72/72, up from 69, 24 files up from 23); re-verified live against the
real (still-empty) database: the Dashboard now correctly shows "30 of 30 Remaining" with a full bar.

### Phase 26 (beyond the original plan) — a deferred finding from Phase 21, now fixed properly

Phase 21 found but deliberately deferred this: `getLessons`' query embeds only the single most
recent submission per lesson (`order + limit(1)`), with no status filter. If that most recent
submission is a stuck-pending retry (Phase 21's other fix - a Gemini failure that hasn't been
retried yet, or was retried and failed again), the Syllabus badge would silently revert from
"Completed (80%)" to plain "Completed", hiding the last real grade. Deferred then because the
obvious fix - filtering the embedded `submissions` to `status = 'graded'` - requires PostgREST's
`!inner` join syntax, which would turn every lesson with zero graded submissions yet into a
dropped row entirely (a `pending`/`needs_revision` lesson silently vanishing from its own Syllabus
tab is a worse bug than the one being fixed).

The actual fix needed no restructuring: widen `.limit(1, ...)` to `.limit(5, ...)` and have
`mapLessonRow` pick the first of those five with a non-null `total_score` (they arrive
most-recent-first already), falling back to the single latest row when a lesson has never been
graded at all - same left-join shape, just looking a few rows deeper before deciding. TDD'd
(73/73, up from 72); `npx tsc --noEmit`, lint, and Playwright (6/6) all clean.

### Phase 27 (beyond the original plan) — dark mode: a real contrast bug, and a bigger surprise under it

Went looking for the same class of bug Phase 4 found in light mode (`Badge`'s tinted-surface text
color failing WCAG AA) but in dark mode specifically, since README's own Known Limitations already
flagged dark mode as "not mockup-verified." Computed real contrast ratios via the actual formula
(OKLCH → linear sRGB → relative luminance → ratio), not by eyeballing `L` values - that's the exact
mistake that caused the original bug. `Badge`'s dark-mode variants render `text-{color}` over
`dark:bg-{color}/20` (a 20%-opacity self-tint over `--card`, confirmed by reading `badge.tsx`, not
assumed), so that's the pair that actually renders, not `{color}` vs `{color}-foreground`. Two of
three failed: `destructive` 3.95:1, `success` 4.22:1 (both below the 4.5:1 minimum); `warning`
passed at 5.83:1. Fixed by lightening `--destructive` (0.65→0.7 L) and `--success` (0.65→0.69 L) in
`.dark`, keeping chroma/hue - now 4.58:1 and 4.74:1. Verified by forcing the `.dark` class in a
real browser and screenshotting `/syllabus` (all three badge variants visible at once).

That last step surfaced something bigger than the contrast bug: **nothing in this codebase ever
applies the `.dark` class** - no theme toggle, no `prefers-color-scheme: dark` media query, nothing.
`globals.css` scopes every dark token behind `@custom-variant dark (&:is(.dark *))`, a manual-class
selector, not a media query. README's Known Limitations claimed the `.dark` palette exists "so the
app doesn't break under `prefers-color-scheme: dark`" - false as written; that media query is never
referenced anywhere, so every visitor sees the light theme regardless of their OS setting, and
dark mode has been unreachable, not just unverified. Left unwired rather than building a toggle or
media-query switch - no dark-mode mockup was ever supplied, and theme switching was never part of
the assignment's scope - but corrected the README claim to say what's actually true, and kept the
contrast fix anyway: harmless now, correct from day one if this ever does get wired up later.

### Phase 28 (beyond the original plan) — the photo's real format was never checked past the client

Re-read `uploadWorksheetImage.ts`'s own comment against `useCameraCapture.ts` side by side and
found a contradiction: the comment claimed "the only real capture path... always produces
image/jpeg," but `useCameraCapture` tries `ImageCapture.takePhoto()` *first* (the preferred,
higher-resolution path on Chromium), falling back to the fixed-JPEG canvas snapshot only when that
throws or isn't available. Confirmed via MDN, not assumed: `takePhoto()`'s returned `Blob` format
isn't guaranteed to be JPEG - it's whatever the device's camera hardware defaults to. Every upload
was stored under a hardcoded `Content-Type: image/jpeg` regardless, and `gradeWithGemini` then told
Gemini the same hardcoded `image/jpeg` for whatever bytes actually got fetched back - on a device
whose `takePhoto()` returns PNG or another format, Gemini would receive mismatched format metadata
paired with the real image bytes, on the exact flow the assignment calls its key evaluation point.

Threaded the *validated* real type through instead of hardcoding one at either end:
`validateWorksheetImage` now allowlists specific raster formats (`image/jpeg`, `image/png`,
`image/webp`) rather than a blanket `startsWith("image/")` - deliberately not just trusting
`file.type` again, since that same blanket check is also what let `image/svg+xml` through before
9a94c9e's fix (that commit hardcoded the *stored* type against a spoofed client one; this one still
needed the input narrowed to safe raster formats before ever using it as the real type anywhere).
`/api/upload` passes that validated `file.type` to `uploadWorksheetImage`, which now stores it as
the real `Content-Type` instead of a hardcoded one. `fetchImageAsBase64` reads the Storage
response's actual `Content-Type` header back and threads it through `gradeSubmission` into
`gradeWithGemini`'s `inlineData.mimeType`, so Gemini is told the truth about whatever bytes it's
actually receiving. TDD'd (76/76, up from 73) — one test asserts the mimeType Gemini's SDK is
actually called with, not just that the pipeline doesn't throw.

Verified live end-to-end, not just unit-tested: uploaded a real PNG through `/api/upload`, confirmed
the stored object is served back as `Content-Type: image/png` (previously would have been a lying
`image/jpeg`), then called `/api/grade` against it. Gemini itself returned a 503 "experiencing high
demand" - the same live, already-documented flakiness this project has hit before (§5), confirmed
via a temporary debug log showing the raw SDK error, not assumed. A 503 rather than a 400 is itself
useful evidence: Gemini's API accepted the request shape, `image/png` mimeType included, and simply
had no capacity - not a sign this fix broke anything. Temp submission and its Storage object deleted
after, confirmed 0 remain.

### Phase 29 (beyond the original plan) — the print-worksheet font's real ceiling, measured then fixed

Investigated `NotoSansSC-Subset.ttf` after noticing its file size (26KB - implausibly small for a
general Chinese font) didn't match its use as *the* font for a syllabus feature named "Print A4
Worksheet." Parsed it directly with `@pdf-lib/fontkit` (already a dependency): 170 total glyphs. It
covers every character the 3 seeded lessons' titles, vocabulary, and pinyin actually use (0 missing)
and nothing meaningfully else - 27 of 29 completely ordinary, unrelated Chinese characters probed
(你好世界学生, numbers, directions) have no glyph at all. Generated a real worksheet PDF for
made-up vocabulary outside that set to see the actual failure, not just infer it: the lesson title
rendered with every non-original character blank (`《第十　课 -　　　　》`), both practice-box
reference characters were entirely blank, and both pinyin labels lost every tone mark
(`nǐ hǎo` → `ni hao`).

**First pass: deliberately not fixed.** `generateWorksheetPdf.test.ts` already covered one
unsupported character (`字`) and explicitly asserted the PDF still generated instead of throwing - a
considered trade-off, recorded in that test's own comment, not an oversight to unilaterally overrule
without being asked to revisit it. Recorded as a measured Known Limitation instead.

**Reconsidered, at your explicit prompt** ("keputusan terbaik... yakin membiarkan nya?"). The
existing test's framing ("doesn't need every possible character pre-subsetted") reads as tolerating
an occasional rare glyph gap in an otherwise-correct document - not a *new lesson's entire
vocabulary* coming back essentially blank with zero indication anything failed. That gap between
what the trade-off was reasoned for and what it actually costs here is real, and worth closing.
Re-reading `PrintWorksheetButton.tsx` while implementing surfaced a second, compounding bug: its
`handleClick` had a `try/finally` with **no `catch`** at all - any failure (this one, an offline
font fetch, anything) was an unhandled rejection with zero user feedback; the button just silently
reset. A parent clicking Print had no way to know it hadn't worked, whether by a thrown error or a
blank page.

Fixed both: `generateWorksheetPdf` now checks every character it's about to render (title,
vocabulary, pinyin) against the actual font via `fontkit.hasGlyphForCodePoint` *before* generating
anything, and throws a specific, actionable error (`Can't print this worksheet - the font doesn't
support: 你, 好, 世, 界`) instead of silently producing broken output. `PrintWorksheetButton` now has
a real `catch`, surfacing that message inline instead of swallowing it. The existing "doesn't throw"
test was replaced with one asserting it now does (a conscious reversal, not an accidental one) plus
a pagination test fix (its 15-word fixture had used `字0`–`字14`, itself outside the subset -
switched to a real subset character since that test's actual concern is page-overflow, not glyph
coverage). Verified live end-to-end, not just unit-tested: inserted a temporary lesson with
out-of-subset vocabulary into the real database, loaded `/syllabus`, clicked Print, screenshotted
the inline error rendering correctly; separately confirmed printing an existing seeded lesson still
downloads normally. Temp lesson deleted after, confirmed 0 remain. TDD'd (77/77, up from 76).

The underlying ceiling itself is unchanged and still recorded in README's Known Limitations with
the real fix path (swap in a full Noto Sans SC file - `subset: true` already keeps the generated
PDF's own size small regardless of the source font's size, so this is an asset change, not a code
one) for whoever seeds lesson 4 - what changed is that hitting it now fails loudly instead of
quietly handing someone a broken worksheet.

### Phase 30 (beyond the original plan) — ran an actual accessibility scanner, not just manual review

Every a11y pass so far (Phases 17, 20, 24) was manual: grep for missing landmarks, reason about
`aria-live`, trace through code by hand. This pass ran a real tool instead - `axe-core` (the same
engine Lighthouse and most production a11y linting use), loaded via CDN into a live Playwright
browser, `axe.run()` against every real route (`/`, `/syllabus`, `/history`, `/premium`,
`/results/[id]`, `/scan`), both themes.

Found one real, tool-confirmed violation: the Dashboard's "Upcoming Ting Xie" banner text
(`text-muted-foreground` on the `--accent`-tinted banner) measured 4.48:1 in light mode and 4.17:1
in dark mode, both below the 4.5:1 minimum - the same class of issue as the Badge fixes above
(a color tuned against the default surface, never checked against a tinted one), just a token
nobody had reason to suspect until a tool actually measured it there. Darkened `--muted-foreground`
in `:root` (0.526→0.52 L) and lightened it in `.dark` (0.65→0.67 L); both are imperceptibly small
adjustments that don't affect its many other, already-passing uses elsewhere.

**A real false alarm worth recording, not just the finding.** The first dark-mode scan reported
`destructive`/`success`/`warning` Badge variants failing at 2.55:1/3.19:1/3.24:1 - numbers that
directly contradicted Phase 27's own contrast math (4.58/4.74/5.83:1) for the exact same tokens.
Chased it down rather than trusting either number blindly: `document.documentElement.classList.add
("dark")` executed correctly, but reading computed styles *immediately after* raced Next.js's own
client-side reconciliation, which was still resolving with the light-mode class list at that exact
instant - the badges the scanner measured were transiently still light-mode-colored. Adding a
short wait after toggling the class fixed the measurement, and the "failures" vanished; Phase 27's
fix was correct all along. Recorded so a future pass doesn't re-chase the same phantom, and as a
reminder that a monitoring tool's raw number still needs the same skepticism applied to any other
signal - trust, but verify the measurement methodology, not just the code under test.

**A second real, tool-confirmed violation**, found after fixing the first and re-scanning every
route: the Results screen's status badge (`success`/`Completed` variant) measured 4.24:1, below
4.5:1 - `text-success` at the *same* lightness that passed 4.52:1 on the Syllabus screen. The
difference: Syllabus's badges sit inside a white `<Card>` (`--card`, pure white); the Results
screen's badge sits directly on the page body (`--background`, a warm cream, deliberately slightly
darker than white per this file's own palette note above) with no Card wrapper. The same value that
clears 4.5:1 against white doesn't necessarily clear it against cream. Re-checked `warning` against
the same cream backdrop as a precaution rather than waiting for axe to catch it too: also failing,
4.23:1 (it happens not to appear as a status badge outside Cards anywhere in the app today, but
there was no reason to leave a token known to fail in one real context sitting there for the next
place that uses it). Darkened both `--success` (0.525→0.505 L) and `--warning` (0.54→0.51 L) enough
to clear 4.5:1 against the *worse* of the two backgrounds each is actually used against, not just
whichever one happened to get checked first; `--destructive` already cleared both (5.33:1 on
cream) and was left alone. Re-scanned all 6 routes in both themes after every change: 0 violations,
confirmed, not assumed.

### Phase 31 (beyond the original plan) — a pending submission rendered as a fabricated "Completed 0%"

Swept every route for browser console errors/warnings and failed network requests (clean
everywhere - no hidden runtime issues), then probed a specific state no normal navigation reaches
but a saved or shared link now genuinely can, since Phase 21's `retryGrade` fix means a submission
can legitimately sit at `pending` or `failed` for a while rather than always resolving to `graded`
quickly. Inserted a temporary `pending` submission directly and loaded its `/results/[id]`: the
page showed a green **"Completed"** badge and **"Score: 0/10" / 0%** - `ResultsScreen` defaulted
`submission.score ?? 0` and had no notion of the submission's `status` at all, so "not graded yet"
rendered identically to "graded a perfect zero." A parent landing here - checking a share link,
or refreshing mid-retry - would read this as their child having failed every character on a test
that was never actually marked.

Added `status` to `SubmissionDetail` (threaded through `getSubmissionDetail`'s query and mapping,
the same shape as `submissions.status` in the schema) and had `ResultsScreen` branch on it before
doing anything else: `pending` shows "Still grading this worksheet… Check back in a moment, or
refresh this page."; `failed` shows "Grading failed for this worksheet… Please scan the worksheet
again." Both link back to the Dashboard instead of rendering the normal score/badge/matrix layout
built for a real graded result. Verified live for both states against temporary submissions (one
`pending`, then flipped to `failed` in place); deleted after, confirmed 0 remain. This project
doesn't unit-test UI components directly, so the type-level change is TDD'd via
`getSubmissionDetail.test.ts` (77/77, `status` now part of the fixture and assertion) and the
screen behavior itself is verified live rather than faked through a component test harness.

### Phase 32 (beyond the original plan) — Replay could break its own sibling glyph, confirmed not assumed

Re-reading `StrokeOrderCard` during this pass's deep dive surfaced a suspicion earlier in the same
pass had already noted and deliberately left unverified rather than report as a finding on a guess:
`onLoadCharDataError` puts a failed glyph's writer into `writersRef.current` right alongside working
ones, and Replay's handler called `animateCharacter()` on all of them through a bare `.forEach()` -
if the failed writer's method throws, nothing stops that from killing the loop before it reaches
the *next* writer.

Settled it for real this pass: built a minimal standalone HTML page loading the actual
`hanzi-writer` package, created one writer with a deliberately-invalid character (data load fails)
and one with a real one (`人`), waited for both to settle, then called `animateCharacter()` on both
in a plain loop exactly like the component did. Confirmed via a real browser, not inferred from
docs: it throws - `"Failed to load character data. Call setCharacter and try again."` - a real,
synchronous exception, not a silent no-op. On a multi-character missed word (`温暖`, `校园`, any
two-glyph vocabulary entry), one character's CDN fetch failing (offline, a CDN hiccup - the
documented one real failure mode of this feature) would stop Replay from animating the *other*,
successfully-loaded character in the same card too.

Fixed by wrapping each `animateCharacter()` call in its own `try`/`catch` instead of a bare
`forEach`, so one writer's failure can't stop the loop before it reaches the next. Re-verified with
the same standalone harness with the fix applied: the failed writer's error is caught, and the good
writer's `animateCharacter()` still runs and its `onComplete` fires normally afterward. This
component isn't unit-tested (no jsdom/React Testing Library in this project - UI is verified live),
so the standalone browser harness is the same category of evidence as the rest of Phase 17-24's
manual a11y work, just settling a question that pass raised but left open. `npx tsc --noEmit`,
lint, the full Vitest suite (77/77, unchanged - no new unit-testable logic), and Playwright (6/6)
all clean.

### Phase 33 (beyond the original plan) — security-review and Vercel best-practices re-audit

Two more full passes, run again once this session's batch of pipeline fixes (Phases 21-32) had
accumulated enough to be worth re-checking as a whole, the same rhythm as Phase 18.

**`security-review`**, scoped to the diff since the last pass: clean. Specifically traced the file
upload/grade pipeline's mimeType changes (Phase 28) end to end - `validateWorksheetImage`'s
allowlist narrowed what content-types can ever reach Storage or Gemini, it didn't widen anything;
`gradeSubmission`'s mimeType is read back from Storage's own response header for an object the
server itself wrote, never attacker-controlled at read time. The error-boundary changes (Phase 26)
and the four `error.tsx` files (Phase 26) all *reduce* exposure (stopped showing raw digest text to
end users) rather than introduce any. No candidate reached the review's own confidence threshold -
recorded as a clean pass, not silently skipped.

**`vercel-react-best-practices`**, scoped to every file this session touched or added (12 files -
the retry store, the credits/PDF/stroke-order fixes, the new error/not-found routing): one genuine
finding, confirmed by reading `pdf-lib`'s own source rather than guessed. `generateWorksheetPdf`'s
new glyph-coverage check (Phase 29) calls `fontkit.create(bytes)` fresh on every Print click, but
`NotoSansSC-Subset.ttf` is a fixed, unchanging static asset - the exact case `js-cache-function-results`
targets. Cached the parsed `Font` in a module-level variable, populated once and reused after.
(A second, smaller duplicate exists where `pdf-lib`'s own `embedFont(bytes, {subset:true})` calls
`fontkit.create` again internally - confirmed in `pdf-lib`'s `CustomFontEmbedder` source - but its
public API only accepts raw bytes, not a pre-parsed `Font`, so removing that one means reaching into
pdf-lib internals for a ~170-glyph parse that only runs on an explicit, rare click. Not worth the
fragility; left alone.) Everything else in the batch checked out clean - the sequential awaits in
`gradeSubmission.ts` and the Results page are genuine data dependencies, not fixable waterfalls; the
new aria-live/retry/for-loop changes don't introduce re-render churn; `ResultsScreen`'s early return
happens before any hooks. `npx tsc --noEmit`, lint, and the full Vitest suite (77/77) all clean.

### Phase 34 (beyond the original plan) — a real test-coverage gap, closed

Swept `src/entities`, `src/shared/lib`, and `src/widgets/*/model` for pure-logic files with no
matching `.test.ts` (there's a consistent one-to-one convention throughout this project otherwise).
Found five: `gradingErrors.ts` (bare error-class constructors, nothing to assert), `gemini/client.ts`
and `supabase/server.ts` (singleton factories wrapping real SDKs - untested glue by the project's
own established convention), `utils.ts` (a one-line `clsx`+`tailwind-merge` wrapper) - all
correctly untested, not gaps. `getCharacterHistory.ts` was the one real gap: it has actual branching
logic (an early return for an empty character list, skipping the DB call entirely) that was never
exercised by a test, unlike its sibling `buildCharacterHistoryMatrix.ts`, which is thoroughly
tested. The early return matters for a real case - a submission with zero `character_results` (an
all-empty Gemini result caught before being saved as graded per Phase 22, or a manually-inserted
fixture like the History e2e test's) has nothing to look up, and querying `.in("character", [])`
would be a wasted round trip at best. Added `getCharacterHistory.test.ts` covering both the
empty-list short-circuit and the real query-and-pivot path; both passed immediately, since the
underlying code was already correct - this closes a coverage gap on real, working logic, not a bug
fix. `npx tsc --noEmit`, lint, and the full Vitest suite (79/79, up from 77, 25 files up from 24)
all clean.

### Phase 35 (beyond the original plan) — the calendar strip used the server's timezone, not Singapore's

Same class of bug as §5's Phase 7 fix, missed for a sibling function at the time: `formatTestSchedule`
pins `Asia/Singapore` explicitly via `Intl.DateTimeFormat` (fixed once already, when the "Upcoming
Ting Xie" banner showed 10:00 PM instead of 3:00 PM), but `getCurrentWeekDays` - which decides which
day the Dashboard's weekly calendar strip highlights as "today" - used plain `Date` getters
(`getDate()`, `getDay()`, `getFullYear()`), which read the **server's own local timezone**, not
Singapore's. Confirmed live, not inferred: ran the function with `process.env.TZ` set to
`America/Los_Angeles` and a real UTC instant that's already Tuesday 8 Sept, 2:30pm in Singapore but
still Monday 7 Sept, 11:30pm on that server - it marked *Monday* as "today," the wrong day, wrong
week-numbering knock-on effects included. Deployment to Vercel is still pending (README's Known
Limitations), and Vercel's serverless functions don't run in Singapore's timezone by default -
this would have been a real, live bug on day one of deployment, not a theoretical one.

Fixed by resolving "today" and the given `eventDate` to their Singapore calendar-date parts via
`Intl.DateTimeFormat` first (the same technique `formatTestSchedule` already uses), then anchoring
each at UTC midnight so all the subsequent day-of-week and day-arithmetic (`setUTCDate`,
`getUTCDay`) only ever reads back what was just written - never the ambient server timezone again.
TDD'd: added a test with the same US-Pacific-vs-Singapore instant used to confirm the bug, plus kept
every existing test (Sunday-rolls-forward, `hasEvent` matching, mid-week reference) passing
unchanged - the fix changes the timezone the calculation happens in, not the calculation's own
documented behavior. Re-ran the original `TZ=America/Los_Angeles` repro after the fix: now correctly
resolves Tuesday 8 as "today." Verified live in the browser too (Dashboard's calendar strip still
renders correctly for the normal case). `npx tsc --noEmit`, lint, the full Vitest suite (80/80, up
from 79), and Playwright (6/6) all clean.

### Phase 36 (beyond the original plan) — every other displayed date had the same timezone bug as Phase 35

Phase 35 fixed `getCurrentWeekDays`, but the same root cause - `toLocaleDateString`/`toLocaleString`
reading the server's ambient timezone instead of Singapore's - was still live in four other display
sites: `DashboardScreen.tsx` (credits expiry date, using locale `"en-US"` with no `timeZone` at
all), `HistoryScreen.tsx` (submission date), `HistoricalMatrix.tsx` (date column headers), and
`ScoreHeader.tsx` (graded date+time) - all three of the latter passed locale `"en-SG"` but still no
`timeZone` option, the exact mix-up Phase 35's own writeup calls out: locale controls
day/month-order and separator conventions, not which timezone a timestamp is interpreted in.
Confirmed live with the same repro technique as Phase 35: `process.env.TZ =
'America/Los_Angeles'` then `new Date('2026-11-30T00:00:00Z').toLocaleDateString('en-SG', {...})`
produced `"29 Nov 2026"` - a calendar day early - regardless of the `"en-SG"` locale.

Extracted the fix Phase 35 only applied locally into a shared helper,
`src/shared/lib/formatSingaporeDate.ts`, exporting `SINGAPORE_TIME_ZONE = "Asia/Singapore"` and
`formatSingaporeDate(date, options)` (a thin `Intl.DateTimeFormat("en-SG", { ...options, timeZone:
SINGAPORE_TIME_ZONE })` wrapper), and pointed all four call sites at it. Also deduplicated the two
`"Asia/Singapore"` string constants that already existed separately in `formatTestSchedule.ts` and
`getCurrentWeekDays.ts` (from Phase 35) to both import `SINGAPORE_TIME_ZONE` from the new shared
file instead - one source of truth for the timezone string app-wide. TDD'd
`formatSingaporeDate.test.ts` against the same `2026-11-30T00:00:00Z` repro, asserting `"30 Nov
2026"`. Re-verified live: with the dev server itself forced to `TZ=America/Los_Angeles`, the real
Dashboard rendered "Credits expire on 30 Nov 2026" (not the off-by-one "29 Nov") and the calendar
strip still correctly showed today as Monday the 7th - confirming the fix in the actual browser, not
just the unit test. `npx tsc --noEmit`, lint, and the full Vitest suite (81/81, up from 80, 26 files
up from 25) all clean.

### Phase 37 (beyond the original plan) — Top Up silently swallowed a failed request

Same gap Phase 29 found and fixed in `PrintWorksheetButton` (a missing `catch`, any failure just
silently resetting the button) was still live in `TopUpButton`: `handleTopUp` checked
`response.ok` and called `router.refresh()` when true, but did nothing at all in the `else` branch
- a `/api/credits/topup` 500 (which the route genuinely returns on any Supabase failure, per its
own `catch` block) left the button simply re-enabled with zero feedback, visual or
screen-reader, exactly the silent-failure class of bug this project has already fixed once.

Fixed the same way as `PrintWorksheetButton`: wrapped the fetch in try/catch, surfaced the API's
own error message (falling back to a generic one if the response body isn't JSON), and added a
`role="alert"` message next to the button. Verified live, not just by reading the diff: ran the
real dev server, used Playwright's route interception to force the real `/api/credits/topup`
endpoint to return a 500, confirmed the `role="alert"` element renders with the right text, and
screenshotted the Dashboard to confirm the message doesn't cramp against `CardAction`'s narrow
top-right grid cell in the credits card header. This project doesn't unit-test UI components
directly (established convention - see Phase 31), so this fix is verified live only. `npx tsc
--noEmit`, lint, and the full Vitest suite (81/81, unchanged) all clean.

---

### Phase 38 (beyond the original plan) — the app's own upload limit was above the deploy platform's hard cap

`validateWorksheetImage` allowed images up to 10MB, a number picked with no reference to where this
would actually run. Confirmed against Vercel's current docs (not assumed from training data,
fetched live): "The maximum payload size for the request body or the response body of a Vercel
Function is 4.5 MB" - a hard, non-configurable platform limit, enforced with an opaque `413
FUNCTION_PAYLOAD_TOO_LARGE` before the function's own code (and therefore this validation) ever
runs. A worksheet photo between 4.5MB and 10MB - entirely plausible from `useCameraCapture`'s
preferred `ImageCapture.takePhoto()` path, which deliberately captures at the camera's full photo
resolution rather than the video preview's - would pass this app's own check today but get
silently rejected by the platform itself the moment this deploys, with a generic error instead of
the friendly "Image must be smaller than 10MB" message this code promises.

Lowered `MAX_SIZE_BYTES` to 4MB, leaving headroom under the 4.5MB platform cap for the
multipart/form-data boundary overhead and the `lessonId` field alongside the image. Updated the
user-facing message and every other reference to the old 10MB figure (FSD, PRD, the existing error-
message test) for consistency. Deploy itself is still on hold pending review, so this couldn't be
confirmed against the real platform limit end-to-end - but the limit itself is Vercel's documented,
enforced behavior regardless of when the deploy happens, not a guess. `npx tsc --noEmit`, lint, and
the full Vitest suite (81/81, unchanged - existing tests updated, not added) all clean.

---

### Phase 39 (beyond the original plan) — the enhanced capture path could hand Gemini an orientation-ambiguous photo

`useCameraCapture`'s canvas fallback draws the live `<video>` element directly, which is always
already in correct display orientation - safe by construction. Its progressive enhancement,
`ImageCapture.takePhoto()` (Chromium only, full sensor resolution), reads straight from the camera
hardware instead and can return a Blob carrying a real EXIF orientation tag - a well-documented,
common behavior of phone cameras, not a novel theory. Nothing downstream normalized it: the raw
bytes went straight to Storage and to Gemini's `inlineData`, while the `<img>` overlay
(`WorksheetOverlay.tsx`) on the Results screen - the assignment's own named "key evaluation point"
- renders through a browser, which auto-applies EXIF orientation per the HTML spec. If Gemini's
`box_2d` coordinates are computed against the raw, un-rotated pixel buffer (undocumented, and
plausible - many vision pipelines decode via libraries that don't auto-rotate), the correction
overlay would end up positioned against the wrong dimensions entirely.

Tried to confirm Gemini's exact behavior live first: built a synthetic JPEG (`sharp`) with two
asymmetric color markers and a real EXIF orientation-6 tag, sent it to the actual Gemini API asking
for box_2d bounding boxes on each marker. The live API returned persistent `503 UNAVAILABLE` on
every retry (the same already-documented flakiness this project has hit repeatedly) - undetermined,
not ruled out.

Rather than depend on an external API's undocumented, unconfirmable behavior, closed the ambiguity
at the source instead: `capture()` now pipes the `takePhoto()` Blob through
`createImageBitmap(blob, { imageOrientation: "from-image" })` before returning it - this option
makes the *decode itself* apply the EXIF rotation, so the resulting bitmap's dimensions are already
the corrected ones. Re-drawn onto a canvas and re-encoded via `toBlob()` (which never writes EXIF),
the photo that leaves this hook is always orientation-normalized with no tag left to interpret
differently, matching what the canvas fallback path already guaranteed. Verified live, not
inferred: ran the exact same `createImageBitmap`/canvas logic in a real Chromium browser
(Playwright) against the synthetic EXIF-6 test image - the normalized output's dimensions and
marker pixel positions exactly matched the independently-computed ground truth for correct display
orientation, and `sharp` confirmed the output file carries no orientation tag at all. This hook has
no existing test file (browser-only camera/canvas APIs, consistent with the project's convention of
not unit-testing DOM-heavy code), so verified live only. `npx tsc --noEmit`, lint, and the full
Vitest suite (81/81, unchanged) all clean.

---

### Phase 40 (beyond the original plan) — the historical matrix could show a non-deterministic result for the same day

`getCharacterHistory`'s query had no `.order()` clause, and `buildCharacterHistoryMatrix` resolves a
character appearing twice on the same calendar day by plain object-key overwrite - the last matching
row in its input wins that cell. Without an explicit order, Postgres doesn't guarantee which of two
same-day rows comes back first, so a character graded both correct and incorrect on the same day
(two lessons sharing a character, or a re-scan - genuinely reachable, nothing prevents scanning
twice in one day) could flip between showing a green check and a red X on every page reload, for
the exact same underlying data.

Added `.order("submitted_at", { foreignTable: "submissions", ascending: true })` to the query -
`foreignTable`, not `referencedTable`, matching the existing convention in `getLessons.ts`'s
identical join-ordering need. This makes the last-row-wins resolution deterministic and meaningful:
with rows guaranteed chronological, the matrix cell now reflects the day's most recent attempt,
not an arbitrary one. Documented this as the pivot function's real contract (previously implicit)
and added a unit test locking in the behavior. Verified against the live database, not just unit
tests: inserted a temp lesson with two temp submissions on the same calendar day - one graded a
shared character incorrect at 01:00 UTC, the other correct at 20:00 UTC - ran the actual fixed
query, and confirmed the results come back in guaranteed chronological order (incorrect row first,
correct row last), so the matrix would show the day's later, correct result rather than whichever
one Postgres happened to return first. Temp rows deleted after, confirmed 0 remain. `npx tsc
--noEmit`, lint, and the full Vitest suite (82/82, up from 81) all clean.

---

### Phase 41 (beyond the original plan) — no response ever carried a single security header

Grepped for a `middleware.ts` or a `headers()` config and found neither - this app had never set
one HTTP response header of its own, on any route, for its entire build. Nothing was preventing
another site from framing it in an `<iframe>` (clickjacking) or a browser MIME-sniffing a response
into something it isn't. Not caught by the earlier `security-review` pass (Phase 33), which reviews
the diff between commits for introduced vulnerabilities - a header that was never set in the first
place isn't a regression in any diff, so it never surfaced there.

Added `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and
`Referrer-Policy: strict-origin-when-cross-origin` via `next.config.ts`'s `headers()`, applied to
every route (confirmed via Context7 against Next.js 16's current docs, per this repo's own
AGENTS.md warning not to assume API shapes from training data). Deliberately did not add a full
Content-Security-Policy: correctly scoping one around Next.js's own inline scripts, the service
worker, and the Supabase/Gemini origins this app actually calls is a real project of its own, and
getting it wrong this close to the deadline risks silently breaking the app rather than securing
it - these three are the well-understood, near-zero-risk baseline every response should carry
regardless, not the whole of what a production deploy would eventually want.

Verified live, not just read from the config: grepped the whole `src/` tree first to confirm no
`<iframe>`/`<embed>`/`<object>` exists anywhere the app could break by disallowing framing, then ran
the real dev server and `curl -I`'d `/`, the service worker (`/sw.js`), and the manifest - all three
carry all three headers. Re-ran the app in a real Playwright browser across the Dashboard, History,
and Syllabus screens afterward: zero console/page errors, and the service worker still registers
and activates normally (the headers don't interfere with SW registration, which checks
`Service-Worker-Allowed`/MIME type, not these). `npx tsc --noEmit`, lint, and the full Vitest suite
(82/82, unchanged - a config-level header isn't unit-testable business logic) all clean.

---

### Phase 42 (beyond the original plan) — a rapid double-tap on the shutter could start two concurrent captures

`ShutterButton` only disables once `ScanScreen`'s `upload.status` flips to `"uploading"` -  which
happens after `CameraViewfinder.handleShutterClick` awaits `capture()` in full and then calls
`onCapture(blob)`. Phase 39's orientation-normalization fix made `capture()` slower on the enhanced
path (an extra decode+redraw step), widening an already-real window: a second tap landing before
that whole chain resolves was still reachable (button state hadn't changed yet) and would start a
second, fully concurrent `capture()` call against the same live camera stream and Zustand upload
store - two uploads racing, with whichever resolved last silently overwriting the other's state.

Fixed at the source rather than in the UI: `capture()` now guards itself with a ref-based
re-entrancy check (set synchronously before any `await`, reset in `finally`) - a second call made
while the first is still in flight returns `null` immediately instead of starting real work. This
fixes it once for every current and future caller, not just `ShutterButton`'s particular disable
timing. Verified in isolation, not against a live camera: this project's own e2e suite already
documents (`e2e/navigation.spec.ts`) that headless Chromium's fake camera device isn't reliable in
CI, so - matching that established precedent - extracted the exact guard pattern (ref flag checked
at entry, set before the `await`, reset in `finally`) into a standalone script and called it twice
with zero delay between them, worse than any real double-tap: the second call returned `null`
immediately with the underlying work never starting a second time, and a third call made only after
the first fully resolved succeeded normally, confirming the guard resets correctly. `npx tsc
--noEmit`, lint, and the full Vitest suite (82/82, unchanged - this hook has no test file, per the
same live-verification convention noted in Phase 39) all clean.

---

### Phase 43 (beyond the original plan) — the character column would scroll away on a long history

This iteration was asked to look for feature weaknesses too, not just outright bugs. `HistoricalMatrix`
adds one date column per calendar day a character was attempted, with no cap - exactly the "track
progress over time" this widget exists for, meaning it's designed to keep growing across real
weeks of use. Nothing pinned the leftmost "Character" column, so once enough dates pushed the table
into its container's horizontal scroll (already provided by the shared `Table` primitive), scrolling
right to see recent dates would carry the character name off-screen with it - on a real mobile
viewport (this app is deliberately mobile-only, README's Known Limitations), losing track of which
row you're even looking at.

Pinned the first column (`sticky left-0 z-10 bg-background` on both the header and body cells) so it
stays visible regardless of scroll position. Verified live against real overflow, not a guess:
inserted a temp lesson with 15 distinct days of graded history for one character (three seeded
lessons' actual demo dataset has too few dates today to ever trigger this), confirmed the table's
`scrollWidth` (916px) genuinely exceeds a real 390px mobile viewport's `clientWidth` (358px),
screenshotted before and after scrolling the container fully right - the character column stays
pinned exactly in place in both. Temp lesson/submissions/character_results deleted after, confirmed
0 remain. `npx tsc --noEmit`, lint, and the full Vitest suite (82/82, unchanged - pure layout CSS,
no new business logic) all clean.

---

### Phase 44 (beyond the original plan) — a malformed request body broke this app's own error contract

Every route in this app returns a consistent `{ error: string }` JSON shape on failure -
`mapGradeError`, `validateWorksheetImage`, the topup route's own catch block all honor it. But
`POST /api/grade`'s `request.json()` and `POST /api/upload`'s `request.formData()` were both called
*before* their route's try/catch began, not inside it. Confirmed live: `curl`ing malformed JSON to
`/api/grade` and a malformed multipart body to `/api/upload` both returned a bare `500` with an
**empty body** - no `error` field at all, silently breaking the one contract every client-side
caller (`readErrorMessage` in `useUploadSubmission.ts`) depends on to show a real message instead of
a bare status code. Not reachable through this app's own UI (the real client always sends valid
JSON/multipart), but a genuine trust-boundary gap regardless - exactly the kind of input validation
ponytail's own rules call out as never worth simplifying away.

Wrapped both body-parsing calls in their own try/catch, returning this app's normal `{ error:
"Invalid request body" }` at `400` instead of falling through to an empty framework 500. Verified
live: re-ran the same malformed-JSON and malformed-multipart requests after the fix and confirmed
both now return the structured `400` error; re-ran the existing valid-JSON error paths
(missing `submissionId`, a nonexistent one) to confirm zero regression - identical `400`/`404`
responses as before.

Caught and fixed a self-inflicted mistake during this verification: an early `curl` against the
real, unmocked `/api/credits/topup` (checking it needed no body-parsing guard, since it reads none)
actually incremented the real student's live `credits_total` by 10 as a side effect of hitting a
real endpoint. Caught immediately from the response body, reverted with a direct database update
back to the prior value, and confirmed via a fresh read afterward. `npx tsc --noEmit`, lint, and the
full Vitest suite (82/82, unchanged - a trust-boundary guard around already-covered logic, not new
business logic) all clean.

---

### Phase 45 (beyond the original plan) — a stalled Gemini call could strand a user on "Grading…" forever

Also ran `security-review` and a fresh `vercel-react-best-practices` audit against every file changed
across Phases 34-44 (all 26 commits since the last such audit) - both came back clean, no findings.

Continued looking anyway and found a real gap the audits weren't scoped to catch: nothing bounded
how long `gradeWithGemini`'s `generateContent` call could take. A fast rejection (the documented 503
"high demand" flakiness) already surfaces the retry button fine, but an actual network/server
*stall* - the request never resolving or rejecting at all - would leave `upload.status` stuck at
`"grading"` indefinitely, since the "Try again" button only ever appears once a call actually
throws. Once deployed, Vercel's own platform-level function timeout would eventually kill it, but
as an opaque `504` well after a much longer wait than any user should tolerate.

Added `httpOptions: { timeout: 60_000 }` to the existing `generateContent` config - confirmed
current and real against the installed `@google/genai` SDK's own `.d.ts` (`GenerateContentConfig.
httpOptions: HttpOptions`, `HttpOptions.timeout: number` in milliseconds), not assumed from
training data. 60s comfortably covers the PRD's own "a few seconds" performance expectation plus
real network variance, while firing well before Vercel's platform timeout would. The existing
catch-all (`if (err instanceof GeminiGradingError) throw err; throw new GeminiGradingError(...)`)
already handles whatever error a timeout produces with zero additional code - it was already
written generically enough. Verified live: sent a real request to the actual Gemini API with this
exact config shape and confirmed a normal successful response still comes back untouched - the
timeout doesn't interfere with the fast, common case. `npx tsc --noEmit`, lint, and the full Vitest
suite (82/82, unchanged - the existing fake-client tests don't exercise real SDK config validation)
all clean.

---

### Phase 46 (beyond the original plan) — the red-pen correction could show the child's own wrong answer as "correct"

The Gemini response schema's `character` field had no `description` at all, unlike `box_2d`, which
does. Confirmed live against the real Gemini API this was a real, not theoretical, gap: built a
synthetic worksheet image with the vocab word "妈妈" but showing the deliberately wrong "爸爸"
handwritten instead, sent it through this app's exact prompt/schema, and got back `{"character":
"爸", "isCorrect": false, ...}` for both grid positions - Gemini returned what was actually
*handwritten* (the wrong answer), not the expected vocabulary word. `WorksheetOverlay.tsx` renders
this exact field as `aria-label="Correct word: {character}"`, the red-pen correction shown directly
on the assignment's own named "key evaluation point" - meaning a parent trying to help their child
fix a mistake would see the child's own wrong answer presented as the correction, with zero actual
corrective value, on the app's single most important feature.

Fixed by making the instruction explicit in both places that actually reach Gemini: the prompt text
now says "return the expected word itself exactly as given in the list (never a transcription of
what was actually handwritten, even when it was written incorrectly)", and the schema's `character`
property gained a matching `description` ("always the correct target word... never a transcription
of what the student actually wrote, even when isCorrect is false") - the same technique `box_2d`
already used successfully to get Gemini to reliably follow a specific, non-obvious contract.

**Honesty on verification**: confirmed the *bug* live with a real Gemini call. Attempting to
re-verify the *fix* the same way hit this project's free-tier quota
(`GenerateRequestsPerDayPerProjectPerModel-FreeTier`, 20 requests/day for this model) after the
day's earlier live-verification calls (Phases 39, 45, and this bug's own repro) used up the
remaining allowance - confirmed via the SDK's own `RESOURCE_EXHAUSTED` error, not a guess, and it
did not clear even after waiting past the quoted retry delays (a daily quota, not a short rolling
window). Deliberately stopped retrying rather than keep burning quota needed for actual grading
before the submission deadline. The fix itself is applied on the same well-established mechanism
`box_2d`'s own description already uses successfully in this exact schema, and is backed by a new
regression-guard test (`gradeWithGemini.test.ts`) asserting the prompt text and schema description
sent to Gemini contain the corrective instruction - but the model's actual compliance with the new
wording could not be re-confirmed live tonight. Whoever reviews this should spot-check one real
wrong-answer submission once quota resets. `npx tsc --noEmit`, lint, and the full Vitest suite
(83/83, up from 82) all clean.

**Update, same night**: re-confirmed live after all. The user checked Google AI Studio's own
rate-limit dashboard directly (something I have no API access to check myself) and found the daily
quota exhaustion was specific to `gemini-3.8-flash` (what `gemini-flash-latest` resolves to, and
what the app actually calls) - a *different* model, `gemini-3.6-flash`, had 17 of its own 20 daily
requests still free, on a completely separate quota bucket. Re-ran the exact same wrong-answer
repro against that model instead (same fixed prompt and schema, not app code) - Gemini now
correctly returned `{"character": "妈妈", "isCorrect": false, ...}`, the expected vocabulary word,
not a transcription of the wrong "爸爸" actually handwritten. The fix's compliance is now genuinely
confirmed live, not just reasoned from `box_2d`'s precedent.

---

### Phase 47 (beyond the original plan) — a failed scan's error outlived the session that caused it

`useUploadSubmission` is a module-level Zustand store, not per-component React state - it survives
client-side navigation away from `ScanScreen` entirely, since the JS module (and therefore the
store) never tears down between route changes in a client-rendered PWA. Nothing ever reset it.

Confirmed live with a real end-to-end reproduction (Playwright, Chromium's fake camera device -
which turned out to work reliably in this local environment despite this project's own e2e comment
about CI unreliability, likely a Linux-CI-specific issue rather than a Playwright limitation
generally): forced `/api/upload` to fail, captured a photo to trigger a real failed scan (the
"Upload failed, please try again" banner appeared correctly), closed the camera via normal
client-side navigation back to the Dashboard, then opened a *completely fresh* scan session for a
different lesson the same way a real user would - by clicking "Scan & Grade Worksheet" again. The
old session's error banner was already showing, "Try again" button included, before the user had
done anything in the new session at all.

Fixed by resetting the store on `ScanScreen` mount (`useEffect(() => upload.reset(), [upload.reset])`)
- every scan session now starts from a clean slate regardless of how the last one ended. Depending
on `upload.reset` specifically (not the whole `upload` object eslint's exhaustive-deps rule wanted)
is deliberate: the whole store snapshot changes identity on every status transition, so depending on
it would re-run this effect - and reset the store - on every step of an in-progress upload
("uploading" -> "grading" -> "success"), not just once on mount. `reset` itself is a stable Zustand
action reference, so scoping the deps array to just that is correct, matching this codebase's
existing precedent (`StrokeOrderCard.tsx`) for a justified `eslint-disable-next-line
react-hooks/exhaustive-deps`.

Re-verified live: re-ran the exact same failed-scan-then-fresh-scan reproduction after the fix - the
new session now starts clean, with the old error nowhere to be seen. Also re-verified the normal
successful path still works end to end (capture -> upload -> grade -> navigate to Results) with the
reset in place, confirming it doesn't interfere with an active upload. Full Playwright e2e suite
(6/6) and the full Vitest suite (83/83, unchanged - this is UI lifecycle behavior, verified live per
this project's own convention, not unit-tested) both clean. `npx tsc --noEmit` and lint clean too.

---

### Phase 48 (beyond the original plan) — a user was trapped mid-upload, and abandoning it wasn't actually safe

Investigating whether Phase 47's fix fully closed the abandoned-session gap surfaced two more real
issues, found together because fixing one made the other significantly easier to hit.

**The trap**: `ScanScreen`'s busy overlay (`role="status"`, "Uploading…"/"Grading…") is
`absolute inset-0 z-20`. `CameraViewfinder`'s header (Close button included) had no explicit
z-index (`z-10` only applies within its own children, not against this outside sibling), so the
overlay - later in DOM order with a higher z-index - painted over the entire camera view, Close
button included. Confirmed live: a real Playwright click on "Close camera" during the busy state
failed outright, with Playwright's own actionability log naming the exact cause -
`<div role="status" ...>Uploading…</div> intercepts pointer events`. A user had zero way to back out
for the whole upload/grade cycle - now up to 60 seconds after Phase 45's timeout - trapped until it
either succeeds or fails on its own.

Fixing that trap (raising the header to `z-30`, above the overlay) makes leaving mid-upload an
expected, easy, everyday action instead of a rare browser-back edge case - which meant the
abandoned-request race Phase 47 didn't fully address became far more likely to actually happen, not
less. Fetches aren't cancelled by unmounting, so two gaps remained: (1) the shared Zustand store's
own `set()` calls would still apply a since-abandoned call's late result on top of whatever a
newer, unrelated scan session is doing; (2) the *old*, now-unmounted `ScanScreen`'s own
`handleCapture` closure keeps running regardless, and would `router.push()` to the abandoned
session's Results page - forcibly navigating the user away from whatever they're doing now, entirely
unprompted, the moment that old request happens to resolve successfully.

Fixed both at once: the store now tracks a `generation` counter, bumped by every `upload()`,
`retryGrade()`, and `reset()` call; each in-flight call captures the generation current when *it*
started, and every `set()` inside it - including the intermediate "now grading" transition, not
just the final result - checks it's still current before touching shared state. Caught a real bug
in this fix's own first draft via its own regression test: guarding only the *final* result but not
the intermediate "grading" `set()` still let a stale call's leading edge stomp a newer session's
already-completed state before its (correctly-skipped) stale result would have applied - the test
failure showed the store left stuck on the stale submissionId in a phantom "grading" state, worse
than before the fix. `ScanScreen` separately tracks its own mounted state via a ref, so
`handleCapture` never navigates on behalf of a call the user has since walked away from.

Verified live end-to-end: re-ran the fake-camera Playwright reproduction and confirmed "Close
camera" is now clickable during the busy overlay and correctly navigates back. Added a store-level
regression test simulating the full scenario (an abandoned upload, a reset, a real second session,
then the abandoned request finally resolving) - it now passes, and previously caught the guard's own
gap before this was committed. Full Playwright e2e suite (6/6, unchanged) and Vitest (84/84, up from
83) both clean. `npx tsc --noEmit` and lint clean too.

---

### Phase 49 (beyond the original plan) — "Try again" could succeed and still leave the user staring at the camera

Two bugs, the second found while verifying the fix for the first.

**Retry never navigated on success.** The "Try again" button's `onClick` fired `upload.retryGrade(...)`
directly and did nothing with its result - unlike `handleCapture`, which awaits `upload.upload(...)`
and navigates to Results on success. A retry that actually *succeeded* left `upload.status` at
`"success"` with nothing rendering it: not the error banner (status is no longer `"error"`), not the
busy overlay (`isBusy` is now false), not a redirect - just the bare camera view, indistinguishable
from a hung request. This has been true since Phase 21 introduced `retryGrade` and was never
actually wired to react to its own outcome. Fixed by extracting a `handleRetry` function mirroring
`handleCapture`'s existing success-navigation logic exactly.

**Verifying that fix caught a second, more serious bug in Phase 48's own `mountedRef` guard.** Live
testing showed the success-navigation check failing intermittently for *both* `handleCapture` and
`handleRetry` - even in scenarios that should have worked. Instrumented directly rather than
guessing: a temporary `console.log` at the decision point showed `mountedRef.current` reading
`false` despite the component being genuinely, currently mounted, camera view still on screen, user
having done nothing to leave. Root cause confirmed against Next.js's own docs: this app's App
Router has React Strict Mode on by default (13.5.1+), un-overridden in `next.config.ts`, and Strict
Mode deliberately double-invokes effects in development (mount → cleanup → mount) specifically to
surface bugs like this one. Phase 48's effect set `mountedRef.current = false` on cleanup but never
reset it back to `true` on the following real mount - so the simulated cleanup's `false` was
permanent, silently breaking every success-navigation for the rest of that component's life,
**in development only** (Strict Mode's double-invoke doesn't happen in production builds - meaning
this would have looked completely broken to anyone testing locally via `npm run dev`, while working
fine in a deployed build, the most confusing possible failure mode).

Fixed with the standard pattern: the effect now also sets `mountedRef.current = true` on its own
body, not just via `useRef`'s initial value, so both the simulated and the real mount correctly
leave it `true`; only a genuine unmount's cleanup sets it `false`. Also chased down and ruled out a
red herring during this investigation: an early re-test after the fix still appeared to fail, but
turned out to be a test-authoring artifact - a fake `submissionId` that wasn't valid UUID format
made the real Results page's Supabase query throw a slow Postgres type error (`invalid input syntax
for type uuid`, ~5s) that just barely exceeded the test's own timeout, unrelated to the actual fix.
Re-ran with a realistic UUID-shaped fake ID and both `handleCapture`'s and `handleRetry`'s success
paths navigated correctly. Full Playwright e2e suite (6/6) and Vitest (84/84, unchanged - this is
dev-mode-specific lifecycle behavior, verified live per this project's established convention) both
clean. `npx tsc --noEmit` and lint clean too.

---

### Phase 50 (beyond the original plan) — the shutter button could enable itself before the camera had a real frame to capture

Also used the now-proven fake-camera Playwright technique to check the `mountedRef`/`preloaded`/
`capturingRef` refs elsewhere in the codebase for the same class of Strict-Mode reset bug Phase 49
found - confirmed the other two (`PrintWorksheetButton`'s `preloaded`, `useCameraCapture`'s own
`capturingRef`) are both set inside plain function calls, never inside a `useEffect` cleanup, so
neither is affected. Not a systemic issue, just Phase 48's one instance.

Continued looking and found a real, now-easily-reproducible gap: `useCameraCapture.start()` called
`setState("streaming")` (which enables `ShutterButton`) immediately after `getUserMedia()` resolved,
before the `<video>` element had necessarily decoded its first frame. `captureOnce()`'s own
`video.videoWidth === 0` guard already existed for exactly this case, but hitting it just returns
`null` silently - `onCapture` never fires, no error, no feedback, the tap simply does nothing.
Confirmed live without needing artificial timing tricks: polling for the shutter button to become
enabled and clicking the instant it did caught `video.videoWidth` still at `0` naturally, and the
upload API was never called - the exact silent-failure anti-pattern this project has already fixed
multiple times elsewhere (TopUpButton, PrintWorksheetButton, malformed request bodies), just not yet
caught here.

Fixed at the root instead of patching the symptom: `start()` now waits for the video's own
`loadedmetadata` event (only when `videoWidth` isn't already non-zero) before transitioning to
`"streaming"`, so the shutter is never enabled before a real frame actually exists to capture -
closing the gap at its source rather than adding a "please wait" message for a race the UI should
never have let happen in the first place. Verified live: re-ran the exact same
poll-and-click-instantly reproduction after the fix and confirmed `video.videoWidth` reads a real
value (1920) by the time the button enables, and the upload API is now correctly called. Re-ran the
normal-timing capture flow too, confirming zero regression to the common case. Full Playwright e2e
suite (6/6, unchanged) and Vitest (84/84, unchanged - this hook has no test file, per this project's
established live-verification convention for DOM-heavy camera code) both clean. `npx tsc --noEmit`
and lint clean too.

---

### Phase 51 (beyond the original plan) — dead code: `useCameraCapture`'s exported `stop()` had no caller

While auditing the other `useRef(true/false)` instances for Phase 49's class of bug, noticed
`useCameraCapture` exports a `stop()` function that `CameraViewfinder` - its only consumer - never
destructures or calls. Confirmed by grepping the entire `capture-worksheet` feature: `stop` appears
nowhere outside its own definition. The hook's unmount `useEffect` already calls the lower-level
`stopStream()` unconditionally on unmount regardless of whether `stop()` is ever invoked, so the
camera hardware genuinely does get released correctly either way - this was unused surface, not a
functional gap. `stop()`'s only additional behavior beyond that cleanup (resetting `state`/
`torchSupported`/`torchOn` React state) only matters for a caller that stops the camera while
staying mounted and potentially restarting it later on the same hook instance - nothing in this app
does that; `CameraViewfinder` always fully unmounts via navigation when closing.

Removed the unused function and its entry in the hook's return value. Verified live, not just by
reading the diff: opened the camera, confirmed the stream's tracks read `"live"`; closed via
navigation and reopened a fresh scan session, confirming the new session gets a clean, working
video stream (`videoWidth: 1920`) - proving the old stream was genuinely released, not left
dangling, with the deletion in place. Full Playwright e2e suite (6/6) and Vitest (84/84, unchanged)
both clean. `npx tsc --noEmit` and lint clean too.

---

### Phase 52 (beyond the original plan) — a production-readiness gate, and one real finding from it

Treated this as an explicit final quality gate rather than more edge-case hunting: fresh production
build, then a full `axe-core` accessibility scan (the same real engine used since Phase 27, not
reused stale results) across every route - `/`, `/history`, `/syllabus`, `/premium`, `/scan`'s
static shell, and `/results/[id]` with a real temporary graded submission (missed character,
`StrokeOrderCard` included) - plus a console/page-error sweep across all of them.

Found one real, previously-uncaught violation, present on all four AppHeader-using routes:
"Ensure all page content is contained by landmarks" (moderate impact, axe rule `region`), pointing
at `AppHeader`'s own content. `ScreenShell` renders `AppHeader` as a sibling of `<main>`, not nested
inside it - and `AppHeader`'s root element was a bare `<div>`, no semantic landmark at all.
`BottomNav`, the equivalent sibling on the other side of `<main>`, already used a real `<nav>` and
was never flagged - confirming this was specifically `AppHeader`'s gap, not a `ScreenShell`-wide
one. Fixed by changing `AppHeader`'s root to a `<header>` element - correctly rendered as the
page's "banner" landmark since it sits outside `<main>`, not nested within other sectioning
content, and it's the only `<header>` in the codebase, so no landmark-uniqueness conflict.

Re-ran the full scan after the fix: 0 violations across every route (previously 1 each on the four
AppHeader routes), 0 console/page errors anywhere. Temporary Results-page submission deleted after,
confirmed 0 remain. Full Playwright e2e suite (6/6) and Vitest (84/84, unchanged - a landmark
element choice isn't unit-testable business logic) both clean. `npx tsc --noEmit` and lint clean
too (on the actual app code; two scratch verification scripts under `.tmp-verify/` flagged a lint
rule but were deleted before commit, never part of the codebase).

---

## 7. Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=        # server-only, never expose to client
GEMINI_API_KEY=                   # server-only
```

No `NEXT_PUBLIC_SUPABASE_ANON_KEY` — the original plan included one for a browser-side Supabase
client, but that client was never actually used anywhere (no auth/session in scope, so nothing
ever needed browser-side Supabase access) and was removed as dead code, along with this env var.

---

## 8. Deployment Checklist

- [x] Supabase project created, schema + seed data applied, `worksheet-photos` bucket created with
  its access policy
- [ ] Vercel project linked to GitHub repo, env vars set in Vercel dashboard (not committed to
  repo) — see README's Deployment section for the exact steps
- [x] Serwist build output verified (manifest reachable, icons load, service worker registers,
  confirmed via Playwright)
- [ ] Live URL tested end-to-end from a real mobile device (needs the deploy above first)
- [x] README includes: setup steps, env vars needed, screenshots, architecture notes, Known
  Limitations, Deployment steps — live URL itself still pending the deploy above

---

## 9. Naming & Convention Notes

- Component files: PascalCase (`ScoreHeader.tsx`)
- Hooks/model files: camelCase, prefixed `use` for hooks (`useCameraCapture.ts`)
- API routes: kebab-case folder names under `app/api/`
- Every new screen/widget/feature = new folder under its FSD layer — do not add unrelated logic to
  `shared/` unless it's genuinely cross-cutting with no business meaning
- Keep Supabase queries inside `entities/*/api/` — screens and widgets never call Supabase directly
- A "feature" folder needs a real second caller or genuinely non-trivial local logic to justify
  itself — see §2's note on `expand-lesson`/`select-level-tab` for what got inlined instead and why
