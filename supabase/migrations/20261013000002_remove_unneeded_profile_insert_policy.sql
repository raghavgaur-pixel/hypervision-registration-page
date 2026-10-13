-- The auth.users trigger creates profiles before the user signs in.
-- Browser clients must not be able to manufacture profile rows directly.
drop policy if exists "Users can insert their own profile" on public.profiles;
