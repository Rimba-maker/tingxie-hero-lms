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
│   │       ├── validateWorksheetImage.ts   # trust-boundary check (image MIME + <=10MB) before
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
1. Validate the image (`validateWorksheetImage`: must be `image/*`, ≤10MB) — 400 with a clear
   message if not, before anything touches Storage.
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
