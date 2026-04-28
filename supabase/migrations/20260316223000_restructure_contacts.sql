-- Drop old table and its references to restructure contacts
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'claims') THEN
    EXECUTE 'TRUNCATE TABLE public.claims CASCADE';
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'attachments') THEN
    EXECUTE 'TRUNCATE TABLE public.attachments CASCADE';
  END IF;
END $$;

DROP TABLE IF EXISTS public.contacts CASCADE;

-- Create clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cnpj TEXT,
  address TEXT,
  phone TEXT,
  monthly_fee NUMERIC,
  company_commission_rate NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create analysts table
CREATE TABLE public.analysts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cnpj TEXT,
  phone TEXT,
  address TEXT,
  monthly_fee NUMERIC,
  commission_rate NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create insurers table
CREATE TABLE public.insurers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create internal team table
CREATE TABLE public.internal_team (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  email TEXT,
  role TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_team ENABLE ROW LEVEL SECURITY;

-- Policies for Authenticated Users
CREATE POLICY "authenticated_all_clients" ON public.clients FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all_analysts" ON public.analysts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all_insurers" ON public.insurers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all_internal_team" ON public.internal_team FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed Initial Data
INSERT INTO public.clients (name, cnpj, address, phone, monthly_fee, company_commission_rate) VALUES
('Viação ABC', '12.345.678/0001-90', 'Rua das Flores, 123', '11988887777', 1500.00, 20),
('Expresso Sul Transportes', '99.888.777/0001-22', 'Av. Brasil, 456', '11912345678', 2500.00, 15);

INSERT INTO public.analysts (name, cnpj, phone, address, monthly_fee, commission_rate) VALUES
('Douglas Martins', '11.111.111/0001-11', '11977776666', 'Rua Augusta, 100', 0, 5),
('Ana Oliveira', '22.222.222/0001-22', '11966665555', 'Rua Bela Vista, 200', 0, 5);

INSERT INTO public.insurers (name, phone) VALUES
('Porto Seguro', '1133334444'),
('SulAmérica', '1144445555');

INSERT INTO public.internal_team (name, phone, address, email, role) VALUES
('Carlos Admin', '11900001111', 'Sede Principal', 'carlos@rdc.com', 'Administrador'),
('Julia RH', '11900002222', 'Sede Principal', 'julia@rdc.com', 'Recursos Humanos');
