-- Phase 1.4: Add explicit unit mapping to join requests
-- Supports accurate secretary-side building register assignment.

alter table public.join_requests
  add column if not exists unit_number text;

create index if not exists join_requests_property_unit_status_idx
  on public.join_requests (property_id, unit_number, status, created_at desc);
