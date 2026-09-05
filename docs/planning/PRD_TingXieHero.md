# PRD — TingXie HERO: AI-Powered Chinese Handwriting Grading App (PWA)
**Prepared for:** Reemotely / Client AiDi (Jason Chan) — Technical Assignment Submission
**Prepared by:** Caesar Bimantara (Back-End Developer Candidate)
**Document type:** Product Requirements Document
**Companion doc:** See `FSD_TingXieHero.md` for technical architecture & implementation plan

---

## 1. Context & Background

The client is an early-stage EdTech startup building an LMS for Singapore primary school students (P1–P6), with an MVP focused on Chinese spelling practice (听写 / Ting Xie). The product follows a daily learning loop:

**Story Video → Stroke Practice → Paper Test Scan (via phone) → Game Reward**

This assignment scopes only the **Paper Test Scan → AI Grading → Feedback** slice of that loop, packaged as a PWA. The assignment is shared with both Front-End and Back-End candidates; individual strengths are considered in evaluation. This document treats the product as if fully specified, while the companion FSD prioritizes build order to reflect Back-End Developer strengths.

---

## 2. Goals

| Goal | Why it matters |
|---|---|
| Demonstrate the full submission flow: photo → backend → AI grading → correction → frontend overlay | Explicitly stated as **the key evaluation point** by the client |
| Working database pipeline (Supabase) storing lessons, submissions, and per-character results | Core backend competency being assessed |
| Working Gemini Vision integration returning structured grading data | Tests AI integration ability, not accuracy |
| Clean, mockup-matching UI for Dashboard, Syllabus, Camera, Results | Secondary but visible signal of full-stack capability |
| PWA installability | Explicitly required (manifest, icons, viewport) |
| Live deployment on Vercel with working end-to-end flow | Required for submission; graders will test the live flow |

**Explicitly NOT a goal:** AI grading accuracy. The client states this directly — the flow and architecture matter, not whether Gemini correctly reads the handwriting.

---

## 3. Personas

- **Parent (Sarah)** — primary account holder shown in mockups. Scans her child's paper worksheet using her phone. Views syllabus, dashboard, and results on behalf of her child.
- **Student (Lucas, Primary 2)** — the learner. In this MVP, the student does not have a separate login; all screens are parent-facing, showing the student's data (hardcoded per assignment instructions).

*(Note: no multi-user / multi-child support is required — single hardcoded student profile per assignment instructions.)*

---

## 4. Scope

### In scope (build this)
1. Dashboard screen (Screen 1) — hardcoded profile + live-feeling stats where reasonable
2. Syllabus screen (Screen 2) — hardcoded lesson list with expandable vocab cards
3. Camera capture screen (Screen 3) — real camera access, real image capture
4. Backend: Supabase schema, image upload pipeline, Gemini grading pipeline
5. Results screen (Screen 4) — real data pulled from Supabase, with correction overlay
6. PWA manifest
7. Deployment to Vercel with live URL

**Added beyond the original 4 screens, during build:** the bottom navigation on Screens 1 and 2
shows four tabs (Dashboard, Syllabus, History, Premium), but only Dashboard and Syllabus were
scoped with real screens. Rather than let History and Premium 404, both got minimal real
destinations — a **History** screen (list of past graded submissions, linking into Results) and a
**Premium** stub (matches the "Top Up"/credits stub precedent above). Neither is part of the
assignment's evaluated flow; both exist purely so the mockup's own bottom nav doesn't lead
anywhere broken.

### Out of scope (explicitly excluded)
- User authentication / login (not mentioned in assignment; hardcoded profile only)
- Real-time sync between parent's phone and a separate "student device" (belongs to the broader product JD, not this assignment)
- Actual accurate AI handwriting recognition (explicitly de-prioritized by client)
- Real payment processing (no Stripe/payment gateway integration — no actual money changes hands
  anywhere in this app). **Not the same as the "Top Up" button itself**, which was re-scoped mid-build
  into real, DB-backed functionality once the source PDF was re-read (see §5's credits assumption
  row and §6 Screen 1) — it increments `students.credits_total` for real, it just doesn't take a
  real payment to do so.
