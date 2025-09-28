-- Timezone column and task-related tables for Core MVP

-- Add timezone to users (IANA string)
alter table users add column if not exists timezone text not null default 'UTC';

-- Helper function used by triggers to maintain updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Entries: capture sources (voice/text)
create table if not exists entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  source text check (source in ('voice','text')) not null,
  transcript text,
  audio_url text,
  lang text check (lang in ('ja','en','auto')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table entries enable row level security;

create policy "Users can manage own entries" on entries
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Trigger to auto-update updated_at (depends on update_updated_at_column)
do $$ begin
  perform 1 from pg_trigger where tgname = 'entries_updated_at';
  if not found then
    create trigger entries_updated_at before update on entries
      for each row execute procedure update_updated_at_column();
  end if;
end $$;

-- Tasks: core task entity (UTC timestamps)
create table if not exists tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  entry_id uuid references entries(id),
  title text not null,
  note text,
  start_at timestamptz,
  end_at timestamptz,
  due_at timestamptz,
  kind text not null default 'task',
  estimate_min int,
  priority text check (priority in ('low','mid','high')),
  status text check (status in ('todo','pending','done','deleted')) not null default 'todo',
  source text check (source in ('voice','manual')) not null,
  confidence numeric,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  constraint tasks_kind_check check (kind in ('task','event')),
  constraint tasks_event_has_range check (
    kind <> 'event' or (start_at is not null and end_at is not null)
  ),
  constraint tasks_task_no_end_only check (
    kind <> 'task' or not (end_at is not null and start_at is null)
  )
);

alter table tasks enable row level security;

create policy "Users can manage own tasks" on tasks
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists tasks_start_idx on tasks (start_at);
create index if not exists tasks_due_idx on tasks (due_at);

do $$ begin
  perform 1 from pg_trigger where tgname = 'tasks_updated_at';
  if not found then
    create trigger tasks_updated_at before update on tasks
      for each row execute procedure update_updated_at_column();
  end if;
end $$;
