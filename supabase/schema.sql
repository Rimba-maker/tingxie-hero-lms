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

create table lessons (
  id uuid primary key default gen_random_uuid(),
  week_number int not null,
  title text not null,               -- e.g. "第十课 – 我的校园"
  moe_level text not null,           -- e.g. "P2"
  status text not null default 'pending'
    constraint lessons_status_check check (status in ('pending', 'completed', 'needs_revision')),
  vocabulary jsonb not null,         -- [{ "character": "校园", "pinyin": "xiào yuán" }, ...]
  created_at timestamptz not null default now()
);

create table submissions (
  id uuid primary key default gen_random_uuid(),
  student_id text not null default 'lucas-p2',  -- hardcoded per assignment scope
  lesson_id uuid references lessons(id),
  image_url text not null,           -- Supabase Storage public URL
  total_score numeric(4, 1),         -- e.g. 8.0 (out of 10) — one decimal place is enough
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
  created_at timestamptz not null default now()
);

-- Query indexes (from FSD §3 — power the historical matrix's character x date lookup)
create index idx_character_results_character on character_results(character);
create index idx_submissions_submitted_at on submissions(submitted_at);

-- Foreign key indexes — Postgres does not create these automatically, and without
-- them both JOINs (fetching a submission's results) and ON DELETE CASCADE (deleting
-- a submission's character_results) fall back to a full table scan.
create index idx_submissions_lesson_id on submissions(lesson_id);
create index idx_character_results_submission_id on character_results(submission_id);

-- Explicit grants
-- This project has "Automatically expose new tables" turned off at creation
-- time (least-privilege default), so anon/authenticated get no table access
-- until granted here. RLS policies below then restrict which *rows* those
-- roles can see — GRANT and RLS are two separate layers, both required.
grant usage on schema public to anon, authenticated;
grant select on public.lessons to anon, authenticated;
grant select on public.submissions to anon, authenticated;
grant select on public.character_results to anon, authenticated;

-- Row Level Security
-- No end-user auth in this assignment (PRD §2), so there's no auth.uid() to scope
-- policies by. All three tables are read by the client with the anon key (dashboard,
-- syllabus, results screens) and written only by the server with the service role
-- key (which bypasses RLS by default) — so each table just needs a public SELECT
-- policy, no INSERT/UPDATE/DELETE policy for anon/authenticated at all.
alter table lessons enable row level security;
alter table submissions enable row level security;
alter table character_results enable row level security;

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

-- Storage bucket for uploaded worksheet photos
-- Public bucket (matches FSD §3 "public (or signed-URL) bucket" note): the client
-- needs to render the photo directly on the Results screen without a signed-URL
-- round trip, and content is a child's worksheet scan, not sensitive PII — an
-- acceptable simplification for this assignment's scope.
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
