-- Separar billing de identidad de usuario.
-- profiles queda limpia: solo identidad (email, avatar, rol, nombre).
-- subscriptions centraliza todo el estado de acceso y billing.

create table subscriptions (
  id                      uuid primary key default uuid_generate_v4(),
  user_id                 uuid not null references profiles(id) on delete cascade,
  acquisition_type        text not null check (acquisition_type in ('trial', 'prepaid')),
  status                  text not null check (status in ('active', 'expired', 'pending_payment', 'cancelled')),
  trial_ends_at           timestamptz,            -- null si prepaid; fecha si trial
  stripe_customer_id      text,
  stripe_subscription_id  text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  unique (user_id)
);

create index on subscriptions (user_id);

alter table subscriptions enable row level security;

create policy "users read own subscription" on subscriptions
  for select using (auth.uid() = user_id);

create policy "users insert own subscription" on subscriptions
  for insert with check (auth.uid() = user_id);

create policy "admins manage all subscriptions" on subscriptions
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Trigger updated_at
create trigger subscriptions_updated_at
  before update on subscriptions
  for each row execute function set_updated_at();

-- Migrar datos existentes de profiles.trial_ends_at → subscriptions
insert into subscriptions (user_id, acquisition_type, status, trial_ends_at)
select
  p.id,
  'trial',
  case
    when p.trial_ends_at is null or p.trial_ends_at > now() then 'active'
    else 'expired'
  end,
  p.trial_ends_at
from profiles p
where p.role != 'admin'
  and not exists (select 1 from subscriptions s where s.user_id = p.id);

-- Limpiar profiles: eliminar campo billing
alter table profiles drop column if exists trial_ends_at;
