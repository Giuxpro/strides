-- ============================================================
-- lesson_vocabulary — las palabras que enseña cada lección.
-- Relación directa lección↔vocab, independiente de los ejercicios.
-- Antes el vocab de una lección vivía implícito dentro de sus
-- exercise_items; ahora la lección es dueña de su lista de palabras.
-- ============================================================

create table lesson_vocabulary (
  id                 uuid primary key default gen_random_uuid(),
  lesson_id          uuid not null references lessons(id) on delete cascade,
  vocabulary_item_id uuid not null references vocabulary_items(id) on delete cascade,
  "order"            smallint not null default 0,
  created_at         timestamptz not null default now(),
  unique (lesson_id, vocabulary_item_id)
);

create index on lesson_vocabulary (lesson_id);
create index on lesson_vocabulary (vocabulary_item_id);

alter table lesson_vocabulary enable row level security;

create policy "lesson_vocabulary_select" on lesson_vocabulary
  for select using (true);

create policy "lesson_vocabulary_admin_insert" on lesson_vocabulary
  for insert with check (is_admin());

create policy "lesson_vocabulary_admin_update" on lesson_vocabulary
  for update using (is_admin());

create policy "lesson_vocabulary_admin_delete" on lesson_vocabulary
  for delete using (is_admin());

-- Backfill: el vocab de cada lección = unión del vocab de sus ejercicios,
-- ordenado por la primera aparición. No pisa filas existentes.
insert into lesson_vocabulary (lesson_id, vocabulary_item_id, "order")
select lesson_id, vocabulary_item_id,
       (row_number() over (partition by lesson_id order by min_order) - 1)::smallint
from (
  select e.lesson_id, ei.vocabulary_item_id, min(ei."order") as min_order
  from exercises e
  join exercise_items ei on ei.exercise_id = e.id
  where e.lesson_id is not null
  group by e.lesson_id, ei.vocabulary_item_id
) sub
on conflict (lesson_id, vocabulary_item_id) do nothing;
