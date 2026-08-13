-- The arcade switch: submissions open or closed, decided by a human.
-- Run once in the Supabase SQL editor (Database → SQL editor → paste → run).
--
-- One row, forever. The admin dashboard's "Close submissions" button flips
-- `submissions_closed`; the moment it is true, the submit endpoints refuse new
-- builds and the public shelf unlocks everyone's games. Flipping it back
-- reopens submissions and locks the shelf again — a misclick is not fatal.

create table if not exists public.event_state (
  -- `id` is pinned to true so the table can only ever hold this one row
  id boolean primary key default true check (id),
  submissions_closed boolean not null default false,
  -- The final grade's scale, e.g. 20 for "marked out of 20". Null means "use
  -- the sum of the criteria maxima". Set from the criteria editor; raw totals
  -- are rescaled to it everywhere a total is shown.
  grade_out_of int check (grade_out_of between 1 and 1000),
  updated_at timestamptz not null default now()
);

-- safe re-run: adds the column if the table predates it
alter table public.event_state
  add column if not exists grade_out_of int check (grade_out_of between 1 and 1000);

insert into public.event_state (id) values (true)
on conflict (id) do nothing;

-- RLS on with no policies: only the service-role key (the server) can touch
-- it. Same posture as every other table in the project.
alter table public.event_state enable row level security;
