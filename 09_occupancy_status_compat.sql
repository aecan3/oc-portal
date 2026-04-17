-- Phase 1.7: Compatibility patch for legacy property_status columns.
-- Ensures runtime code using occupancy_status works on existing databases.

alter table public.profiles
  add column if not exists occupancy_status text;

alter table public.join_requests
  add column if not exists occupancy_status text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'property_status'
  ) then
    execute '
      update public.profiles
      set occupancy_status = coalesce(occupancy_status, property_status)
      where occupancy_status is null
        and property_status is not null
    ';
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'join_requests'
      and column_name = 'property_status'
  ) then
    execute '
      update public.join_requests
      set occupancy_status = coalesce(occupancy_status, property_status)
      where occupancy_status is null
        and property_status is not null
    ';
  end if;
end $$;

create index if not exists join_requests_occupancy_status_status_idx
  on public.join_requests (property_id, occupancy_status, status, created_at desc);
