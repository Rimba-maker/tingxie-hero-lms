# Research note: creative codebase audit → GitHub/npm feature ideas

**Date:** 2026-09-05
**Prompted by:** user asking for a creative, whole-codebase audit — every function/feature,
cross-referenced against real GitHub/npm packages, looking for genuine "new feature or
improvement" ideas, presented side-by-side for comparison.
**Status:** research only, nothing implemented yet — waiting on which (if any) to build.

---

## Method

Walked every slice in `src/` (`entities`, `features`, `widgets`, `screens`) and matched each
against the assignment's own scope (PRD/FSD) to find where a real package could turn something
hardcoded, decorative, or manually-authored into something genuinely better — without dragging in
infrastructure the OCR-alternatives note (`docs/research/ocr-alternatives.md`) already ruled out.

Five candidates surfaced. Ranked by value-for-effort, most promising first.

---

## 1. Document-scanner-quality camera capture — `jscanify`

**Current:** `src/features/capture-worksheet/model/useCameraCapture.ts` — a raw `canvas.drawImage()`
(or `ImageCapture.takePhoto()`) snapshot of whatever's in frame. No perspective correction, no
edge/skew detection. A worksheet photographed at an angle stays at that angle all the way to
Gemini.

**Found:** [puffinsoft/jscanify](https://github.com/puffinsoft/jscanify) — pure client-side JS
(built on OpenCV.js), detects a document's four corners in a video frame and warps it to a
flat, rectangular top-down view. Runs entirely in the browser, no backend. Actively maintained,
purpose-built for exactly this ("mobile document scanner").

**Why this is the most interesting one:** it directly improves the actual evaluated flow (photo →
backend → grading), not a side feature. A perspective-corrected, cropped worksheet image is a
better input to Gemini's vision call than a raw phone photo at an angle — and it's a visible,
demoable improvement (the live preview could show the detected-document outline in real time,
which also looks impressive next to the existing corner-bracket alignment guide).

**Side-by-side:**
| | Now | With jscanify |
|---|---|---|
| Capture | Raw frame, whatever angle the phone was at | Auto-detected, perspective-corrected, cropped to just the worksheet |
| Dependency | None | +1 (OpenCV.js WASM — jscanify bundles/loads it; adds real bundle weight, worth checking actual KB cost before committing) |
| Risk | None | OpenCV.js load time on first camera open; needs testing on a real low-end Android phone, not just desktop Chrome |

**Recommendation:** worth prototyping if there's appetite for it — but check jscanify's actual
bundle size and cold-load latency on a real phone before committing, since this is a mobile PWA and
a slow-loading OpenCV.js WASM blob on first camera open could hurt the exact "flow" that's being
evaluated. Not free — this is the one candidate here that's a genuine feature build, not a small
wiring job.

---

## 2. Real "Print A4 Worksheet (PDF)" — `pdf-lib`

**Current:** `src/widgets/lesson-card/ui/LessonCard.tsx` — the "Print A4 Worksheet (PDF)" link has
no `onClick` at all (documented in README's Known Limitations as decorative, mockup-only, not named
in the assignment's Technical Requirements text).

**Found:** [pdf-lib](https://pdf-lib.js.org/) ([npm](https://www.npmjs.com/package/pdf-lib)) —
create PDFs from scratch in any JS runtime, including the browser (no server round-trip needed).
No ready-made "Tian Zige grid" template package exists (checked
[hanskohls/tianzige](https://github.com/hanskohls/tianzige), Python-only, wrong runtime for us) —
but a Tian Zige grid is just a rectangle grid with a horizontal/vertical center guide line per
cell, trivial to draw directly with `pdf-lib`'s primitives once the vocab list is in hand.

**Side-by-side:**
| | Now | With pdf-lib |
|---|---|---|
| Click "Print A4 Worksheet" | Nothing happens | Downloads a real A4 PDF: the lesson's vocabulary laid out in Tian Zige grid cells, ready to print and practice on paper |
| Dependency | None | +1 (`pdf-lib` — actively used industry-wide despite its last release being Nov 2021; stable, feature-complete for this use case) |
| Effort | — | Small-to-medium: one pure function (`vocabulary → PDF bytes`), testable without a browser |

**Recommendation:** good value for the effort — turns a named-but-decorative mockup element into
something a parent would actually use, and it's genuinely low-risk (client-side PDF generation,
no new backend surface, no infra).

---

## 3. Real "Mastery Rate" — `ts-fsrs`

**Current:** `src/screens/dashboard/ui/DashboardScreen.tsx` — `masteryRatePercent={82.4}`,
`charactersPracticed={48}`, hardcoded. Documented (correctly) as out of scope: the assignment's
Technical Requirements never mention this stat at all, it's mockup-only, same basis as leaving it
alone during the Dashboard credits/calendar pass.

**Found:** [open-spaced-repetition/ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) —
TypeScript implementation of FSRS (Free Spaced Repetition Scheduler), the algorithm behind modern
Anki. Given a character's review history (correct/incorrect, with dates — which is exactly what
`character_results` + `submitted_at` already store), it computes difficulty/stability/
retrievability per item, i.e. a real, evidence-based "how well does this student actually know 校园
right now" score — not just a raw percent-correct.

**Side-by-side:**
| | Now | With ts-fsrs |
|---|---|---|
| "Mastery Rate 82.4%" | Fixed number, never changes | Real aggregate retrievability across all practiced characters, computed from actual `character_results` history |
| Dependency | None | +1 (`ts-fsrs`, actively maintained) |
| Schema | — | Needs a place to persist each character's FSRS state (difficulty/stability/last-reviewed) — a new table or columns, similar scope to the `students`/`bounding_box` migrations already done this session |

**Recommendation:** technically the most *interesting* idea in this list, but it's scope creep
relative to what's asked — this stat isn't in the Technical Requirements at all, so building a full
spaced-repetition engine to power a mockup-only vanity number isn't proportionate. Flagged here
because it's a genuinely good idea for this product's *next* phase (the PRD's own context describes
a "daily learning loop" this assignment only slices one part of) — not for this assignment.

---

## 4. Auto-pinyin for new vocabulary — `pinyin-pro`

**Current:** `supabase/seed.sql` — every vocabulary entry's pinyin is hand-typed:
`{"character":"校园","pinyin":"xiào yuán"}`. Fine for 8 seeded words; doesn't scale, and typos are
silent (nothing checks a hand-typed pinyin string against the actual character).

**Found:** [pinyin-pro](https://www.npmjs.com/package/pinyin-pro) — actively maintained TypeScript
library, converts Chinese characters to pinyin with tone marks, handles polyphones (characters with
multiple valid readings depending on context) better than the older `pinyin` package.

**Side-by-side:**
| | Now | With pinyin-pro |
|---|---|---|
| Adding a new lesson's vocabulary | Type both character and pinyin by hand, hope it's right | Type only the character; pinyin is derived and always consistent with it |
| Dependency | None | +1 (`pinyin-pro`) |
| Risk | Silent typos possible today | Polyphone edge cases (rare) would need a manual override path |

**Recommendation:** small, low-risk, genuinely useful quality-of-life improvement for whoever
maintains lesson content — but there's no user-facing bug today (the 8 seeded pinyin strings are
already correct), so this is a "nice for scaling past the assignment" item, not an urgent fix.

---

## 5. "Retest Missed" — no new dependency, just wiring

**Current:** decorative button, no handler (`src/screens/results/ui/ResultsScreen.tsx`).

**Not a library gap** — we already have everything needed: `submission.characterResults.filter(r
=> !r.isCorrect)` is sitting right there. The button could route to `/scan?lessonId=X&retestOnly=...`
and the grading prompt could narrow to just the missed characters. No GitHub search needed; this is
a same-session wiring job like `TopUpButton`, not a research finding.

**Recommendation:** genuinely worth doing if the user wants another decorative button turned real
(same category of fix as "Top Up" and the Syllabus percentage this session) — flagged here for
completeness since it came up during the audit, not because it needed research.

---

## Overall recommendation

Ranked by "worth doing for this assignment": **#5 (Retest Missed) > #2 (Print PDF) > #4 (pinyin-pro)
> #1 (jscanify) > #3 (ts-fsrs)**. The first three are small, low-risk, and turn something
already-named-in-the-brief from fake/decorative into real. #1 is the most exciting technically but
carries real mobile-performance risk that needs checking before committing. #3 is a good idea for
a real product roadmap, not for this 5-day assignment's actual grading criteria.

Waiting on the user to say which (if any) to build.
