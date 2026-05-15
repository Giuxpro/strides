-- Sistema de Access Codes: control de acceso y descuentos por código.
-- Orden: access_codes primero (subscriptions tiene FK a ella).

-- ── access_codes ──────────────────────────────────────────────────────────────
create table access_codes (
  id                      uuid primary key default uuid_generate_v4(),
  code                    text not null unique,
  label                   text not null,
  access_type             text not null check (access_type in ('trial', 'complimentary', 'discount', 'trial_plus_discount')),
  trial_days              int,
  discount_percent        int check (discount_percent between 1 and 100),
  discount_duration_months int,
  max_uses                int,
  used_count              int not null default 0,
  valid_from              timestamptz default now(),
  valid_until             timestamptz,
  is_active               boolean not null default true,
  created_by              uuid not null references profiles(id),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index on access_codes (code);
create index on access_codes (is_active);

create trigger access_codes_updated_at
  before update on access_codes
  for each row execute function set_updated_at();

alter table access_codes enable row level security;

create policy "authenticated users read codes" on access_codes
  for select to authenticated using (true);

create policy "admins manage all codes" on access_codes
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ── code_redemptions ──────────────────────────────────────────────────────────
create table code_redemptions (
  id             uuid primary key default uuid_generate_v4(),
  code_id        uuid not null references access_codes(id) on delete cascade,
  user_id        uuid not null references profiles(id) on delete cascade,
  context        text not null check (context in ('signup', 'account')),
  redeemed_at    timestamptz not null default now(),
  snapshot       jsonb not null,
  effect_applied jsonb not null,
  unique (user_id, code_id)
);

create index on code_redemptions (code_id);
create index on code_redemptions (user_id);

alter table code_redemptions enable row level security;

create policy "users read own redemptions" on code_redemptions
  for select using (auth.uid() = user_id);

create policy "users insert own redemption" on code_redemptions
  for insert with check (auth.uid() = user_id);

create policy "admins manage all redemptions" on code_redemptions
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ── subscriptions: añadir columnas y expandir constraint ─────────────────────
alter table subscriptions drop constraint if exists subscriptions_acquisition_type_check;
alter table subscriptions add constraint subscriptions_acquisition_type_check
  check (acquisition_type in ('trial', 'prepaid', 'complimentary'));

alter table subscriptions
  add column if not exists redeemed_code_id        uuid references access_codes(id) on delete set null,
  add column if not exists pending_discount_percent int check (pending_discount_percent between 1 and 100),
  add column if not exists pending_discount_months  int;

create index on subscriptions (redeemed_code_id);
