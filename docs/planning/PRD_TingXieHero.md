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

### Out of scope (explicitly excluded)
- User authentication / login (not mentioned in assignment; hardcoded profile only)
- Real-time sync between parent's phone and a separate "student device" (belongs to the broader product JD, not this assignment)
- Actual accurate AI handwriting recognition (explicitly de-prioritized by client)
- Payment / credits top-up functionality (UI display only, "Top Up" button can be non-functional or a stub)
- Multi-student / multi-child account management
- WhatsApp reminder scheduler (belongs to broader product JD, not this assignment)
- Stroke-order tracing/practice screen (belongs to a different phase of the learning loop — "Stroke Practice" — not this assignment's scope, which starts at "Paper Test Scan")

---

## 5. Assumptions & Interpretations (flagged explicitly — read before building)

| Ambiguity in source doc | Assumption made | Rationale |
|---|---|---|
| "Overlay of the correct word in red pen" — no coordinate/bounding-box data specified in the Gemini prompt or response schema | Implement as a **structured annotation overlay**: display the captured photo alongside a results list where incorrect characters are shown with the correct character rendered in red text next to/below them — not pixel-precise placement on the image itself | Gemini prompt in the assignment only returns a JSON array of character correctness, not coordinates. Pixel-exact overlay would require bounding-box data not requested in the spec. |
| "QR code target box" in camera overlay (Screen 3) | Treated as a **static UI element only** (visual guide box in the viewfinder), not an active QR-scanning feature | No functional QR-scanning requirement appears anywhere in the Technical Requirements section |
| Gemini 1.5 Flash specified, but this model is being deprecated | Substitute with **Gemini 2.0 Flash or 2.5 Flash** via the current `@google/genai` SDK | Assignment explicitly allows "equivalent substitutions... as long as core functionality remains identical" |
| No auth mentioned | No login/auth implemented; student profile hardcoded as instructed | Matches explicit instruction: "Hardcode student profile details (Lucas – Primary 2)" |
| "Prepaid Lesson Credits" (12/20) and "Top Up" button | Displayed as static/hardcoded data; "Top Up" button present in UI but non-functional (or shows a disabled/toast state) | Not covered by any Technical Requirement bullet — UI-reference only |

---

## 6. Functional Requirements by Screen

### Screen 1 — Dashboard
**User story:** As a parent, I want to see my child's progress summary and quickly start a new worksheet scan.

- Header: "Welcome back, Sarah" with student switcher showing "Lucas — Primary 2" (hardcoded, switcher can be visual-only/disabled)
- Prepaid Lesson Credits card: "12 of 20 Remaining", "Top Up" button (non-functional stub), expiry note ("Credits expire on 30 Nov 2026")
- Mastery Rate stat: "82.4%", delta indicator ("+3.1% this month") — can be computed from `character_results` if data exists, otherwise hardcoded per mockup
- Practiced stat: "48 Characters", "8 lessons covered" — same as above
- Upcoming Ting Xie: weekly calendar strip (Mon–Sat), current/selected day highlighted
- Upcoming test card: "Week 4 (第十课) Spelling Test — Wednesday, 14 Oct at 3:00 PM · P2 MOE Syllabus"
- Primary CTA: **"Scan & Grade Worksheet"** button → navigates to Camera screen (Screen 3)
- Bottom navigation: Dashboard, Syllabus, History, Premium (only Dashboard and Syllabus need to be functional destinations; History can route to Results screen; Premium can be a stub)

**Acceptance criteria:**
- [ ] Page renders matching mockup layout/hierarchy
- [ ] "Scan & Grade Worksheet" navigates to camera capture flow
- [ ] Responsive on mobile viewport (this is a PWA, mobile-first)

---

### Screen 2 — Syllabus
**User story:** As a parent, I want to browse my child's Chinese syllabus by level and see which lessons are done, pending, or need revision.

- Header: same profile bar as Dashboard
- P1–P6 tab/pill selector (P2 active by default, matching student's grade)
- Header text: "MOE Primary 2 Syllabus · 24 Lessons Total"
- Expandable lesson cards, each showing:
  - Week number + lesson title (Chinese + pinyin/translation), e.g. "Week 4 《第十课 – 我的校园》"
  - Status badge: **Pending Practice** / **Completed (80%)** / **Needs Revision** (hardcoded per mockup data)
  - Vocabulary list on expand: character + pinyin pairs (e.g. 校园 xiào yuán, 礼堂 lǐ táng, 老师 lǎo shī)
  - "Print A4 Worksheet (PDF)" link (can be a stub link / placeholder — PDF generation is not in this assignment's technical requirements)

**Seed data required (hardcode or seed into `lessons` table):**
| Week | Title | Status | Vocabulary |
|---|---|---|---|
| 4 | 第十课 – 我的校园 | Pending Practice | 校园 (xiào yuán), 礼堂 (lǐ táng), 老师 (lǎo shī) |
| 3 | 第九课 – 我爱我的家 | Completed (80%) | 爸爸 (bà ba), 妈妈 (mā ma), 温暖 (wēn nuǎn) |
| 2 | 第八课 – 快乐的周末 | Needs Revision | 玩耍 (wán shuǎ), 公园 (gōng yuán) |

**Acceptance criteria:**
- [ ] Tab selector switches active level (P2 minimum functional; other tabs can show empty/placeholder state)
- [ ] Lesson cards expand/collapse to reveal vocabulary
- [ ] Status badges render correctly per lesson

---

### Screen 3 — Camera Capture & Live Alignment Viewfinder
**User story:** As a parent, I want to photograph my child's completed worksheet so it can be graded automatically.

- Full-screen camera view using rear camera (`getUserMedia`, `facingMode: environment`)
- Header: "Align Worksheet" title, close (X) button, flash toggle button
- Overlay: centered rectangular guide box with corner brackets, instruction text ("Keep page flat and inside the brackets"), QR target box (static visual element per Section 5 assumption)
- Bottom: circular shutter button — "Capture & Grade"
- On capture: freeze frame, convert to Blob/File, show uploading state, POST to backend upload endpoint
- On successful grading response: navigate to Results screen (Screen 4) with the new submission's ID

**Acceptance criteria:**
- [ ] Camera permission requested and stream displays live video
- [ ] Capture button produces an image blob from the live stream
- [ ] Uploading state is visually indicated (spinner/progress) while backend processes
- [ ] Error state handled gracefully if camera permission denied or upload fails

---

### Screen 4 — Results / Test Feedback
**User story:** As a parent, I want to see my child's graded results with clear indication of which characters were correct or incorrect, and track progress over time.

- Header: "Test Feedback — Week 4 Syllabus Test" with status badge ("Needs Revision" or similar, derived from score)
- Score display: large circular badge showing score (e.g. "8/10", "80%")
- Metadata: "Graded on [date], [time]", "[N] characters missed"
- **Correction overlay (KEY EVALUATION POINT):** For each character graded, show whether it was correct; for incorrect characters, show the correct character rendered in red next to/below the flagged item (per Section 5 assumption — annotation-list style, not pixel-overlay)
- Historical Matrix Table: rows = tested Chinese characters/words, columns = test dates; cells show green check (✓) or red cross (✗) per historical `character_results` records for that character
- Actions: "Share Report" (can be a stub — e.g. copy link or share sheet trigger), "Retest Missed" (can route back to camera flow, or be a stub if out of time)

**Acceptance criteria:**
- [ ] Score, date, and missed-character count pull from the actual `submissions` record (live data, not hardcoded)
- [ ] Correction overlay clearly shows correct vs. incorrect characters with the correct answer visible for mistakes
- [ ] Historical matrix reflects real historical `character_results` rows from Supabase, not mock data
- [ ] Page is reachable both immediately after a new scan and via a "History" entry point

---

## 7. Data Model (product-level description — see FSD for SQL DDL)

**`lessons`**
Represents a syllabus lesson: title, MOE grade level, and its vocabulary/word list.

**`submissions`**
Represents one graded worksheet scan: which student, when submitted, the uploaded image's storage URL, and the computed total score.

**`character_results`**
Represents the per-character grading outcome of a single submission: which character, correct or incorrect, linked back to its parent submission.

---

## 8. Non-Functional Requirements

- **Mobile-first / PWA:** Must be installable via manifest (icons + viewport meta), since the real use case is a parent scanning on their phone.
- **Security:** Gemini API key and Supabase service role key must live server-side only (Next.js API routes / server actions), never exposed to the client bundle.
- **NDA-safety:** Since this is a take-home for a company with IP-sensitive policies, avoid referencing this project publicly by client name after submission unless explicitly permitted.
- **Performance:** Not a primary evaluation criterion per the assignment, but image upload should show loading feedback so the flow doesn't feel broken during the Gemini round-trip (which can take a few seconds).

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
| Gemini 1.5 Flash deprecated/unavailable | Use `gemini-2.0-flash` or `2.5-flash` via `@google/genai` (see Section 5) |
| Camera permissions denied on some devices/browsers | Graceful fallback UI with retry instructions; test on both desktop Chrome and a real mobile browser before submission |
| Free-tier rate limits (Gemini / Supabase) hit during grading/demo | Keep grading prompt minimal (JD confirms accuracy isn't graded); avoid unnecessary repeated calls during testing |
| Time overrun across 5-day window | Follow phased build order in FSD; core flow (upload → grade → overlay) is completed before UI polish |
