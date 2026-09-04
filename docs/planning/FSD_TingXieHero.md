# FSD — TingXie HERO: Technical Architecture & Build Plan
**Companion doc:** See `PRD_TingXieHero.md` for product requirements & scope
**Architecture style:** Feature-Sliced Design (FSD), Open/Closed principle — new feature = new file/folder, avoid modifying shared code across features
**Target:** Hand this document directly to Claude Code CLI as the implementation spec

---

## 1. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 14+ (App Router) | Default stack |
| Language | TypeScript | Strict mode on |
| Styling | Tailwind CSS v4 + Shadcn UI | Table, Badge, Tabs, Card components map directly to Results/Syllabus UI |
| Database | Supabase (PostgreSQL) | Matches assignment spec |
| Storage | Supabase Storage Bucket | For uploaded worksheet photos |
| AI Vision | Google Gemini via `@google/genai` SDK | **Substitution from deprecated `gemini-1.5-flash`** → use `gemini-2.0-flash` or `gemini-2.5-flash` |
| Deployment | Vercel | Frontend + API routes together |
| PWA | Serwist (`@serwist/next`) | `next-pwa` is stale and has known App Router issues; Serwist is the maintained Workbox fork built for App Router — see FSD §6 Phase 5 |
| State (client) | Zustand | For camera/upload flow state only — most data is server-fetched |

---

## 2. Feature-Sliced Design Folder Structure

```
src/
├── app/                          # Next.js App Router — routing shell only
│   ├── (dashboard)/
│   │   └── page.tsx              # Screen 1 route
│   ├── syllabus/
│   │   └── page.tsx              # Screen 2 route
│   ├── scan/
│   │   └── page.tsx              # Screen 3 route
│   ├── results/
│   │   └── [submissionId]/
│   │       └── page.tsx          # Screen 4 route
│   ├── api/
│   │   ├── upload/route.ts       # POST /api/upload
│   │   ├── grade/route.ts        # POST /api/grade
│   │   └── submissions/
│   │       └── [id]/route.ts     # GET /api/submissions/:id
│   ├── manifest.ts               # PWA manifest
│   └── layout.tsx
│
├── screens/                      # FSD "pages" layer — screen compositions
│   ├── dashboard/
│   │   └── ui/DashboardScreen.tsx
│   ├── syllabus/
│   │   └── ui/SyllabusScreen.tsx
│   ├── scan/
│   │   └── ui/ScanScreen.tsx
│   └── results/
│       └── ui/ResultsScreen.tsx
│
├── widgets/                      # composed UI blocks used by screens
│   ├── credits-card/
│   │   └── ui/CreditsCard.tsx
│   ├── mastery-stats/
│   │   └── ui/MasteryStats.tsx
│   ├── weekly-calendar-strip/
│   │   └── ui/WeeklyCalendarStrip.tsx
│   ├── lesson-card/
│   │   └── ui/LessonCard.tsx
│   ├── camera-viewfinder/
│   │   └── ui/CameraViewfinder.tsx
│   ├── score-header/
│   │   └── ui/ScoreHeader.tsx
│   ├── correction-overlay/
│   │   └── ui/CorrectionOverlay.tsx
│   └── historical-matrix/
│       └── ui/HistoricalMatrix.tsx
│
├── features/                     # user actions / interactions
│   ├── capture-worksheet/
│   │   ├── model/useCameraCapture.ts     # getUserMedia + capture logic
│   │   └── ui/ShutterButton.tsx
│   ├── upload-submission/
│   │   └── model/useUploadSubmission.ts  # POST to /api/upload, tracks upload state (Zustand)
│   ├── expand-lesson/
│   │   └── model/useExpandLesson.ts      # local expand/collapse state
│   └── select-level-tab/
│       └── model/useLevelTab.ts          # P1–P6 tab state
│
├── entities/                     # domain models — pure data shape + fetch logic
│   ├── lesson/
│   │   ├── model/types.ts                # Lesson type
│   │   └── api/getLessons.ts             # Supabase query
│   ├── submission/
│   │   ├── model/types.ts                # Submission type
│   │   └── api/
│   │       ├── createSubmission.ts
│   │       └── getSubmission.ts
│   └── character-result/
│       ├── model/types.ts                # CharacterResult type
│       └── api/
│           ├── saveCharacterResults.ts
│           └── getCharacterResultsHistory.ts
│
└── shared/                       # cross-cutting, no business logic
    ├── lib/
    │   ├── supabase/
    │   │   ├── client.ts                 # browser client — plain @supabase/supabase-js + anon key (no @supabase/ssr: no auth/session in scope)
    │   │   └── server.ts                 # server client — plain @supabase/supabase-js + service role key, server-only
    │   └── gemini/
    │       └── client.ts                 # @google/genai client instance
    ├── ui/                                # Shadcn primitives (Button, Card, Badge, Tabs, Table)
    ├── config/
    │   ├── env.client.ts                 # typed access to NEXT_PUBLIC_* vars only, safe anywhere
    │   └── env.server.ts                 # typed access to service-role/Gemini keys, `server-only`-guarded
    └── types/
        └── api.ts                        # shared API request/response types
```

