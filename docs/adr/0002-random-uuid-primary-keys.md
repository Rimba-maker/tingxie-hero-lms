# Keep random UUID primary keys despite the fragmentation trade-off

`lessons`, `submissions`, and `character_results` all use `uuid default gen_random_uuid()`
(random, UUIDv4-style) primary keys. A Postgres best-practices review of this schema (Phase 11,
`docs/planning/FSD_TingXieHero.md` §6) flagged this as normally "problematic" — random UUIDs
scatter inserts across a B-tree index, fragmenting it, where a sequential `bigint identity` or a
time-ordered UUIDv7 would insert append-only.

Kept anyway, for two reasons specific to this project:

1. **`submissions.id` is exposed directly in a public URL** (`/results/[submissionId]`). An
   unguessable ID is a deliberate security property here — a sequential `bigint` would leak
   enumerable row counts and let anyone walk `/results/1`, `/results/2`, ... to see other
   submissions. Nothing else in this app's threat model (no auth) protects against that walk if
   the ID itself were guessable.
2. **Fragmentation is a large-table, high-insert-throughput concern.** This project's entire
   dataset, across every table, stays in the dozens of rows — the failure mode the rule warns
   about will never materialize at this scale.

Revisit only if this becomes a real multi-user product at real scale, and even then, prefer
UUIDv7 over a sequential key for anything still exposed publicly — it keeps most of the
insert-locality benefit without going fully sequential.
