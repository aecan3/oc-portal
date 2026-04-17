-- Phase 1.6: Occupancy status + request email capture
-- Supports cleaner member detail view and register mapping.

alter table public.profiles
  add column if not exists property_status text;

alter table public.join_requests
  add column if not exists property_status text,
  add column if not exists applicant_email text;

create index if not exists join_requests_property_status_status_idx
  on public.join_requests (property_id, property_status, status, created_at desc);