**Open/Closed reminder:** when adding a new screen or widget later, create a new folder under the relevant layer — never bolt unrelated logic onto an existing entity/widget file.

---

## 3. Database Schema (Supabase / PostgreSQL DDL)

**Applied version:** `supabase/schema.sql` + `supabase/seed.sql` — reviewed against
the `supabase-postgres-best-practices` skill (RLS policies, FK indexes, status
check constraints, `numeric(4,1)` for scores, storage bucket policy added). The
sketch below is the original design intent; the files are the source of truth.

```sql
-- lessons: syllabus content
create table lessons (
  id uuid primary key default gen_random_uuid(),
  week_number int not null,
  title text not null,               -- e.g. "第十课 – 我的校园"
  moe_level text not null,           -- e.g. "P2"
  status text not null default 'pending', -- 'pending' | 'completed' | 'needs_revision'
  vocabulary jsonb not null,         -- [{ "character": "校园", "pinyin": "xiào yuán" }, ...]
  created_at timestamptz default now()
);

-- submissions: one graded worksheet scan
create table submissions (
  id uuid primary key default gen_random_uuid(),
  student_id text not null default 'lucas-p2',  -- hardcoded per assignment scope
  lesson_id uuid references lessons(id),
  image_url text not null,           -- Supabase Storage public/signed URL
  total_score numeric,               -- e.g. 8.0 (out of 10)
  total_possible int not null default 10,
  status text not null default 'pending', -- 'pending' | 'graded' | 'failed'
  submitted_at timestamptz default now(),
  graded_at timestamptz
);

-- character_results: per-character grading outcome
create table character_results (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references submissions(id) on delete cascade,
  character text not null,           -- e.g. "礼堂"
  is_correct boolean not null,
  created_at timestamptz default now()
);

-- indexes for the historical matrix query (character x date lookups)
create index idx_character_results_character on character_results(character);
create index idx_submissions_submitted_at on submissions(submitted_at);
```

**Seed data** (insert on setup, matches PRD §6 Screen 2 table):
```sql
insert into lessons (week_number, title, moe_level, status, vocabulary) values
(4, '第十课 – 我的校园', 'P2', 'pending',
  '[{"character":"校园","pinyin":"xiào yuán"},{"character":"礼堂","pinyin":"lǐ táng"},{"character":"老师","pinyin":"lǎo shī"}]'),
(3, '第九课 – 我爱我的家', 'P2', 'completed',
  '[{"character":"爸爸","pinyin":"bà ba"},{"character":"妈妈","pinyin":"mā ma"},{"character":"温暖","pinyin":"wēn nuǎn"}]'),
(2, '第八课 – 快乐的周末', 'P2', 'needs_revision',
  '[{"character":"玩耍","pinyin":"wán shuǎ"},{"character":"公园","pinyin":"gōng yuán"}]');
```

**Storage bucket:** create a public (or signed-URL) bucket named `worksheet-photos` in Supabase Storage.

---

## 4. API Contract

### `POST /api/upload`
Uploads captured photo, creates a pending submission record.

**Request:** `multipart/form-data` — `{ image: Blob, lessonId: string }`

**Response:**
```json
{ "submissionId": "uuid", "status": "pending" }
```

**Server logic:**
1. Upload image blob to Supabase Storage bucket `worksheet-photos`
2. Insert row into `submissions` with `image_url`, `lesson_id`, `status: 'pending'`
3. Return `submissionId` to client
4. Client immediately calls `/api/grade` with the `submissionId` (or this route triggers grading server-side directly — see Section 6 for build-order tradeoff)

### `POST /api/grade`
Runs Gemini Vision grading on a pending submission.

**Request:**
```json
{ "submissionId": "uuid" }
```

**Response:**
```json
{
  "submissionId": "uuid",
  "score": 8,
  "totalPossible": 10,
  "results": [
    { "character": "校园", "isCorrect": true },
    { "character": "礼堂", "isCorrect": false },
    { "character": "老师", "isCorrect": true }
  ]
}
```

**Server logic:**
1. Fetch submission's `image_url` and associated lesson's `vocabulary` list
2. Call Gemini with the image + prompt (see Section 6)
3. Parse JSON response, compute `total_score`
4. Insert rows into `character_results`, update `submissions.status = 'graded'`, `graded_at = now()`
5. Return structured result to client for the overlay UI

### `GET /api/submissions/:id`
Fetches a single submission with its character results — used by Results screen.

**Response:**
```json
{
  "id": "uuid",
  "score": 8,
  "totalPossible": 10,
  "submittedAt": "2026-10-14T15:12:00Z",
  "imageUrl": "https://...",
  "characterResults": [
    { "character": "校园", "isCorrect": true },
    { "character": "礼堂", "isCorrect": false }
  ]
}
```

### `GET /api/character-history?character=礼堂` (or batch equivalent)
Fetches historical correct/incorrect records per character across submission dates — powers the Historical Matrix Table (PRD §6 Screen 4).

