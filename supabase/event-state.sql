-- The arcade switch: submissions open or closed, decided by a human or by a
-- clock the humans set.
-- Run once in the Supabase SQL editor (Database → SQL editor → paste → run).
-- Safe to re-run: everything below is if-not-exists.
--
-- One row, forever. `schedule_enabled` picks who is driving:
--
--   false → `submissions_closed`, flipped by the dashboard's big button. The
--           moment it is true the submit endpoints refuse new builds and the
--           public shelf unlocks. Flipping it back reverses both — a misclick
--           is not fatal.
--   true  → `submissions_open_at` / `submissions_close_at`. The doors move on
--           their own at those instants, with no one at a laptop.

create table if not exists public.event_state (
  -- `id` is pinned to true so the table can only ever hold this one row
  id boolean primary key default true check (id),
  submissions_closed boolean not null default false,
  -- The final grade's scale, e.g. 20 for "marked out of 20". Null means "use
  -- the sum of the criteria maxima". Set from the criteria editor; raw totals
  -- are rescaled to it everywhere a total is shown.
  grade_out_of int check (grade_out_of between 1 and 1000),
  -- The scheduled window. Null on either side means "no bound that way":
  -- no open time = the desk was always open, no close time = it never shuts
  -- by itself. Stored as timestamptz, so the offset the admin typed in is
  -- preserved as an instant rather than a wall-clock guess.
  schedule_enabled boolean not null default false,
  submissions_open_at timestamptz,
  submissions_close_at timestamptz,
  updated_at timestamptz not null default now()
);

-- safe re-run: adds each column if the table predates it
alter table public.event_state
  add column if not exists grade_out_of int check (grade_out_of between 1 and 1000);

alter table public.event_state
  add column if not exists schedule_enabled boolean not null default false;

alter table public.event_state
  add column if not exists submissions_open_at timestamptz;

alter table public.event_state
  add column if not exists submissions_close_at timestamptz;

insert into public.event_state (id) values (true)
on conflict (id) do nothing;

-- RLS on with no policies: only the service-role key (the server) can touch
-- it. Same posture as every other table in the project.
alter table public.event_state enable row level security;
