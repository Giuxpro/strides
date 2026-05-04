-- ============================================================
-- STRIDE — Initial Schema
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

create type user_role        as enum ('parent', 'admin');
create type access_type      as enum ('free', 'purchased', 'subscription');
create type word_status      as enum ('unseen', 'learning', 'mastered');
create type exercise_type    as enum ('memory', 'recognition', 'speaking');
create type exercise_phase   as enum ('practice', 'evaluation');
create type vocabulary_type  as enum ('word', 'phrase');
create type job_status       as enum ('pending', 'completed', 'failed');

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Reusable trigger function for updated_at
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- TABLES
-- ============================================================

-- profiles: extends Supabase auth.users
create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  role       user_role not null default 'parent',
  created_at timestamptz not null default now()
);

-- Check if current user is admin (used in RLS policies)
-- Defined here (after profiles table) because sql-language functions validate table refs immediately
create or replace function is_admin()
returns boolean language sql security definer as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ----------------------------------------------------------------

-- children: perfil del niño, vinculado al padre
create table children (
  id         uuid primary key default uuid_generate_v4(),
  parent_id  uuid not null references profiles(id) on delete cascade,
  name       text not null,
  age        smallint not null check (age >= 3 and age <= 12),
  avatar_url text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------

-- modules: unidades de aprendizaje (animales, colores, números...)
create table modules (
  id               uuid primary key default uuid_generate_v4(),
  slug             text not null unique,
  title_es         text not null,
  title_en         text not null,
  description_es   text,
  cover_image_url  text,
  "order"          smallint not null default 0,
  is_published     boolean not null default false,
  created_by       uuid references profiles(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger modules_updated_at
  before update on modules
  for each row execute procedure set_updated_at();

-- ----------------------------------------------------------------

-- vocabulary_items: palabras y frases de cada módulo
create table vocabulary_items (
  id         uuid primary key default uuid_generate_v4(),
  module_id  uuid not null references modules(id) on delete cascade,
  text_en    text not null,       -- "pig"
  text_es    text not null,       -- "cerdo"
  image_url  text,
  audio_url  text,
  type       vocabulary_type not null default 'word',
  min_age    smallint not null default 4 check (min_age in (4, 6)),
  "order"    smallint not null default 0,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------

-- exercises: instancias de ejercicio dentro de un módulo
create table exercises (
  id         uuid primary key default uuid_generate_v4(),
  module_id  uuid not null references modules(id) on delete cascade,
  type       exercise_type not null,
  phase      exercise_phase not null default 'practice',
  -- Configuración específica por tipo:
  -- memory:      { "grid_size": "4x4" }
  -- recognition: { "choices": 4 }
  -- speaking:    { "show_text": true }
  config     jsonb not null default '{}',
  min_age    smallint not null default 4 check (min_age in (4, 6)),
  "order"    smallint not null default 0,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------

-- exercise_items: qué vocabulary_items entran en cada ejercicio
create table exercise_items (
  id                 uuid primary key default uuid_generate_v4(),
  exercise_id        uuid not null references exercises(id) on delete cascade,
  vocabulary_item_id uuid not null references vocabulary_items(id) on delete cascade,
  "order"            smallint not null default 0,
  unique (exercise_id, vocabulary_item_id)
);

-- ----------------------------------------------------------------

-- user_module_access: entitlements — única fuente de verdad de acceso
-- La app solo pregunta: ¿tiene este user acceso a este módulo?
-- No importa cómo lo consiguió (free, comprado, suscripción).
create table user_module_access (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles(id) on delete cascade,
  module_id   uuid not null references modules(id) on delete cascade,
  access_type access_type not null,
  expires_at  timestamptz,  -- null = permanente | fecha = suscripción
  created_at  timestamptz not null default now(),
  unique (user_id, module_id)
);

-- ----------------------------------------------------------------

-- child_word_status: dominio de vocabulario por niño (panel de palabras)
create table child_word_status (
  id                 uuid primary key default uuid_generate_v4(),
  child_id           uuid not null references children(id) on delete cascade,
  vocabulary_item_id uuid not null references vocabulary_items(id) on delete cascade,
  status             word_status not null default 'unseen',
  updated_at         timestamptz not null default now(),
  unique (child_id, vocabulary_item_id)
);

-- ----------------------------------------------------------------

-- evaluation_results: resultados de evaluaciones por módulo
create table evaluation_results (
  id              uuid primary key default uuid_generate_v4(),
  child_id        uuid not null references children(id) on delete cascade,
  module_id       uuid not null references modules(id) on delete cascade,
  score           smallint not null check (score >= 0 and score <= 100),
  -- passed se calcula automáticamente: ≥70 = aprobado
  passed          boolean not null generated always as (score >= 70) stored,
  -- ids de vocabulary_items fallados, para redirigir al repaso
  failed_item_ids uuid[] not null default '{}',
  completed_at    timestamptz not null default now()
);

-- ----------------------------------------------------------------

-- recordings: el "momento clave" — grabación final del niño hablando
-- unique (child_id, module_id): solo se guarda la última por módulo, nunca acumula
create table recordings (
  id         uuid primary key default uuid_generate_v4(),
  child_id   uuid not null references children(id) on delete cascade,
  module_id  uuid not null references modules(id) on delete cascade,
  audio_url  text not null,
  created_at timestamptz not null default now(),
  unique (child_id, module_id)
);

-- ----------------------------------------------------------------

-- content_generation_jobs: solicitudes de generación de contenido por IA
create table content_generation_jobs (
  id          uuid primary key default uuid_generate_v4(),
  created_by  uuid not null references profiles(id),
  module_id   uuid references modules(id),  -- null hasta que se aplica al módulo
  status      job_status not null default 'pending',
  -- Parámetros enviados a la IA: { topic, age_range, word_count, style }
  parameters  jsonb not null default '{}',
  -- Resultado: vocabulary_items y exercises generados (para revisión del admin)
  result      jsonb,
  error       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger content_generation_jobs_updated_at
  before update on content_generation_jobs
  for each row execute procedure set_updated_at();

-- ----------------------------------------------------------------

-- settings: configuración global editable desde admin sin deploy
create table settings (
  key        text primary key,
  value      jsonb not null,
  updated_by uuid references profiles(id),
  updated_at timestamptz not null default now()
);

create trigger settings_updated_at
  before update on settings
  for each row execute procedure set_updated_at();

-- ============================================================
-- INDEXES
-- ============================================================

create index on children              (parent_id);
create index on vocabulary_items      (module_id);
create index on exercises             (module_id);
create index on exercise_items        (exercise_id);
create index on exercise_items        (vocabulary_item_id);
create index on user_module_access    (user_id);
create index on user_module_access    (module_id);
create index on child_word_status     (child_id);
create index on evaluation_results    (child_id, module_id);
create index on recordings            (child_id);
create index on content_generation_jobs (created_by, status);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table profiles               enable row level security;
alter table children               enable row level security;
alter table modules                enable row level security;
alter table vocabulary_items       enable row level security;
alter table exercises              enable row level security;
alter table exercise_items         enable row level security;
alter table user_module_access     enable row level security;
alter table child_word_status      enable row level security;
alter table evaluation_results     enable row level security;
alter table recordings             enable row level security;
alter table content_generation_jobs enable row level security;
alter table settings               enable row level security;

-- profiles
create policy "users read own profile" on profiles
  for select using (auth.uid() = id);

create policy "users update own profile" on profiles
  for update using (auth.uid() = id);

create policy "admins read all profiles" on profiles
  for select using (is_admin());

-- children
create policy "parents manage own children" on children
  for all using (auth.uid() = parent_id);

create policy "admins read all children" on children
  for select using (is_admin());

-- modules
create policy "anyone reads published modules" on modules
  for select using (is_published = true);

create policy "admins manage modules" on modules
  for all using (is_admin());

-- vocabulary_items
create policy "anyone reads items of published modules" on vocabulary_items
  for select using (
    exists (select 1 from modules m where m.id = module_id and m.is_published = true)
  );

create policy "admins manage vocabulary items" on vocabulary_items
  for all using (is_admin());

-- exercises
create policy "anyone reads exercises of published modules" on exercises
  for select using (
    exists (select 1 from modules m where m.id = module_id and m.is_published = true)
  );

create policy "admins manage exercises" on exercises
  for all using (is_admin());

-- exercise_items
create policy "anyone reads exercise items of published modules" on exercise_items
  for select using (
    exists (
      select 1 from exercises e
      join modules m on m.id = e.module_id
      where e.id = exercise_id and m.is_published = true
    )
  );

create policy "admins manage exercise items" on exercise_items
  for all using (is_admin());

-- user_module_access
create policy "users read own access" on user_module_access
  for select using (auth.uid() = user_id);

create policy "admins manage all access" on user_module_access
  for all using (is_admin());

-- child_word_status
create policy "parents manage own children word status" on child_word_status
  for all using (
    exists (select 1 from children c where c.id = child_id and c.parent_id = auth.uid())
  );

create policy "admins read all word status" on child_word_status
  for select using (is_admin());

-- evaluation_results
create policy "parents manage own children results" on evaluation_results
  for all using (
    exists (select 1 from children c where c.id = child_id and c.parent_id = auth.uid())
  );

create policy "admins read all results" on evaluation_results
  for select using (is_admin());

-- recordings
create policy "parents manage own children recordings" on recordings
  for all using (
    exists (select 1 from children c where c.id = child_id and c.parent_id = auth.uid())
  );

create policy "admins read all recordings" on recordings
  for select using (is_admin());

-- content_generation_jobs
create policy "admins manage generation jobs" on content_generation_jobs
  for all using (is_admin());

-- settings
create policy "anyone reads settings" on settings
  for select using (true);

create policy "admins manage settings" on settings
  for all using (is_admin());

-- ============================================================
-- SEED — Configuración inicial
-- ============================================================

insert into settings (key, value) values
  ('active_ai_provider',    '"anthropic"'),
  ('onboarding_flow',       '"module_purchase"'),
  ('first_module_free',     'true'),
  ('ai_content_enabled',    'false');
