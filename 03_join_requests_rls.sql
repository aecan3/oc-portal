-- Phase 1.1: Join request workflow + RLS
-- Ensures owners can submit requests and managers can review/action
-- requests for properties they manage.

create table if not exists public.join_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists join_requests_property_status_idx
  on public.join_requests (property_id, status, created_at desc);

create index if not exists join_requests_user_status_idx
  on public.join_requests (user_id, status, created_at desc);

alter table public.join_requests enable row level security;

drop policy if exists "users can insert own join requests" on public.join_requests;
create policy "users can insert own join requests"
  on public.join_requests
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and status = 'pending'
  );

drop policy if exists "users can view own join requests" on public.join_requests;
create policy "users can view own join requests"
  on public.join_requests
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "managers can view requests for managed properties" on public.join_requests;
create policy "managers can view requests for managed properties"
  on public.join_requests
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.properties p
      where p.id = join_requests.property_id
        and p.manager_id = auth.uid()
    )
  );

drop policy if exists "managers can update requests for managed properties" on public.join_requests;
create policy "managers can update requests for managed properties"
  on public.join_requests
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.properties p
      where p.id = join_requests.property_id
        and p.manager_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.properties p
      where p.id = join_requests.property_id
        and p.manager_id = auth.uid()
    )
    and status in ('approved', 'rejected')
  );
