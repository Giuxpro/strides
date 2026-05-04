-- ============================================================
-- Agrega updated_at a tablas con estado editable que lo faltaban
-- ============================================================

-- profiles
alter table profiles
  add column updated_at timestamptz not null default now();

create trigger profiles_updated_at
  before update on profiles
  for each row execute procedure set_updated_at();

-- children
alter table children
  add column updated_at timestamptz not null default now();

create trigger children_updated_at
  before update on children
  for each row execute procedure set_updated_at();

-- vocabulary_items
alter table vocabulary_items
  add column updated_at timestamptz not null default now();

create trigger vocabulary_items_updated_at
  before update on vocabulary_items
  for each row execute procedure set_updated_at();

-- exercises
alter table exercises
  add column updated_at timestamptz not null default now();

create trigger exercises_updated_at
  before update on exercises
  for each row execute procedure set_updated_at();
