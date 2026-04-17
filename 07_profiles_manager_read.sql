-- Phase 1.5: Allow managers to read profiles for their property's join requests.
-- This supports secretary-side Building Register name/email mapping.

drop policy if exists "managers can view profiles for managed join requests" on public.profiles;
create policy "managers can view profiles for managed join requests"
  on public.profiles
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.join_requests jr
      join public.properties p on p.id = jr.property_id
      where jr.user_id = profiles.id
        and p.manager_id = auth.uid()
        and jr.status in ('pending', 'approved')
    )
  );
