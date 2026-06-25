-- ============================================================
-- STRIDE — Registro revisable de evaluaciones por lección
-- ============================================================
-- Una fila por (child, lesson): guarda el ÚLTIMO examen rendido con
-- el detalle suficiente para re-renderizarlo en modo lectura (replay
-- fiel). Repetir la evaluación reemplaza la fila (upsert) e incrementa
-- el contador `attempts` para trazabilidad.
--
-- detail jsonb = array ordenado, una entrada por pregunta:
--   { "formatId": text, "vocabId": uuid, "correct": bool, "snapshot": object }
-- donde `snapshot` es el estado que renderizó cada formato + la
-- respuesta literal del niño, definido por cada componente de formato.
-- ----------------------------------------------------------------

create table child_evaluation_attempts (
  id          uuid primary key default uuid_generate_v4(),
  child_id    uuid not null references children(id) on delete cascade,
  lesson_id   uuid not null references lessons(id) on delete cascade,
  score       smallint check (score >= 0 and score <= 100),
  correct     smallint not null default 0,
  total       smallint not null default 0,
  stars       smallint not null default 0 check (stars >= 0 and stars <= 3),
  attempts    integer  not null default 1,
  detail      jsonb    not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (child_id, lesson_id)
);

create trigger child_evaluation_attempts_updated_at
  before update on child_evaluation_attempts
  for each row execute procedure set_updated_at();

create index on child_evaluation_attempts (child_id, lesson_id);

alter table child_evaluation_attempts enable row level security;

create policy "parents manage own children evaluation attempts" on child_evaluation_attempts
  for all using (
    exists (select 1 from children c where c.id = child_id and c.parent_id = auth.uid())
  );

create policy "admins read all evaluation attempts" on child_evaluation_attempts
  for select using (is_admin());
