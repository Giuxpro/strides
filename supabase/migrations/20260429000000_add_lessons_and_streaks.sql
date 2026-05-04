-- ============================================================
-- STRIDE — Add lessons, streaks, progress tracking
-- ============================================================

-- ----------------------------------------------------------------
-- 1. lessons: agrupación temática dentro de un módulo
--    Cada lección es un checkpoint de logro independiente.
--    El niño completa lección por lección — no necesita terminar
--    el módulo entero en una sola sesión.
-- ----------------------------------------------------------------

create table lessons (
  id           uuid primary key default uuid_generate_v4(),
  module_id    uuid not null references modules(id) on delete cascade,
  slug         text not null,
  title_es     text not null,
  title_en     text not null,
  "order"      smallint not null default 0,
  min_age      smallint not null default 4 check (min_age in (4, 6)),
  is_published boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (module_id, slug)
);

create trigger lessons_updated_at
  before update on lessons
  for each row execute procedure set_updated_at();

create index on lessons (module_id);

alter table lessons enable row level security;

create policy "anyone reads lessons of published modules" on lessons
  for select using (
    exists (select 1 from modules m where m.id = module_id and m.is_published = true)
  );

create policy "admins manage lessons" on lessons
  for all using (is_admin());

-- ----------------------------------------------------------------
-- 2. exercises: agregar FK a lessons
--    Nullable para no romper datos existentes. En producción
--    todos los ejercicios deberán tener lesson_id asignado.
-- ----------------------------------------------------------------

alter table exercises
  add column lesson_id uuid references lessons(id) on delete cascade;

create index on exercises (lesson_id);

-- ----------------------------------------------------------------
-- 3. child_lesson_completions: progreso por lección (checkpoint principal)
--    unique (child_id, lesson_id): solo guarda el último resultado
-- ----------------------------------------------------------------

create table child_lesson_completions (
  id           uuid primary key default uuid_generate_v4(),
  child_id     uuid not null references children(id) on delete cascade,
  lesson_id    uuid not null references lessons(id) on delete cascade,
  score        smallint check (score >= 0 and score <= 100),
  passed       boolean not null generated always as (score >= 70) stored,
  completed_at timestamptz not null default now(),
  unique (child_id, lesson_id)
);

create index on child_lesson_completions (child_id, lesson_id);

alter table child_lesson_completions enable row level security;

create policy "parents manage own children lesson completions" on child_lesson_completions
  for all using (
    exists (select 1 from children c where c.id = child_id and c.parent_id = auth.uid())
  );

create policy "admins read all lesson completions" on child_lesson_completions
  for select using (is_admin());

-- ----------------------------------------------------------------
-- 4. child_streaks: racha de actividad diaria por niño
-- ----------------------------------------------------------------

create table child_streaks (
  child_id           uuid primary key references children(id) on delete cascade,
  current_streak     smallint not null default 0,
  longest_streak     smallint not null default 0,
  last_activity_date date,
  updated_at         timestamptz not null default now()
);

alter table child_streaks enable row level security;

create policy "parents manage own children streaks" on child_streaks
  for all using (
    exists (select 1 from children c where c.id = child_id and c.parent_id = auth.uid())
  );

create policy "admins read all streaks" on child_streaks
  for select using (is_admin());

-- ----------------------------------------------------------------
-- 5. Fix: trigger updated_at en child_word_status
--    La columna existe pero no se actualizaba al hacer UPDATE.
-- ----------------------------------------------------------------

create trigger child_word_status_updated_at
  before update on child_word_status
  for each row execute procedure set_updated_at();

-- ----------------------------------------------------------------
-- 6. RPC: grant_free_module_access
--    Llamar desde el server action de onboarding cuando
--    first_module_free = true en settings.
-- ----------------------------------------------------------------

create or replace function grant_free_module_access(p_user_id uuid)
returns void language plpgsql security definer as $$
declare
  v_first_free      boolean;
  v_first_module_id uuid;
begin
  select (value)::boolean into v_first_free
  from settings where key = 'first_module_free';

  if not v_first_free then return; end if;

  select id into v_first_module_id
  from modules
  where is_published = true
  order by "order" asc
  limit 1;

  if v_first_module_id is null then return; end if;

  insert into user_module_access (user_id, module_id, access_type)
  values (p_user_id, v_first_module_id, 'free')
  on conflict (user_id, module_id) do nothing;
end;
$$;
