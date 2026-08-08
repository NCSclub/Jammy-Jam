-- Run once in the Supabase SQL editor for the Jammy Jam project.
create table if not exists public.game_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  team_name text not null check (char_length(team_name) between 1 and 80),
  game_title text not null check (char_length(game_title) between 1 and 100),
  contact_email text not null check (char_length(contact_email) between 3 and 254),
  description text not null check (char_length(description) between 1 and 800),
  controls text not null check (char_length(controls) between 1 and 800),
  build_path text not null unique,
  build_name text not null,
  build_size bigint not null check (build_size > 0 and build_size <= 524288000),
  status text not null default 'submitted' check (status in ('submitted','reviewing','reviewed'))
);

alter table public.game_submissions enable row level security;
revoke all on table public.game_submissions from anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'game-submissions',
  'game-submissions',
  false,
  524288000,
  array[
    'application/zip', 'application/x-zip-compressed',
    'application/x-rar-compressed', 'application/vnd.rar',
    'application/x-7z-compressed', 'application/octet-stream',
    'application/vnd.microsoft.portable-executable', 'application/x-msdownload'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
