# TingXie HERO — Technical Assignment

AI-powered Chinese handwriting grading PWA. Take-home technical assignment for the
Junior Back-End Developer role. Product requirements and implementation spec live in
`docs/planning/`:

- `docs/planning/PRD_TingXieHero.md` — product requirements, scope, assumptions
- `docs/planning/FSD_TingXieHero.md` — tech stack, FSD folder structure, DB schema,
  API contract, Gemini integration, build order. Hand this to Claude Code as the
  implementation spec.

`docs/reference/` (gitignored) holds the original JD and assignment PDFs — client-
sensitive source material, not part of the submission.

## Git workflow

This repo is reviewed by the client — commit history is part of what gets read.

- **One commit per logical concern, always.** Never bundle unrelated changes
  (e.g. two different screenshots plus a docs restructure) into a single
  commit just because they landed in the same turn. If a change touches N
  independent things, that's N commits, staged and committed one at a time
  (`git add <specific files>` per commit, not `git add -A`).
- Each commit message explains *why*, not just *what* — the same style as
  the existing history (`git log --oneline`).
- Verify (lint/typecheck/test, or the equivalent manual check for docs/asset
  changes) before each commit, not just once at the end for the whole batch.
- Never push without explicit confirmation for that specific push. Never
  deploy to Vercel under any circumstance unless explicitly told to in that
  turn — deploy is a separate, higher-stakes action from a git push.

@AGENTS.md

## Agent skills

### Issue tracker

Issues tracked as GitHub issues via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five canonical roles (`needs-triage`, `needs-info`, `ready-for-agent`,
`ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — `CONTEXT.md` + `docs/adr/` at the repo root. See
`docs/agents/domain.md`.

### Build skills

Which installed skills to invoke per FSD build phase, and in what order. Read
`docs/agents/build-skills.md` before starting each phase of FSD §6.
