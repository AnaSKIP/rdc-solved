-- Create travel_plans and travel_hotels_kb tables for field survey travel logistics
CREATE TABLE IF NOT EXISTS public.travel_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID REFERENCES public.claims(id) ON DELETE CASCADE NOT NULL,
  destination_city TEXT DEFAULT 'Belo Horizonte',
  responsible_name TEXT DEFAULT '',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  reason TEXT DEFAULT '',
  related_company TEXT DEFAULT '',
  status TEXT DEFAULT 'Pendente',
  hotel_name TEXT DEFAULT '',
  hotel_daily_rate NUMERIC DEFAULT 0,
  hotel_qty INTEGER DEFAULT 0,
  hotel_status TEXT DEFAULT 'A consultar',
  bus_company_line TEXT DEFAULT '',
  bus_value NUMERIC DEFAULT 0,
  bus_date TIMESTAMPTZ,
  bus_status TEXT DEFAULT 'A consultar',
  air_company TEXT DEFAULT '',
  air_route TEXT DEFAULT '',
  air_value NUMERIC DEFAULT 0,
  air_date TIMESTAMPTZ,
  air_status TEXT DEFAULT 'A consultar',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.travel_hotels_kb (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination TEXT NOT NULL,
  hotel_name TEXT NOT NULL,
  address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  price_range TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  link_ref TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.travel_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_hotels_kb ENABLE ROW LEVEL SECURITY;

-- Idempotent policy creation
DROP POLICY IF EXISTS "Authenticated and Anon travel_plans" ON public.travel_plans;
CREATE POLICY "Authenticated and Anon travel_plans" ON public.travel_plans
  FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated and Anon travel_hotels_kb" ON public.travel_hotels_kb;
CREATE POLICY "Authenticated and Anon travel_hotels_kb" ON public.travel_hotels_kb
  FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);
