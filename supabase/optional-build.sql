-- The build becomes optional: a team may submit the cover, the report and the
-- presentation and leave the executable out.
-- Run once in the Supabase SQL editor (Database → SQL editor → paste → run).
-- Safe to re-run: dropping a not-null that is already gone is a no-op.
--
-- The three build_* columns move together — a row either carries a build or
-- carries none of it. Nothing here touches cover_path/cover_name/cover_size,
-- which stay required: a game with no cover has no card in the arcade.

alter table public.game_submissions
  alter column build_path drop not null,
  alter column build_name drop not null,
  alter column build_size drop not null;
