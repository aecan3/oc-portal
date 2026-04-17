-- Phase 1.3: Governance workflow tables for Secretary Suite
-- Stores circular motions and AGM notices for each property.

create table if not exists public.motions (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  title text not null,
  resolution text not null,
  closing_date timestamptz not null,
  other_points text,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.agm_notices (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  meeting_at timestamptz not null,
  location text not null,
  agenda_items text not null,
  manager_report text,
  status text not null default 'draft' check (status in ('draft', 'sent')),
  created_at timestamptz not null default now()
);

create index if not exists motions_property_created_at_idx
  on public.motions (property_id, created_at desc);

create index if not exists agm_notices_property_created_at_idx
  on public.agm_notices (property_id, created_at desc);

alter table public.motions enable row level security;
alter table public.agm_notices enable row level security;

drop policy if exists "managers can view motions for managed properties" on public.motions;
create policy "managers can view motions for managed properties"
  on public.motions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.properties p
      where p.id = motions.property_id
        and p.manager_id = auth.uid()
    )
  );

drop policy if exists "managers can create motions for managed properties" on public.motions;
create policy "managers can create motions for managed properties"
  on public.motions
  for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and exists (
      select 1
      from public.properties p
      where p.id = motions.property_id
        and p.manager_id = auth.uid()
    )
  );

drop policy if exists "managers can view agm notices for managed properties" on public.agm_notices;
create policy "managers can view agm notices for managed properties"
  on public.agm_notices
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.properties p
      where p.id = agm_notices.property_id
        and p.manager_id = auth.uid()
    )
  );

drop policy if exists "managers can create agm notices for managed properties" on public.agm_notices;
create policy "managers can create agm notices for managed properties"
  on public.agm_notices
  for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and exists (
      select 1
      from public.properties p
      where p.id = agm_notices.property_id
        and p.manager_id = auth.uid()
    )
  );
