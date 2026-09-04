# FSD — TingXie HERO: Technical Architecture & Build Plan
**Companion doc:** See `PRD_TingXieHero.md` for product requirements & scope
**Architecture style:** Feature-Sliced Design (FSD), Open/Closed principle — new feature = new file/folder, avoid modifying shared code across features
**Status:** Build complete (Phases 1-5) + a maturity/audit pass beyond the original 5-day plan — see §6. This document reflects the **as-built** system, not the original plan; where the two diverged, a note explains why.

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
│   │   └── page.tsx                        # Not in original 4-screen scope — added because the
│   │                                        # bottom nav's "History" tab needs a real destination;
│   │                                        # lists past graded submissions, links into Results
│   ├── premium/
│   │   └── page.tsx                        # Stub page (bottom nav needs a destination; feature is
│   │                                        # explicitly out of scope per PRD §4)
│   ├── api/
│   │   ├── upload/route.ts                 # POST /api/upload
│   │   └── grade/route.ts                  # POST /api/grade
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
│   ├── app-header/ui/AppHeader.tsx         # shared avatar + welcome text + level pill + bell,
│   │                                        # used by Dashboard, Syllabus, Premium
│   ├── bottom-nav/ui/BottomNav.tsx         # Dashboard / Syllabus / History / Premium
│   ├── credits-card/ui/CreditsCard.tsx
│   ├── mastery-stats/ui/MasteryStats.tsx
│   ├── weekly-calendar-strip/ui/WeeklyCalendarStrip.tsx
│   ├── lesson-card/ui/LessonCard.tsx
│   ├── camera-viewfinder/ui/CameraViewfinder.tsx
│   ├── score-header/ui/ScoreHeader.tsx
│   └── historical-matrix/ui/HistoricalMatrix.tsx
│       # No separate CorrectionOverlay widget — see PRD §6 Screen 4 for why
│       # (the historical matrix's own current-date column already shows the
│       # current submission's per-character correctness).
│
├── features/                               # user actions / interactions
│   ├── capture-worksheet/
│   │   ├── model/useCameraCapture.ts       # getUserMedia + canvas capture, real browser-API complexity
│   │   └── ui/ShutterButton.tsx
│   └── upload-submission/
│       └── model/useUploadSubmission.ts    # Zustand store: POST /api/upload -> POST /api/grade,
│                                            # tracks idle/uploading/grading/success/error,
│                                            # upload() resolves to the terminal state (not void)
│       # No expand-lesson or select-level-tab feature folders — both were single-caller
│       # (SyllabusScreen only) thin useState wrappers, inlined during a repo-wide
│       # over-engineering audit (ponytail-audit). MOE_LEVELS/MoeLevel now live as a
│       # local const/type in SyllabusScreen.tsx.
│
├── entities/                               # domain models — pure data shape + fetch logic
│   ├── lesson/
│   │   ├── model/types.ts                  # Lesson, VocabEntry
│   │   └── api/getLessons.ts
│   ├── submission/
│   │   ├── model/types.ts
│   │   └── api/
│   │       ├── createSubmission.ts         # POST /api/upload step 2: insert pending submission
│   │       ├── uploadWorksheetImage.ts     # POST /api/upload step 1: Storage upload
│   │       ├── validateWorksheetImage.ts   # trust-boundary check (image MIME + <=10MB) before
│   │       │                               # either of the above run
│   │       ├── getSubmissionForGrading.ts  # POST /api/grade step 1: fetch image_url + vocabList
│   │       ├── gradeWithGemini.ts          # POST /api/grade step 2: prompt, safety settings,
│   │       │                               # mediaResolution, response parsing, score computation
│   │       ├── saveGradingResult.ts        # POST /api/grade step 3: write character_results,
│   │       │                               # update submissions.status/graded_at
│   │       ├── getSubmissionDetail.ts      # Results screen data (join lessons for week_number)
│   │       └── listSubmissionHistory.ts    # History screen data (graded submissions only)
│   └── character-result/
│       ├── model/types.ts                  # CharacterResult
│       └── api/
│           ├── getCharacterHistory.ts      # batched query across all matching characters
│           │                               # (one query, not N+1 per character)
│           └── buildCharacterHistoryMatrix.ts  # pure pivot logic (rows/cols), TDD seam
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
    │   └── utils.ts                        # cn() (clsx + tailwind-merge)
    ├── ui/                                  # Shadcn primitives: Button, Card, Badge, Tabs, Table,
    │                                        # Avatar, Skeleton
    └── config/
        ├── requireEnv.ts                   # shared "throw if missing" helper
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

**Tables:** `lessons` (syllabus content + vocabulary jsonb), `submissions` (one graded worksheet
scan, FK to `lessons`), `character_results` (per-character grading outcome, FK to `submissions`,
cascade delete).

**RLS:** No end-user auth in scope, so no `auth.uid()`-scoped policies. All three tables get a
public-read policy for `anon`/`authenticated`; writes only ever happen server-side via the service
role key, which bypasses RLS entirely.

**Storage:** `worksheet-photos` bucket, public. Public rather than signed-URL because the upload
flow needs a URL immediately usable without a round trip — **note:** the Results screen ended up
never rendering the photo itself (only the grading data), so this bucket is effectively only ever
read server-side (`POST /api/grade` fetches the image to send to Gemini). The public-bucket choice
is still a reasonable simplification (worksheet photos aren't sensitive PII), just not for the
original "client renders it directly" reason.

**Seed data** (`supabase/seed.sql`, matches PRD §6 Screen 2): 3 lessons for P2 (weeks 2-4, one each
of `pending`/`completed`/`needs_revision` status) with their vocabulary lists. P1 and P3-P6 have no
seed lessons — the Syllabus screen's tab selector for those levels correctly renders an empty
state.

---

## 4. API Contract

Two real API routes — the flow the assignment evaluates. Everything else (Dashboard, Syllabus,
Results, History) is a React Server Component fetching its entity function directly, **not** a
separate GET API layer — see the note at the end of this section for why.

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

**Server logic:**
1. Fetch the submission's `image_url` and its lesson's `vocabulary` list (`getSubmissionForGrading`).
2. Fetch the image, base64-encode it, call Gemini with the prompt + `responseSchema` +
   `safetySettings` (`BLOCK_ONLY_HIGH` — content is always a benign child's worksheet photo) +
   `mediaResolution: MEDIA_RESOLUTION_HIGH` (`gradeWithGemini`).
3. Check `promptFeedback.blockReason` first (a named condition, not a parse failure) before
   attempting to parse `response.text` as JSON.
4. Write `character_results` rows, update `submissions.status = 'graded'`, `graded_at = now()`
   (`saveGradingResult`).

**Response:**
```json
{ "submissionId": "uuid", "score": 8, "totalPossible": 10,
  "results": [{ "character": "校园", "isCorrect": true }, ...] }
```

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
    responseSchema: { /* array of { character: string, isCorrect: boolean } */ },
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

**Deliberately still open**, tracked rather than silently left:
- [ ] Vercel env vars set, deploy triggered, live URL added to README — deferred pending your
  explicit go-ahead (standing instruction from earlier in this project).
- [ ] Real-device camera test (`/scan`) — cannot be done from this sandbox; needs a human on an
  actual phone/browser.

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
