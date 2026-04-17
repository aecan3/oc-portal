-- Phase 1: OC Setup schema (Victorian Owners Corporations)

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  address text not null,
  plan_number text not null,
  total_lots integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.lots (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  lot_number text not null,
  liability_share integer not null,
  owner_id uuid null
);

alter table public.properties enable row level security;
alter table public.lots enable row level security;

-- Baseline Phase 1 policies (to be tightened to Admin roles in Phase 2)
create policy "authenticated users can select properties"
  on public.properties
  for select
  to authenticated
  using (true);

create policy "authenticated users can insert properties"
  on public.properties
  for insert
  to authenticated
  with check (true);

create policy "authenticated users can select lots"
  on public.lots
  for select
  to authenticated
  using (true);

create policy "authenticated users can insert lots"
  on public.lots
  for insert
  to authenticated
  with check (true);
