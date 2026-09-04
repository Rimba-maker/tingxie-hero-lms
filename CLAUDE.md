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
