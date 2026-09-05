-- TingXie HERO — database schema
-- Run once in the Supabase SQL editor (or `supabase db push` if you adopt the CLI later).
-- See docs/planning/FSD_TingXieHero.md §3 for the original spec; this file is the
-- reviewed-and-applied version — see inline notes for what changed and why.
--
-- Reviewed against the `supabase-postgres-best-practices` skill before applying:
-- RLS enabled + explicit policies, FK columns indexed, status columns constrained,
-- total_score given real precision. No auth/multi-tenant in scope (PRD §2 out-of-scope),
-- so RLS policies are public-read rather than per-user — writes only ever happen
-- server-side via the service role key, which bypasses RLS entirely.
--
-- Re-reviewed against the same skill once `students` existed and real query shapes were
-- known (not just the original spec) — see inline notes below for what changed, and for
-- three rules deliberately NOT applied, with the reasoning kept next to the decision:
-- random-UUID primary keys, indexing submissions.student_id, and wrapping saveGradingResult's
-- two writes in a single transaction.
--
-- Deliberately NOT switched to bigint identity / UUIDv7 primary keys, despite the skill's
-- own primary-key guidance calling random UUIDv4 "problematic" (index fragmentation on
-- large tables). Two reasons: (1) submissions.id is exposed directly in a public URL
-- (/results/[submissionId]) — a random, unguessable ID is a deliberate security property
-- here, not an oversight, and a sequential bigint would leak enumerable row counts/IDs
-- instead; (2) fragmentation is a large-table, high-insert-throughput concern — this
-- assignment's entire dataset across every table stays in the dozens of rows. Revisit only
-- if this ever becomes a real multi-user product at real scale.
--
-- Also deliberately NOT wrapped saveGradingResult's two writes (insert character_results,
-- then update submissions.status) in a single Postgres-side transaction (would need an RPC
-- function — PostgREST calls from supabase-js don't span a transaction across two separate
-- .from() calls). A failure between the two leaves a submission stuck 'pending' with
-- orphaned character_results rows — real, but low-probability and recoverable (re-run
-- grading), not data corruption or a security issue. Not worth an RPC function's added
-- surface for this assignment's scope; worth it if this pipeline ever needs to be reliable
-- under real concurrent load.

create table lessons (
  id uuid primary key default gen_random_uuid(),
  week_number int not null,
  title text not null,               -- e.g. "第十课 – 我们的校园"
  moe_level text not null,           -- e.g. "P2"
  status text not null default 'pending'
    constraint lessons_status_check check (status in ('pending', 'completed', 'needs_revision')),
  vocabulary jsonb not null,         -- [{ "character": "校园", "pinyin": "xiào yuán" }, ...]
  -- When this lesson's spelling test is scheduled — drives the Dashboard's
  -- "Upcoming Ting Xie" banner and the weekly calendar strip's event dot.
  -- Nullable: not every lesson has a scheduled test yet.
  test_scheduled_at timestamptz,
  created_at timestamptz not null default now()
);

-- Single hardcoded student (no auth in scope — matches submissions.student_id's
-- default below). Owns the prepaid lesson credits shown on the Dashboard;
-- "used" is derived from the student's actual submissions count rather than
-- a separately-maintained counter (nothing to keep in sync).
create table students (
  id text primary key,               -- e.g. "lucas-p2"
  name text not null,
  moe_level text not null,
  -- >= 0: topUpCredits only ever increments, and nothing currently decrements
  -- this below zero — but a domain invariant this cheap is worth enforcing at
  -- the database, not just trusting application code to never introduce a bug.
  credits_total int not null default 20 check (credits_total >= 0),
  credits_expire_at timestamptz not null
);

create table submissions (
  id uuid primary key default gen_random_uuid(),
  -- References students(id): this was a bare default-valued text column with
  -- no FK for most of the build — nothing stopped an invalid student_id from
  -- ever being inserted. Added once `students` existed to enforce it for real.
  student_id text not null default 'lucas-p2' references students(id),
  lesson_id uuid references lessons(id),
  image_url text not null,           -- Supabase Storage public URL
  -- numeric(4,1), not null on its own — total_score is nullable (no grade
  -- yet), but once graded it must be a real score within [0, total_possible].
  -- Cheap to enforce at the database rather than trust every write path.
  total_score numeric(4, 1) check (total_score is null or (total_score >= 0 and total_score <= total_possible)),
  total_possible int not null default 10,
  status text not null default 'pending'
    constraint submissions_status_check check (status in ('pending', 'graded', 'failed')),
  submitted_at timestamptz not null default now(),
  graded_at timestamptz
);

