# Keep the DI-adapter pattern uniform, even for trivial pass-throughs

Every `entities/*/api/*.ts` file exports a pure orchestrator function taking a narrow `XDb`
interface, plus a `supabaseXDb(supabase)` factory providing the real Supabase-backed
implementation — even where the orchestrator's body is a one-line pass-through
(`createSubmission.ts`, `topUpCredits.ts`) with no real mapping logic to justify a seam on its
own merits.

Two separate architecture audits this project (Phase 6 and Phase 10 in
`docs/planning/FSD_TingXieHero.md` §6) independently flagged these specific files as candidates
for collapsing — correctly, by the deletion test, they're shallow. Both times the decision was to
keep them as-is: consistency across all ~10 entity API files (one predictable shape to scan) was
judged more valuable than locality on the 3-4 files that happen to be trivial today. There's only
one real adapter (Supabase) and no second one planned, so the seam is currently hypothetical for
those specific files — but splitting the pattern (deep files get the split, shallow files don't)
would cost more in "which shape is this file?" than it saves.

Record this so a third audit doesn't re-litigate the same finding a third time.
