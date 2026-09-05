# TingXie HERO

An AI-powered Chinese handwriting grading PWA for Singapore primary school students practicing
Ting Xie (听写 — spelling-by-dictation). A parent photographs a completed practice worksheet; the
app grades it and shows which characters need more practice.

## Content

**Lesson**:
One week's Ting Xie syllabus unit — a title, an MOE level, and a vocabulary list.
_Avoid_: unit, module (module is an architecture term, not a domain one).

**Vocabulary entry**:
One character-or-word-plus-pinyin pair within a lesson's vocabulary list. May be a single
character or a multi-character word (e.g. 校园).
_Avoid_: word (ambiguous about character count), term.

**MOE level**:
The Singapore Ministry of Education primary grade a lesson or student belongs to (P1–P6).
_Avoid_: grade, class, year.

**Lesson status**:
Where a lesson sits in the practice cycle: `pending` (not yet practiced), `completed`, or
`needs_revision`. Distinct from **submission status** below — a lesson's status describes the
syllabus item itself, not any one attempt at it.
_Avoid_: state (use consistently as "status" project-wide).

## Grading flow

**Worksheet**:
The physical Tian Zige practice page a student writes on, printed or scanned.
_Avoid_: sheet, test, paper.

**Tian Zige (田字格)**:
The "field-character grid" — four quadrants per cell — that Chinese handwriting is traditionally
practiced in. Appears both on the physical worksheet and in the generated practice PDF.
_Avoid_: grid (too generic on its own — qualify as "Tian Zige grid" when precision matters).

**Submission**:
One graded attempt at a lesson: a photographed worksheet plus its resulting score. The unit the
rest of the grading flow revolves around.
_Avoid_: attempt, test, scan (a scan is the action that produces a submission, not the submission
itself).

**Submission status**:
Where a submission sits in the grading pipeline: `pending` (uploaded, not yet graded), `graded`,
or `failed`. Distinct from **lesson status** above.
_Avoid_: state.

**Grading**:
Sending a submission's worksheet photo and its lesson's vocabulary to Gemini, and turning the
response into character results.
_Avoid_: scoring, marking.

**Character result**:
One character's correctness outcome within a submission, plus where it was found on the
worksheet (its bounding box), when known.
_Avoid_: grade (a character result isn't a grade on its own; the submission's score is the
aggregate).

**Worksheet overlay**:
The red/green marks drawn over a submission's worksheet photo — a red box and the correct
character for each miss, a green check for each hit. The literal "correction sent back to the
frontend" the assignment names as its key evaluation point.
_Avoid_: correction overlay, annotation (an earlier, different design used "correction overlay"
for a since-removed chip-list component — reserve that name for history, not this).

**Historical matrix**:
The character-by-test-date grid on the Results screen, showing a check or cross per character per
date across a student's submission history.
_Avoid_: history table, results grid.

**Retest**:
Re-attempting a lesson by scanning a fresh copy of the same worksheet, after a submission comes
back `needs_revision` or with missed characters. Not a re-grade of the existing submission — a new
one.
_Avoid_: retry.

**Practice writing**:
The view-only stroke-order animation shown per missed character on the Results screen. Distinct
from **Stroke Practice** below — a much smaller, non-interactive thing scoped in deliberately, not
inferred from the assignment PDF.
_Avoid_: stroke practice (reserve that term for the excluded phase, to keep the two unambiguous).

**Stroke Practice**:
A phase of the product's broader learning loop (Story Video → Stroke Practice → Paper Test Scan →
Game Reward) that this assignment does not build — an interactive tracing/quiz screen, not the
Results screen's small "Practice writing" animation above.
_Avoid_: conflating with "Practice writing" — one is out of scope, the other was built.

## Student & credits

**Student**:
The learner profile that owns credits, submissions, and syllabus progress.
_Avoid_: user, account (no multi-user auth is in scope for this app).

**Parent**:
The person actually operating the app on the student's behalf — the one who scans worksheets and
reads results.
_Avoid_: guardian, user.

**Credits**:
A student's prepaid allowance of worksheet scans. Remaining credits are the total minus how many
submissions the student has actually made — not a separately tracked counter.
_Avoid_: balance, tokens, quota.

**Mastery rate**:
The percentage of practiced characters a student has durably learned, shown on the Dashboard.
_Avoid_: progress, score (score belongs to a single submission).
