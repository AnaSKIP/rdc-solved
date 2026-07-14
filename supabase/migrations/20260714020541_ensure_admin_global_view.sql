-- Ensure the primary admin user has is_admin = true
UPDATE public.profiles
SET is_admin = true
WHERE email = 'anamaria@rdccobrancas.com.br';

-- Ensure all authenticated users can SELECT all claims (global admin view)
DROP POLICY IF EXISTS "authenticated_admin_select_claims" ON public.claims;
CREATE POLICY "authenticated_admin_select_claims" ON public.claims
  FOR SELECT TO authenticated USING (true);

-- Ensure all authenticated users can SELECT all analysts
DROP POLICY IF EXISTS "authenticated_admin_select_analysts" ON public.analysts;
CREATE POLICY "authenticated_admin_select_analysts" ON public.analysts
  FOR SELECT TO authenticated USING (true);

-- Ensure all authenticated users can SELECT all leads
DROP POLICY IF EXISTS "authenticated_admin_select_leads" ON public.leads;
CREATE POLICY "authenticated_admin_select_leads" ON public.leads
  FOR SELECT TO authenticated USING (true);
