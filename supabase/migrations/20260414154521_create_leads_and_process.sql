DO $$
BEGIN
  -- 1. Create leads table exactly as requested
  CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ra TEXT,
    empresa TEXT,
    valor NUMERIC,
    status TEXT,
    data_entrada TIMESTAMPTZ,
    analista_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- 2. Enable RLS
  ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

  -- 3. Drop and recreate policies for idempotency
  DROP POLICY IF EXISTS "authenticated_all_leads" ON public.leads;
  CREATE POLICY "authenticated_all_leads" ON public.leads FOR ALL TO authenticated USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "anon_all_leads" ON public.leads;
  CREATE POLICY "anon_all_leads" ON public.leads FOR ALL TO anon USING (true) WITH CHECK (true);

  -- 4. Create trigger function to sync leads to claims table 
  -- so the existing Kanban frontend (which reads from claims) shows the real data seamlessly 
  -- sem mock e atrelado à tabela original solicitada.
  CREATE OR REPLACE FUNCTION public.sync_lead_to_claim()
  RETURNS TRIGGER AS $func$
  BEGIN
    INSERT INTO public.claims (
      ra,
      causer_name,
      financial_total_value,
      stage,
      date,
      analyst_id
    ) VALUES (
      COALESCE(NEW.ra, 'RA-' || substr(gen_random_uuid()::text, 1, 6)),
      NEW.empresa,
      NEW.valor,
      COALESCE(NEW.status, 'Atribuir'),
      COALESCE(NEW.data_entrada, NOW()),
      NEW.analista_id
    );
    RETURN NEW;
  END;
  $func$ LANGUAGE plpgsql;

  -- 5. Attach trigger
  DROP TRIGGER IF EXISTS on_lead_inserted ON public.leads;
  CREATE TRIGGER on_lead_inserted
  AFTER INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.sync_lead_to_claim();

  -- 6. Ensure the storage bucket exists for attachments
  INSERT INTO storage.buckets (id, name, public) 
  VALUES ('claim_attachments', 'claim_attachments', true) 
  ON CONFLICT (id) DO NOTHING;

  -- 7. Storage RLS policies
  DROP POLICY IF EXISTS "Public Access claim_attachments" ON storage.objects;
  CREATE POLICY "Public Access claim_attachments" ON storage.objects FOR SELECT USING (bucket_id = 'claim_attachments');

  DROP POLICY IF EXISTS "Auth Insert claim_attachments" ON storage.objects;
  CREATE POLICY "Auth Insert claim_attachments" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'claim_attachments');

END $$;