- Multi-student / multi-child account management
- WhatsApp reminder scheduler (belongs to broader product JD, not this assignment)
- Stroke-order tracing/practice screen (belongs to a different phase of the learning loop — "Stroke Practice" — not this assignment's scope, which starts at "Paper Test Scan")

---

## 5. Assumptions & Interpretations (flagged explicitly — read before building)

| Ambiguity in source doc | Assumption made | Rationale |
|---|---|---|
| "Overlay of the correct word in red pen" — assignment's example prompt only asks Gemini for a correctness JSON array, no coordinates | Extended the prompt/`responseSchema` to also request a `box_2d` bounding box per character (Gemini's documented object-detection output shape, confirmed via Context7 against the same `generateContent` call already in use) and render a real overlay on the graded photo — see Screen 4 below | The assignment explicitly names this exact flow as "the key evaluation point" (both in Evaluation Focus and again as a parenthetical under the grading-engine requirements) and explicitly says word-recognition *accuracy* is not evaluated — so an inexact but real bounding box, not a data table standing in for it, best matches what's actually being assessed. An earlier build pass had substituted a table-only rendering for this; revisited once the source PDF's wording was reread closely (see below). |
| "QR code target box" in camera overlay (Screen 3) | Treated as a **static UI element only** (visual guide box in the viewfinder), not an active QR-scanning feature | No functional QR-scanning requirement appears anywhere in the Technical Requirements section |
| Gemini 1.5 Flash specified, but this model is being deprecated | Substitute with the Google-maintained `gemini-flash-latest` alias via the current `@google/genai` SDK | Assignment explicitly allows "equivalent substitutions... as long as core functionality remains identical." `gemini-2.5-flash` (the initially-planned substitute) was itself retired for new API keys mid-build, and its suggested replacement `gemini-3.6-flash` hit consistent 503s live — the `-latest` alias avoids needing another manual bump on the next retirement. |
| No auth mentioned | No login/auth implemented; student profile hardcoded as instructed | Matches explicit instruction: "Hardcode student profile details (Lucas – Primary 2)" |
| "Prepaid Lesson Credits" (12/20) and "Top Up" button; weekly calendar strip | The Technical Requirements section only says "Hardcode" for the student profile bullet — the credits card and calendar strip bullets are phrased as "Display"/"Include," not "Hardcode." Built as **real, DB-backed data**: a new `students` table (`credits_total`, `credits_expire_at`); "used" is derived from the student's actual `submissions` count (no separately-maintained counter to drift out of sync); "Top Up" calls `POST /api/credits/topup` and actually increments `credits_total`; the calendar strip computes the real current week (native `Date`, no library needed) and highlights whichever day is genuinely today | Re-read closely at your prompt: only one bullet in the source PDF's Dashboard section says "Hardcode," and it names only the student profile. The mockup's "12/20" is the example value shown in the mockup screenshot, not an instruction to freeze that literal number in code. |
| "Connect your upload API to the Gemini 1.5 Flash API" reads as one connected step | Built as **two chained routes**, not one: `POST /api/upload` creates a `pending` submission, then `POST /api/grade` (called immediately after by the client) does the Gemini call and marks it `graded`/`failed` | End-to-end this is still one connected flow from the user's perspective — the client fires both calls back-to-back. Splitting them gives the pipeline a real `pending` state to persist if the Gemini call is slow or fails (matches `submissions.status`'s three values), and lets grading be retried without re-uploading the photo. An "equivalent substitution" per the assignment's own §4, not a shortcut. |

---

## 6. Functional Requirements by Screen

### Screen 1 — Dashboard
**User story:** As a parent, I want to see my child's progress summary and quickly start a new worksheet scan.

- Header: "Welcome back, Sarah" with student switcher showing "Lucas — Primary 2" (hardcoded, switcher can be visual-only/disabled)
- Prepaid Lesson Credits card: real `{used} of {total} Remaining` from the `students` table (used
  derived from actual `submissions` count) and a working "Top Up" button (`POST
  /api/credits/topup`, +10 credits), expiry note from `students.credits_expire_at`
- Mastery Rate stat: "82.4%", delta indicator ("+3.1% this month") — hardcoded; not named in the
  assignment's Technical Requirements section at all (mockup-only), unlike the two items above
- Practiced stat: "48 Characters", "8 lists covered" — same as above, hardcoded
- Upcoming Ting Xie: weekly calendar strip (Mon–Sat) computed from the real current date (native
  `Date`, no calendar library needed for this), today genuinely highlighted
