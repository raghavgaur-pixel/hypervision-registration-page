-- Restrict the exposed profile API to the operations the frontend actually needs.
-- The auth.users trigger creates profiles; clients only need to read their own row
-- and update the display name. RLS remains the row-level authorization boundary.

revoke all privileges on table public.profiles from anon, authenticated;

grant select on table public.profiles to authenticated;
grant update (display_name) on table public.profiles to authenticated;

-- These functions are invoked by their registered triggers, not through the
-- PostgREST RPC API. Do not let API roles call them directly.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
revoke execute on function public.set_profile_updated_at() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
