-- Phase 1 finalization: tag each property with the OC secretary/manager user.
alter table properties add column manager_id uuid references auth.users(id);