- Upcoming test card: pulls the pending lesson's real `test_scheduled_at` from `lessons`, formatted
  in Asia/Singapore time regardless of server locale (e.g. "Week 4 (第十课) Spelling Test —
  Wednesday, 14 Oct at 3:00 PM · P2 MOE Syllabus")
- Primary CTA: **"Scan & Grade Worksheet"** button → navigates to Camera screen (Screen 3)
- Bottom navigation: Dashboard, Syllabus, History, Premium (only Dashboard and Syllabus need to be functional destinations; History can route to Results screen; Premium can be a stub)

**Acceptance criteria:**
- [x] Page renders matching mockup layout/hierarchy — verified via a dedicated mockup-fidelity
  pass (screenshot compared side-by-side against `screen1-dashboard.png`)
- [x] "Scan & Grade Worksheet" navigates to camera capture flow
- [x] Responsive on mobile viewport (this is a PWA, mobile-first) — verified at 375/390/414/430px
  widths; no desktop/tablet layout, which matches the brief (re-verified directly against the
  source PDF, not just the mockup images — no responsive requirement appears anywhere in it)
- [x] Credits card and calendar strip pull real data, not hardcoded mockup values — verified
  end-to-end against the live `students`/`lessons` tables: the real current week renders (correctly
  rolling across a month boundary), today is genuinely highlighted, the test-schedule banner shows
  the right time in Asia/Singapore regardless of server locale, and clicking "Top Up" actually
  increments `students.credits_total` in Supabase and the UI reflects it after `router.refresh()`

---

### Screen 2 — Syllabus
**User story:** As a parent, I want to browse my child's Chinese syllabus by level and see which lessons are done, pending, or need revision.

- Header: same profile bar as Dashboard
- P1–P6 tab/pill selector (P2 active by default, matching student's grade)
- Header text: "MOE Primary 2 Syllabus · N Lessons Total" — the mockup shows a static "24" as an
  example; the actual count is computed live from however many lessons are seeded for the active
  level (currently 3 for P2, 0 for P1/P3-P6)
- Expandable lesson cards, each showing:
  - Week number + lesson title (Chinese + pinyin/translation), e.g. "Week 4 《第十课 – 我们的校园》"
  - Status badge: **Pending Practice** / **Completed** / **Needs Revision** — this is the one
    Dashboard/Syllabus bullet the assignment actually says to hardcode ("Hardcode status tags
    (Pending, Completed)"), so the label text stays exactly that. What's **not** hardcoded: the
    `(80%)` that used to be baked into the "Completed" string as a fixed literal, unconditionally,
    on every completed lesson regardless of how it was actually graded. That's not "the tag" — it's
    a fabricated statistic riding along inside it. Now computed for real from the lesson's most
    recent graded `submissions` row (`getStatusLabel`); a completed lesson with no graded
    submission yet shows plain "Completed", no invented number.
  - Vocabulary list on expand: character + pinyin pairs (e.g. 校园 xiào yuán, 礼堂 lǐ táng, 老师 lǎo shī)
    — real `lessons.vocabulary` jsonb, not hardcoded
  - "Print A4 Worksheet (PDF)" link — real, not a stub: generates and downloads an actual Tian
    Zige practice-sheet PDF for the lesson's vocabulary (`generateWorksheetPdf`, `pdf-lib`). Not
    named anywhere in the assignment's Technical Requirements text (mockup-only, same basis as
    leaving Mastery Stats hardcoded), but built anyway once a real, low-effort implementation was
    found — see FSD §6 Phase "feature-ideas audit" for the reasoning and `docs/research/feature-ideas-audit.md`
    for the full comparison against alternatives

**Seed data required (hardcode or seed into `lessons` table):**
| Week | Title | Status | Vocabulary |
|---|---|---|---|
| 4 | 第十课 – 我们的校园 | Pending Practice | 校园 (xiào yuán), 礼堂 (lǐ táng), 老师 (lǎo shī) |
| 3 | 第九课 – 我爱我的家 | Completed | 爸爸 (bà ba), 妈妈 (mā ma), 温暖 (wēn nuǎn) |
| 2 | 第八课 – 快乐的周末 | Needs Revision | 玩耍 (wán shuǎ), 公园 (gōng yuán) |

**Acceptance criteria:**
- [x] Tab selector switches active level (P2 has 3 seeded lessons; P1/P3-P6 correctly show an empty state, no seed data for those levels)
- [x] Lesson cards expand/collapse to reveal vocabulary
- [x] Status badges render correctly per lesson, with a real (not fabricated) percentage on
  "Completed" — verified by inserting a real temp graded submission (8/10) for the seeded
  "completed" lesson, confirming the card rendered "Completed (80%)" from that actual row, then
  deleting it and confirming 0 rows remain

---

### Screen 3 — Camera Capture & Live Alignment Viewfinder
**User story:** As a parent, I want to photograph my child's completed worksheet so it can be graded automatically.

- Full-screen camera view using rear camera (`getUserMedia`, `facingMode: environment`, `width`/
  `height` ideal 1920×1080 — an *ideal* hint, so it degrades gracefully on cameras that can't do
  1080p instead of failing `getUserMedia` outright)
- Header: "Align Worksheet" title, close (X) button, **a real flash toggle button** — not just the
  icon from the mockup. Calls `track.applyConstraints({ advanced: [{ torch }] })` where the camera
  reports the (non-standard, Chromium-only) `torch` capability; disabled rather than hidden where
  it isn't supported (Safari/Firefox have no torch API at all — confirmed via Context7/MDN, not
  assumed), so the design element is always present but never claims a capability the
  device/browser doesn't have
- Overlay: centered rectangular guide box with corner brackets, instruction text ("Keep page flat and inside the brackets"), QR target box (static visual element per Section 5 assumption — a dashed-border icon box, positioned clear of the corner brackets)
- Bottom: circular shutter button — "Capture & Grade"
- On capture: try `ImageCapture.takePhoto()` first (captures at the camera's full photo resolution,
  genuinely higher than the video preview stream, where supported — Chromium only, confirmed via
  Context7/MDN), falling back to the original canvas-snapshot-of-the-video-element approach
  everywhere else (Safari, Firefox, or if `takePhoto()` itself throws on specific hardware) —
  convert to Blob/File, show uploading state, POST to backend upload endpoint
- On successful grading response: navigate to Results screen (Screen 4) with the new submission's ID

**Acceptance criteria:**
- [ ] Camera permission requested and stream displays live video — **code complete, not yet
  verified on a real device.** Headless Chromium's fake camera device doesn't produce a usable
  stream in this dev sandbox (confirmed via a direct `getUserMedia` test), so this needs a human on
  an actual phone/browser before showcase.
- [ ] Capture button produces an image blob from the live stream — same real-device caveat as above
- [x] Uploading state is visually indicated (spinner/progress) while backend processes — verified
  (uploading/grading states render correctly in `ScanScreen`)
- [x] Error state handled gracefully if camera permission denied or upload fails — verified via
  Playwright (permission-denied path) and the store's own tests (upload/grade failure paths)

---

### Screen 4 — Results / Test Feedback
**User story:** As a parent, I want to see my child's graded results with clear indication of which characters were correct or incorrect, and track progress over time.

- Header: "Test Feedback — Week 4 Syllabus Test" with status badge ("Needs Revision" or similar, derived from score)
- Score display: large circular badge showing score (e.g. "8/10", "80%")
- Metadata: "Graded on [date], [time]", "[N] character(s) missed"
- **Correction feedback (KEY EVALUATION POINT — the assignment PDF itself names this exact flow,
  "sending back to the front end for overlay of the correct word in red pen," as the key
  evaluation point, both in its Evaluation Focus section and again as a parenthetical under the
  grading-engine requirements):** shipped as `WorksheetOverlay` — the actual graded photo,
  rendered with a red-bordered box + red "correct word" label over every incorrect character and
  a green-bordered box + check mark over every correct one, positioned from a bounding box Gemini
  returns alongside its correctness verdict (via `box_2d`, normalized 0-1000 — confirmed supported
  by the same `generateContent`/`responseSchema` call already in use, via Context7). **Revision
  history:** an earlier pass removed a *different*, planned `CorrectionOverlay` widget (a chip
  list under the score) on the reasoning that the Historical Matrix's current-date column already
  showed the same ✓/✗ per character — true, but that only satisfies Section 5's literal spec for
  Screen 4 (Score Header + Historical Matrix Table), not the Evaluation Focus section's explicit
  description of the flow's *output*: a red-pen mark on the photo itself. Re-read against the
  source PDF (not just the mockup, which only depicts Screens 1/2/4-as-a-table and never shows the
  camera-to-photo step), the two requirements are complementary, not redundant — the matrix tracks
  history across dates, the overlay is the single-submission correction the client explicitly
  calls out. Both now ship.
- Historical Matrix Table: rows = tested Chinese characters/words (with pinyin shown underneath
  each one, matching the mockup — pulled from the submission's lesson `vocabulary`), columns = test
  dates; cells show green check (✓) or red cross (✗) per historical `character_results` records for
  that character. Required by name in the assignment's Section 5 ("Results Matrix"); kept alongside
  the overlay above, not replaced by it.
- Actions: "Share Report" (can be a stub — e.g. copy link or share sheet trigger), "Retest Missed" (can route back to camera flow, or be a stub if out of time)

**Acceptance criteria:**
- [x] Score, date, and missed-character count pull from the actual `submissions` record (live data,
  not hardcoded) — verified via real upload → real Gemini grade → real Supabase write → real render
- [x] Correction feedback clearly shows correct vs. incorrect characters with the correct answer
  visible for mistakes — via both the Historical Matrix's current-date column and the
  `WorksheetOverlay` red/green marks on the graded photo (see above)
- [x] `WorksheetOverlay` verified against real Supabase data end-to-end — the live
  `bounding_box` column and a temp submission (with real bounding boxes) were inserted directly,
  `/results/[id]` was rendered and screenshotted for real, then the temp rows were deleted and
  confirmed gone (0 rows remaining), not just the throwaway-preview check the initial commit
  shipped with. A real Gemini-graded submission (not a temp row) still hasn't gone through this
  path — that only happens on an actual `/scan` upload, which needs the real-device camera test
  below.
- [x] Historical matrix reflects real historical `character_results` rows from Supabase, not mock
  data
- [x] Page is reachable both immediately after a new scan and via a "History" entry point — History
  screen lists past graded submissions and links into each one's Results page

---

## 7. Data Model (product-level description — see FSD for SQL DDL)

**`lessons`**
Represents a syllabus lesson: title, MOE grade level, and its vocabulary/word list.

**`submissions`**
Represents one graded worksheet scan: which student, when submitted, the uploaded image's storage URL, and the computed total score.

**`character_results`**
Represents the per-character grading outcome of a single submission: which character, correct or incorrect, linked back to its parent submission.

**`students`**
The single hardcoded student profile (no auth in scope): owns prepaid lesson credits
(`credits_total`, `credits_expire_at`). "Used" credits are derived from that student's actual
`submissions` count rather than a separately-maintained counter. Added during build (see FSD §6
Phase 7) once the credits card and calendar strip were re-read as real, DB-backed requirements
rather than hardcoded mockup values — not part of the original 3-table sketch.

---

## 8. Non-Functional Requirements

- **Mobile-first / PWA:** Must be installable via manifest (icons + viewport meta), since the real use case is a parent scanning on their phone.
- **Security:** Gemini API key and Supabase service role key must live server-side only (Next.js API routes / server actions), never exposed to the client bundle.
- **NDA-safety:** Since this is a take-home for a company with IP-sensitive policies, avoid referencing this project publicly by client name after submission unless explicitly permitted.
- **Performance:** Not a primary evaluation criterion per the assignment, but image upload should show loading feedback so the flow doesn't feel broken during the Gemini round-trip (which can take a few seconds).
- **Test coverage:** 63 unit tests (Vitest, 22 files) covering every entity function's business
  logic — Gemini response parsing, score computation, the pivot logic behind the historical matrix,
  the grade-submission pipeline's orchestration order — against fakes, no live credentials needed to
  run them. 5 Playwright E2E cases (one spec) covering navigation, tab switching, and both History
  states (empty and populated). The camera's live video stream is the one thing that can't be
  exercised this way — headless Chromium's fake camera device doesn't produce a usable stream in
  this environment — so that path is verified structurally (layout, error states) rather than
  end-to-end.

---

## 9. Evaluation Mapping (why this PRD satisfies the grading criteria)

| Client's stated evaluation focus | How this PRD addresses it |
|---|---|
| "Features of the app and communication to the backend... the flow is important" | Section 6 defines the full photo → upload → grade → overlay flow end-to-end with explicit acceptance criteria per step |
| "Accuracy of word recognition is not important" | Section 5 explicitly deprioritizes grading accuracy as a build concern; effort is directed at pipeline correctness instead |
| "Well-executed partial solution over rushed, incomplete one" | Section 4 scope clearly separates in-scope vs. out-of-scope, allowing focused, complete execution of the core flow rather than a shallow attempt at everything |

---

## 10. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Gemini model deprecated/unavailable | Realized twice during build, not just a theoretical risk: `gemini-2.5-flash` (the initial substitute) was retired for new API keys, then `gemini-3.6-flash` hit consistent 503s. Settled on the `gemini-flash-latest` alias (see Section 5) specifically so the next retirement doesn't need a manual bump. |
| Camera permissions denied on some devices/browsers | Graceful fallback UI with retry instructions, verified via Playwright. Real-device test on a mobile browser still needed before showcase (no desktop scope — see Screen 1 acceptance criteria) — this sandbox can't produce a working camera stream in headless Chromium. |
| Free-tier rate limits (Gemini / Supabase) hit during grading/demo | Keep grading prompt minimal (JD confirms accuracy isn't graded); avoid unnecessary repeated calls during testing |
| Time overrun across 5-day window | Follow phased build order in FSD; core flow (upload → grade → overlay) is completed before UI polish |
| Upload endpoint accepting arbitrary files | Not anticipated in the original plan — found during a later maturity audit: `/api/upload` accepted any `Blob` with no size or type check. Fixed with `validateWorksheetImage` (image MIME + 10MB limit) before anything touches Storage or Gemini. |
