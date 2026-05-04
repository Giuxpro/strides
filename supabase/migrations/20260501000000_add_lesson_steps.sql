-- ============================================================
-- Add lesson_steps — ordered, typed blocks within a lesson
-- ============================================================

create type step_type as enum ('video', 'slide', 'exercise');

create table lesson_steps (
  id          uuid primary key default gen_random_uuid(),
  lesson_id   uuid not null references lessons(id) on delete cascade,
  position    smallint not null default 0,
  step_type   step_type not null,
  title       text,
  config      jsonb not null default '{}',
  exercise_id uuid references exercises(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table lesson_steps enable row level security;

create policy "lesson_steps_select" on lesson_steps
  for select using (true);

create policy "lesson_steps_admin_insert" on lesson_steps
  for insert with check (is_admin());

create policy "lesson_steps_admin_update" on lesson_steps
  for update using (is_admin());

create policy "lesson_steps_admin_delete" on lesson_steps
  for delete using (is_admin());

create trigger set_lesson_steps_updated_at
  before update on lesson_steps
  for each row execute function set_updated_at();

-- Migrate existing exercises → lesson_steps preserving order
insert into lesson_steps (lesson_id, position, step_type, exercise_id, config)
select lesson_id, "order", 'exercise', id, '{}'::jsonb
from exercises
where lesson_id is not null;
