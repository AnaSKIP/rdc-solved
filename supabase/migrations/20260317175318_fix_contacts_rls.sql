-- Re-apply RLS policies for all contact tables safely
DO $$ 
BEGIN
  -- Drop existing permissive policies that might be causing conflicts
  DROP POLICY IF EXISTS "authenticated_select_clients" ON public.clients;
  DROP POLICY IF EXISTS "authenticated_insert_clients" ON public.clients;
  DROP POLICY IF EXISTS "authenticated_update_clients" ON public.clients;
  DROP POLICY IF EXISTS "authenticated_delete_clients" ON public.clients;

  DROP POLICY IF EXISTS "authenticated_select_analysts" ON public.analysts;
  DROP POLICY IF EXISTS "authenticated_insert_analysts" ON public.analysts;
  DROP POLICY IF EXISTS "authenticated_update_analysts" ON public.analysts;
  DROP POLICY IF EXISTS "authenticated_delete_analysts" ON public.analysts;

  DROP POLICY IF EXISTS "authenticated_select_insurers" ON public.insurers;
  DROP POLICY IF EXISTS "authenticated_insert_insurers" ON public.insurers;
  DROP POLICY IF EXISTS "authenticated_update_insurers" ON public.insurers;
  DROP POLICY IF EXISTS "authenticated_delete_insurers" ON public.insurers;

  DROP POLICY IF EXISTS "authenticated_select_internal_team" ON public.internal_team;
  DROP POLICY IF EXISTS "authenticated_insert_internal_team" ON public.internal_team;
  DROP POLICY IF EXISTS "authenticated_update_internal_team" ON public.internal_team;
  DROP POLICY IF EXISTS "authenticated_delete_internal_team" ON public.internal_team;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Ensure RLS is explicitly enabled for all contact tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_team ENABLE ROW LEVEL SECURITY;

-- Create explicit policies for clients (Authenticated users get full CRUD access)
CREATE POLICY "authenticated_select_clients" ON public.clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_insert_clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update_clients" ON public.clients FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_delete_clients" ON public.clients FOR DELETE TO authenticated USING (true);

-- Create explicit policies for analysts
CREATE POLICY "authenticated_select_analysts" ON public.analysts FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_insert_analysts" ON public.analysts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update_analysts" ON public.analysts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_delete_analysts" ON public.analysts FOR DELETE TO authenticated USING (true);

-- Create explicit policies for insurers
CREATE POLICY "authenticated_select_insurers" ON public.insurers FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_insert_insurers" ON public.insurers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update_insurers" ON public.insurers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_delete_insurers" ON public.insurers FOR DELETE TO authenticated USING (true);

-- Create explicit policies for internal_team
CREATE POLICY "authenticated_select_internal_team" ON public.internal_team FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_insert_internal_team" ON public.internal_team FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update_internal_team" ON public.internal_team FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_delete_internal_team" ON public.internal_team FOR DELETE TO authenticated USING (true);