create table character_results (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references submissions(id) on delete cascade,
  character text not null,           -- e.g. "礼堂"
  is_correct boolean not null,
  -- { ymin, xmin, ymax, xmax } normalized 0-1000, from Gemini's box_2d —
  -- drives the Results screen's photo overlay (the assignment's own "key
  -- evaluation point": correction sent back to the frontend as a red-pen
  -- overlay on the worksheet photo, not just a table of ticks/crosses).
  -- Nullable: absent on rows graded before this column existed, or when
  -- Gemini omits a box for a given character.
  bounding_box jsonb,
  created_at timestamptz not null default now()
);

-- Query indexes (from FSD §3 — power the historical matrix's character x date lookup)
create index idx_character_results_character on character_results(character);

-- Composite, not a bare lesson_id index: this serves the FK/cascade-delete
-- lookup (leftmost-prefix rule — WHERE lesson_id = X uses this exactly as
-- well as a single-column index would) *and* getLessons' real query shape,
-- which fetches each lesson's single most recent submission via
-- `.order("submitted_at", { foreignTable: "submissions" }).limit(1, ...)`.
-- One index instead of two, better-shaped for the query that actually runs.
create index idx_submissions_lesson_submitted on submissions(lesson_id, submitted_at desc);

-- Partial, not a bare submitted_at index: the only place this app queries
-- submissions ordered by submitted_at without a lesson_id filter is
-- listSubmissionHistory, which always filters status = 'graded' first
-- (`.eq("status", "graded").order("submitted_at", ...)`). A partial index
-- matching that exact filter is smaller and faster than indexing every row
-- regardless of status.
create index idx_submissions_graded_history on submissions(submitted_at desc) where status = 'graded';

-- Foreign key index — Postgres does not create these automatically, and without
-- it both JOINs (fetching a submission's results) and ON DELETE CASCADE (deleting
-- a submission's character_results) fall back to a full table scan.
create index idx_character_results_submission_id on character_results(submission_id);

-- submissions.student_id is a real FK (see above) but deliberately NOT indexed:
-- every row in this single-hardcoded-student, no-auth assignment has the exact
-- same value ('lucas-p2'). An index on a column with one distinct value across
-- the whole table can't narrow down any query — the planner would ignore it and
-- scan anyway. Revisit only if real multi-student auth is ever added.

-- Explicit grants
-- This project has "Automatically expose new tables" turned off at creation
-- time (least-privilege default), so anon/authenticated get no table access
-- until granted here. RLS policies below then restrict which *rows* those
-- roles can see — GRANT and RLS are two separate layers, both required.
grant usage on schema public to anon, authenticated;
grant select on public.lessons to anon, authenticated;
grant select on public.submissions to anon, authenticated;
grant select on public.character_results to anon, authenticated;
grant select on public.students to anon, authenticated;

-- Row Level Security
-- No end-user auth in this assignment (PRD §2), so there's no auth.uid() to scope
-- policies by. All three tables are read by the client with the anon key (dashboard,
-- syllabus, results screens) and written only by the server with the service role
-- key (which bypasses RLS by default) — so each table just needs a public SELECT
-- policy, no INSERT/UPDATE/DELETE policy for anon/authenticated at all.
alter table lessons enable row level security;
alter table submissions enable row level security;
alter table character_results enable row level security;
alter table students enable row level security;

create policy lessons_public_read on lessons
  for select
  to anon, authenticated
  using (true);

create policy submissions_public_read on submissions
  for select
  to anon, authenticated
  using (true);

create policy character_results_public_read on character_results
  for select
  to anon, authenticated
  using (true);

-- No insert/update/delete policy for anon/authenticated: credits_total is
-- only ever written server-side (POST /api/credits/topup) via the service
-- role key, same pattern as every other write in this schema.
create policy students_public_read on students
  for select
  to anon, authenticated
  using (true);

-- Storage bucket for uploaded worksheet photos
-- Public bucket (matches FSD §3 "public (or signed-URL) bucket" note), so the
-- client can render the photo directly without a signed-URL round trip.
-- `WorksheetOverlay` on the Results screen does exactly this (an <img> at this
-- public URL, with the red/green correction marks drawn on top) — this is also
-- read server-side (POST /api/grade fetches the same image to send to Gemini).
-- Left public rather than tightened: content is a child's worksheet scan, not
-- sensitive PII, so there's no real security reason to revisit this now.
insert into storage.buckets (id, name, public)
values ('worksheet-photos', 'worksheet-photos', true)
on conflict (id) do nothing;

create policy worksheet_photos_public_read on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'worksheet-photos');

-- No insert/update/delete policy for anon/authenticated: uploads only happen
-- server-side via POST /api/upload using the service role key, which bypasses
-- storage RLS the same way it bypasses table RLS.
