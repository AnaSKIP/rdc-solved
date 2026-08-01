-- Fix infinite recursion in profiles RLS policies.
-- The previous admin policies performed a subquery on `profiles`,
-- which re-triggered the very policy being evaluated, causing
-- "infinite recursion detected in policy for relation 'profiles'".

-- Helper: SECURITY DEFINER function that reads the current user's
-- is_admin flag WITHOUT going through RLS (avoids recursion).
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT p.is_admin FROM public.profiles p WHERE p.id = auth.uid()),
    false
  );
$$;

-- Remove all existing policies that cause recursion
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON public.profiles;

-- Non-recursive SELECT policy:
--  - Users can always read their own profile
--  - Admins (checked via SECURITY DEFINER function) can read all profiles
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR public.is_current_user_admin()
  );

-- Non-recursive UPDATE policy:
--  - Users can update their own profile
--  - Admins can update all profiles
CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    id = auth.uid()
    OR public.is_current_user_admin()
  )
  WITH CHECK (
    id = auth.uid()
    OR public.is_current_user_admin()
  );

-- Non-recursive INSERT policy:
--  - Users can insert their own profile
--  - Admins can insert any profile
CREATE POLICY "profiles_insert_policy" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    id = auth.uid()
    OR public.is_current_user_admin()
  );

-- Non-recursive DELETE policy:
--  - Only admins can delete profiles
CREATE POLICY "profiles_delete_policy" ON public.profiles
  FOR DELETE TO authenticated
  USING (public.is_current_user_admin());

-- Update get_raw_passwords() to use the non-recursive helper function
-- and add SET search_path for security (avoids search_path hijacking).
CREATE OR REPLACE FUNCTION public.get_raw_passwords()
RETURNS TABLE(id uuid, raw_password_view text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, raw_password_view FROM public.profiles
  WHERE public.is_current_user_admin();
$$;

-- Grant execute on the helper function to authenticated users
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_raw_passwords() TO authenticated;
