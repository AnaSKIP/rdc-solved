CREATE TABLE public.claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ra TEXT NOT NULL,
    stage TEXT NOT NULL,
    client_id TEXT,
    causer_name TEXT,
    analyst_id TEXT,
    insurance_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all actions on claims" ON public.claims FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID REFERENCES public.claims(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all actions on attachments" ON public.attachments FOR ALL USING (true) WITH CHECK (true);

DO $$
DECLARE
  claim1_id UUID;
  claim2_id UUID;
BEGIN
  INSERT INTO public.claims (ra, stage, client_id, causer_name, analyst_id, insurance_id, status, phone, date) VALUES
  ('12091/2024', 'Sem acordo', 'OD-101', 'Carlos Mendes', 'OD-102', 'OD-103', 'pending', NULL, '2024-08-10T10:00:00Z') RETURNING id INTO claim1_id;
  
  INSERT INTO public.claims (ra, stage, client_id, causer_name, analyst_id, insurance_id, status, phone, date) VALUES
  ('13402/2024', 'Repescagem', 'OD-108', 'Ana Oliveira', 'OD-109', 'OD-104', 'enriched', '+55 27 99999-0000', '2024-09-22T14:30:00Z') RETURNING id INTO claim2_id;
  
  INSERT INTO public.claims (ra, stage, client_id, causer_name, analyst_id, insurance_id, status, phone, date) VALUES
  ('14555/2024', 'Sem acordo', 'OD-110', 'Roberto Silva', 'OD-102', NULL, 'pending', NULL, '2024-10-05T09:15:00Z'),
  ('15002/2024', 'Repescagem', 'OD-101', 'Fernando Costa', 'OD-109', 'OD-103', 'pending', NULL, '2024-10-12T16:45:00Z');

  INSERT INTO public.attachments (claim_id, file_name, file_type) VALUES
  (claim2_id, 'boletim_ocorrencia.pdf', 'pdf'),
  (claim2_id, 'cnh_causador.jpg', 'image');

  FOR i IN 1..2118 LOOP
    INSERT INTO public.claims (ra, stage, client_id, causer_name, analyst_id, insurance_id, status, phone, date)
    VALUES (
      15002 + i || '/2024',
      CASE WHEN i % 2 = 0 THEN 'Sem acordo' ELSE 'Repescagem' END,
      CASE WHEN i % 3 = 0 THEN 'OD-101' WHEN i % 3 = 1 THEN 'OD-108' ELSE 'OD-110' END,
      'Causador ' || i,
      CASE WHEN i % 2 = 0 THEN 'OD-102' ELSE 'OD-109' END,
      CASE WHEN i % 4 = 0 THEN 'OD-103' WHEN i % 4 = 1 THEN 'OD-104' ELSE NULL END,
      'pending',
      NULL,
      NOW() - (i || ' hours')::interval
    );
  END LOOP;
END $$;
