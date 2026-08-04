-- Create travel_plans and travel_hotels_kb tables for Travel Planning Module
CREATE TABLE IF NOT EXISTS public.travel_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID REFERENCES public.claims(id) ON DELETE CASCADE NOT NULL,
  destination_city TEXT NOT NULL DEFAULT '',
  responsible_name TEXT NOT NULL DEFAULT '',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  reason TEXT NOT NULL DEFAULT '',
  related_company TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Pendente',

  -- Hotel section
  hotel_name TEXT DEFAULT '',
  hotel_daily_rate NUMERIC DEFAULT 0,
  hotel_qty INTEGER DEFAULT 0,
  hotel_status TEXT DEFAULT 'A consultar',

  -- Bus section
  bus_company_line TEXT DEFAULT '',
  bus_value NUMERIC DEFAULT 0,
  bus_date TIMESTAMPTZ,
  bus_status TEXT DEFAULT 'A consultar',

  -- Air section
  air_company TEXT DEFAULT '',
  air_route TEXT DEFAULT '',
  air_value NUMERIC DEFAULT 0,
  air_date TIMESTAMPTZ,
  air_status TEXT DEFAULT 'A consultar',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.travel_hotels_kb (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination TEXT NOT NULL DEFAULT '',
  hotel_name TEXT NOT NULL DEFAULT '',
  price_range TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  link_ref TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.travel_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_hotels_kb ENABLE ROW LEVEL SECURITY;

-- Policies for travel_plans
DROP POLICY IF EXISTS "travel_plans_select" ON public.travel_plans;
CREATE POLICY "travel_plans_select" ON public.travel_plans
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "travel_plans_insert" ON public.travel_plans;
CREATE POLICY "travel_plans_insert" ON public.travel_plans
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "travel_plans_update" ON public.travel_plans;
CREATE POLICY "travel_plans_update" ON public.travel_plans
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "travel_plans_delete" ON public.travel_plans;
CREATE POLICY "travel_plans_delete" ON public.travel_plans
  FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "travel_plans_anon_all" ON public.travel_plans;
CREATE POLICY "travel_plans_anon_all" ON public.travel_plans
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- Policies for travel_hotels_kb
DROP POLICY IF EXISTS "travel_hotels_kb_select" ON public.travel_hotels_kb;
CREATE POLICY "travel_hotels_kb_select" ON public.travel_hotels_kb
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "travel_hotels_kb_anon_select" ON public.travel_hotels_kb;
CREATE POLICY "travel_hotels_kb_anon_select" ON public.travel_hotels_kb
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "travel_hotels_kb_all_auth" ON public.travel_hotels_kb;
CREATE POLICY "travel_hotels_kb_all_auth" ON public.travel_hotels_kb
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
