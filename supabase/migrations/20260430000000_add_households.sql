-- ============================================================
-- STRIDES — Households (multi-seat subscription model)
-- ============================================================
-- Un household agrupa al titular + sus miembros bajo una sola
-- suscripción. El titular paga; los miembros heredan el acceso.
-- Cada asiento puede ser un adulto (con login) o un niño (sin login).
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================

create type household_status as enum ('active', 'trial', 'inactive', 'cancelled');
create type household_member_type as enum ('owner', 'included', 'extra');

-- ============================================================
-- TABLES
-- ============================================================

-- households: una por titular, agrupa toda la suscripción
create table households (
  id            uuid primary key default uuid_generate_v4(),
  owner_id      uuid not null references profiles(id) on delete cascade,
  status        household_status not null default 'inactive',
  trial_ends_at timestamptz,
  expires_at    timestamptz,  -- null = suscripción activa indefinida (manual/admin)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (owner_id)   -- un titular = un household
);

create trigger households_updated_at
  before update on households
  for each row execute procedure set_updated_at();

create index on households (owner_id);

-- household_members: miembros del household
-- Exactamente uno de profile_id (adulto) o child_id (niño) debe estar seteado.
create table household_members (
  id           uuid primary key default uuid_generate_v4(),
  household_id uuid not null references households(id) on delete cascade,
  profile_id   uuid references profiles(id) on delete cascade,   -- adulto con login
  child_id     uuid references children(id) on delete cascade,   -- niño sin login
  member_type  household_member_type not null default 'included',
  joined_at    timestamptz not null default now(),

  -- Solo uno puede estar seteado
  constraint one_member_source check (
    (profile_id is not null and child_id is null) or
    (profile_id is null and child_id is not null)
  ),

  -- Sin duplicados por household
  unique nulls not distinct (household_id, profile_id),
  unique nulls not distinct (household_id, child_id)
);

create index on household_members (household_id);
create index on household_members (profile_id);
create index on household_members (child_id);

-- ============================================================
-- TRIGGER: al crear un household, agrega al titular como 'owner'
-- ============================================================

create or replace function add_owner_as_member()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  insert into household_members (household_id, profile_id, member_type)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;

create trigger on_household_created
  after insert on households
  for each row execute procedure add_owner_as_member();

-- ============================================================
-- FUNCTION: get_or_create_household
-- Llamar desde server actions cuando el usuario entra a la app.
-- Crea el household si no existe y devuelve el id.
-- ============================================================

create or replace function get_or_create_household(p_user_id uuid)
returns uuid language plpgsql security definer
set search_path = public
as $$
declare
  v_household_id uuid;
begin
  select id into v_household_id
  from households
  where owner_id = p_user_id;

  if v_household_id is null then
    insert into households (owner_id)
    values (p_user_id)
    returning id into v_household_id;
  end if;

  return v_household_id;
end;
$$;

-- ============================================================
-- FUNCTION: has_module_access
-- Única fuente de verdad para verificar acceso a un módulo.
-- Reemplaza la consulta directa a user_module_access en la UI.
-- Cubre: acceso directo del usuario + acceso heredado del household.
-- ============================================================

create or replace function has_module_access(p_user_id uuid, p_module_id uuid)
returns boolean language sql security definer
set search_path = public
as $$
  select exists (
    -- Acceso directo
    select 1 from user_module_access
    where user_id = p_user_id
      and module_id = p_module_id
      and (expires_at is null or expires_at > now())

    union all

    -- Acceso heredado: el usuario es miembro de un household
    -- cuyo titular tiene acceso al módulo
    select 1
    from household_members hm
    join households h on h.id = hm.household_id
    join user_module_access uma on uma.user_id = h.owner_id
    where hm.profile_id = p_user_id
      and uma.module_id = p_module_id
      and (uma.expires_at is null or uma.expires_at > now())
  )
$$;

-- ============================================================
-- RLS
-- ============================================================

alter table households enable row level security;
alter table household_members enable row level security;

-- households: el titular lee y gestiona el suyo; los miembros solo leen
create policy "owner manages own household" on households
  for all using (auth.uid() = owner_id);

create policy "members read their household" on households
  for select using (
    exists (
      select 1 from household_members
      where household_id = id
        and profile_id = auth.uid()
    )
  );

create policy "admins manage all households" on households
  for all using (is_admin());

-- household_members: el titular gestiona; los miembros leen los de su household
create policy "owner manages household members" on household_members
  for all using (
    exists (
      select 1 from households
      where id = household_id
        and owner_id = auth.uid()
    )
  );

create policy "members read own household roster" on household_members
  for select using (
    exists (
      select 1 from household_members hm2
      where hm2.household_id = household_id
        and hm2.profile_id = auth.uid()
    )
  );

create policy "admins manage all household members" on household_members
  for all using (is_admin());

-- ============================================================
-- SETTINGS: configuración de asientos (editable desde admin)
-- ============================================================

insert into settings (key, value) values
  ('household_included_seats',   '2'),        -- asientos incluidos en el plan base
  ('household_extra_seat_price', '2.99'),     -- USD por asiento adicional/mes
  ('household_max_seats',        'null')      -- null = sin límite máximo
on conflict (key) do nothing;
