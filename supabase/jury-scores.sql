-- Jury scoring: the marking scheme itself plus one row per judge per game.
-- Run this once in the Supabase SQL editor (Database → SQL editor → paste → run).

-- ---------------------------------------------------------------------------
-- The criteria are data, not code: the head judge edits them at /jury/criteria
-- (admin password) before judging starts — label, description and each
-- criterion's own ceiling ("Presentation" out of 20, "Gameplay" out of 10...).
-- ---------------------------------------------------------------------------
create table if not exists public.jury_criteria (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  hint text,
  max_score int not null check (max_score between 1 and 100),
  position int not null,
  created_at timestamptz not null default now()
);

-- A starting scheme so the jury room works out of the box — every part of it
-- can be renamed, rescaled, removed or added to from the editor page.
insert into public.jury_criteria (label, hint, max_score, position)
select * from (values
  ('Gameplay & fun', 'Is it good to play? Would you keep playing?', 10, 0),
  ('Creativity', 'An idea of their own, not a template with new art.', 10, 1),
  ('Theme fit', 'How much of the jam theme is really in there?', 10, 2),
  ('Art & audio', 'Look and sound, judged for coherence over polish.', 10, 3),
  ('Presentation', 'The pitch: report, deck and how it was shown.', 20, 4)
) as seed(label, hint, max_score, position)
where not exists (select 1 from public.jury_criteria);

-- ---------------------------------------------------------------------------
-- One sheet per judge per game.
-- ---------------------------------------------------------------------------
create table if not exists public.jury_scores (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.game_submissions (id) on delete cascade,

  -- judge_key is the normalized name ("Sara " == "sara"); judge_name keeps the
  -- casing they typed for display. The unique pair is what turns a second save
  -- by the same judge into an update instead of a duplicate ballot.
  judge_key text not null,
  judge_name text not null,

  -- marks keyed by jury_criteria.id: { "<criterion-uuid>": 7, ... }
  -- validated by the API route against the live criteria before it gets here
  scores jsonb not null,
  comment text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (submission_id, judge_key)
);

-- RLS on with no policies: only the service-role key (the server) can read or
-- write. Same posture as the rest of the project — the anon key sees nothing.
alter table public.jury_criteria enable row level security;
alter table public.jury_scores enable row level security;
