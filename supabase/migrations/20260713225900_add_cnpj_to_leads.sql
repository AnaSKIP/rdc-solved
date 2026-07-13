ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS cnpj TEXT;
ALTER TABLE public.claims ADD COLUMN IF NOT EXISTS company_cnpj TEXT;

CREATE OR REPLACE FUNCTION public.sync_lead_to_claim()
RETURNS TRIGGER AS $func$
DECLARE
  found_client_id UUID;
BEGIN
  IF NEW.cnpj IS NOT NULL THEN
    SELECT id INTO found_client_id FROM public.clients
    WHERE "CNPJ" = NEW.cnpj
       OR REPLACE(REPLACE(REPLACE(REPLACE("CNPJ", '.', ''), '/', ''), '-', ''), ' ', '')
         = REPLACE(REPLACE(REPLACE(REPLACE(NEW.cnpj, '.', ''), '/', ''), '-', ''), ' ', '')
    LIMIT 1;
  END IF;

  INSERT INTO public.claims (
    ra, causer_name, financial_total_value, stage, date, analyst_id, client_id, company_cnpj
  ) VALUES (
    COALESCE(NEW.ra, 'RA-' || substr(gen_random_uuid()::text, 1, 6)),
    NEW.empresa,
    NEW.valor,
    COALESCE(NEW.status, 'Atribuir'),
    COALESCE(NEW.data_entrada, NOW()),
    NEW.analista_id,
    found_client_id,
    NEW.cnpj
  );
  RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

DROP POLICY IF EXISTS "authenticated_select_leads" ON public.leads;
CREATE POLICY "authenticated_select_leads" ON public.leads
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_update_leads" ON public.leads;
CREATE POLICY "authenticated_update_leads" ON public.leads
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_insert_leads" ON public.leads;
CREATE POLICY "authenticated_insert_leads" ON public.leads
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_delete_leads" ON public.leads;
CREATE POLICY "authenticated_delete_leads" ON public.leads
  FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_select_clients" ON public.clients;
CREATE POLICY "authenticated_select_clients" ON public.clients
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_update_clients" ON public.clients;
CREATE POLICY "authenticated_update_clients" ON public.clients
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