**Response:**
```json
{
  "character": "礼堂",
  "history": [
    { "date": "2026-10-08", "isCorrect": false },
    { "date": "2026-10-10", "isCorrect": false },
    { "date": "2026-10-12", "isCorrect": true }
  ]
}
```
*(Implementation note: for the matrix table showing multiple characters × multiple dates, prefer a single batched query — e.g. `GET /api/character-history/matrix` returning all rows/columns at once — over N+1 calls per character.)*

---

## 5. Gemini Integration Detail

```ts
// shared/lib/gemini/client.ts
import { GoogleGenAI } from '@google/genai';

export const gemini = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});
```

```ts
// entities/submission/api/gradeSubmission.ts (server-only)
const prompt = `Compare the handwriting in this Tian Zige grid against the expected spelling list [${vocabList.join(', ')}]. Return which words were written correctly or incorrectly.`;

const response = await gemini.models.generateContent({
  model: 'gemini-2.5-flash', // substituted from deprecated gemini-1.5-flash
  contents: [
    { role: 'user', parts: [
      { text: prompt },
      { inlineData: { mimeType: 'image/jpeg', data: base64Image } }
    ]}
  ],
  config: {
    responseMimeType: 'application/json',
    responseSchema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          character: { type: 'string' },
          isCorrect: { type: 'boolean' },
        },
        required: ['character', 'isCorrect'],
      },
    },
  },
});

const parsed = JSON.parse(response.text); // schema-enforced, but keep a try/catch — treat as untrusted API output regardless
```

**Note:** `responseSchema` makes the Gemini API itself enforce valid JSON matching this shape, replacing the old approach of prompting for JSON and defensively stripping markdown fences. Still wrap the parse in a try/catch and validate before writing to the database — never trust an external API's output blindly.

---

## 6. Build Order (5-day phased plan)

Prioritized for a **Back-End Developer candidate** — backend robustness gets more polish time; frontend gets "clean and functional" but not pixel-perfect.

**Before each phase below, check `docs/agents/build-skills.md`** — it maps installed Claude Code skills to these phases, in invocation order.

### Phase 1 (Day 1) — Foundation
- [ ] Next.js project scaffold, FSD folder structure, Tailwind + Shadcn setup
- [ ] Supabase project, run schema DDL + seed data (Section 3)
- [ ] Env vars configured (Section 7), deploy empty skeleton to Vercel immediately
- [ ] Git repo initialized with meaningful first commit (submission timestamp is verified via GitHub)

### Phase 2 (Day 2) — Core Backend Pipeline
- [ ] `POST /api/upload` — Supabase Storage upload + submission record creation
- [ ] `POST /api/grade` — Gemini integration, prompt, JSON parsing, `character_results` writes
- [ ] Test this pipeline directly via Postman/curl before wiring any UI — **this is the highest-value, highest-risk part of the assignment**

### Phase 3 (Day 3) — Camera + Upload Flow (Screen 3)
- [ ] `getUserMedia` camera access, live preview
- [ ] Capture → Blob conversion → call `/api/upload` → `/api/grade`
- [ ] Uploading/loading states

### Phase 4 (Day 4) — Results, Dashboard, Syllabus (Screens 1, 2, 4)
- [ ] Results screen — score header, correction overlay (per PRD §6 assumption), historical matrix
- [ ] Dashboard screen — hardcoded/derived stats, calendar strip, CTA routing
- [ ] Syllabus screen — tabs, expandable lesson cards, seed data rendering

### Phase 5 (Day 5) — PWA, Polish, Deployment
- [ ] Serwist (`@serwist/next`) manifest + service worker + icons
- [ ] End-to-end test: real photo → real grading → real results, on both desktop and mobile browser
- [ ] README with setup instructions + live Vercel URL
- [ ] Final deploy, verify GitHub last-updated timestamp is well before deadline (Tue Sep 8, 3:00 AM WIB)

---

## 7. Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server-only, never expose to client
GEMINI_API_KEY=                   # server-only
```

---

## 8. Deployment Checklist

- [ ] Supabase project created, schema + seed data applied, Storage bucket `worksheet-photos` created with appropriate access policy
- [ ] Vercel project linked to GitHub repo, env vars set in Vercel dashboard (not committed to repo)
- [ ] Serwist build output verified (manifest reachable, icons load, service worker registers)
- [ ] Live URL tested end-to-end from a real mobile device (camera access requires HTTPS — Vercel provides this by default)
- [ ] README includes: setup steps, env vars needed, live URL, brief note on architecture decisions and the assumptions from PRD §5

---

## 9. Naming & Convention Notes (for Claude Code CLI to follow)

- Component files: PascalCase (`ScoreHeader.tsx`)
- Hooks/model files: camelCase, prefixed `use` for hooks (`useCameraCapture.ts`)
- API routes: kebab-case folder names under `app/api/`
- Every new screen/widget/feature = new folder under its FSD layer — do not add unrelated logic to `shared/` unless it's genuinely cross-cutting with no business meaning
- Keep Supabase queries inside `entities/*/api/` — screens and widgets should not call Supabase directly
